# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }
"""ReferralRail v2 multi-position campaign escrow contract.

This file is intentionally separate from the frozen v1 contract. Campaign
capacity is backed by escrow units, reservations occupy a unit temporarily,
and terminal non-success returns that unit to campaign capacity while intake
is open. Only finalized OutcomeJudgeV2 records can change a position outcome.
"""
from dataclasses import dataclass
from datetime import datetime, timezone
import typing
import hashlib

import genlayer as gl

try:
    allow_storage = gl.allow_storage
except AttributeError:
    allow_storage = gl.storage.allow

ZERO = gl.Address("0x0000000000000000000000000000000000000000")

CAMPAIGN_ACTIVE = 1
CAMPAIGN_RESOLVING = 2
CAMPAIGN_REFUNDED = 3
CAMPAIGN_CANCELLED = 4

POS_RESERVED = 1
POS_ACCEPTED = 2
POS_JUDGING = 3
POS_INCONCLUSIVE = 4
POS_COMPLETED = 5
POS_PAID = 6
POS_FAILED = 7
POS_EXPIRED = 8
POS_DECLINED = 9

OUTCOME_NONE = 0
OUTCOME_COMPLETED = 1
OUTCOME_NOT_COMPLETED = 2
OUTCOME_INCONCLUSIVE = 3

MIN_SECONDS = 60
MAX_SECONDS = 45 * 24 * 60 * 60
MAX_POSITIONS = 1000
MAX_ATTEMPTS = 2
JUDGMENT_TIMEOUT = 24 * 60 * 60
RETRY_WINDOW = 24 * 60 * 60
MAX_TEXT = 2600


def now_ts() -> int:
    return int(datetime.now(timezone.utc).timestamp())


def text(value: typing.Any, size: int = MAX_TEXT) -> str:
    return " ".join(str(value).strip().split())[:size]


def owner_ok(value: str) -> bool:
    s = str(value).strip()
    return 0 < len(s) <= 39 and s[0] != "-" and s[-1] != "-" and all(c.isalnum() or c == "-" for c in s)


def repo_ok(value: str) -> bool:
    s = str(value).strip()
    return 0 < len(s) <= 100 and s not in (".", "..") and all(c.isalnum() or c in "-_." for c in s)


def state_name(code: int) -> str:
    return {1: "ACTIVE", 2: "RESOLVING", 3: "REFUNDED", 4: "CANCELLED"}.get(code, "UNKNOWN")


def position_name(code: int) -> str:
    return {1: "RESERVED", 2: "ACCEPTED", 3: "JUDGING", 4: "INCONCLUSIVE", 5: "COMPLETED", 6: "PAID", 7: "FAILED", 8: "EXPIRED", 9: "DECLINED"}.get(code, "UNKNOWN")


def outcome_name(code: int) -> str:
    return {0: "NONE", 1: "COMPLETED", 2: "NOT_COMPLETED", 3: "INCONCLUSIVE"}.get(code, "UNKNOWN")


def digest(value: str) -> str:
    return hashlib.sha256(str(value).encode("utf-8")).hexdigest()


@allow_storage
@dataclass
class Campaign:
    employer: gl.Address
    title: str
    brief: str
    criteria: str
    repo_owner: str
    repo_name: str
    base_branch: str
    max_positions: gl.u256
    candidate_reward: gl.u256
    referral_reward: gl.u256
    unit_funding: gl.u256
    initial_funding: gl.u256
    participation_deadline: gl.u256
    reservation_window: gl.u256
    work_duration: gl.u256
    max_pending_per_referrer: gl.u256
    state: gl.u256
    next_position_id: gl.u256
    occupied: gl.u256
    successful: gl.u256
    failed: gl.u256
    paid_total: gl.u256
    refunded_total: gl.u256
    created_at: gl.u256
    closed_at: gl.u256


@allow_storage
@dataclass
class Position:
    campaign_id: gl.u256
    position_id: gl.u256
    candidate: gl.Address
    referrer: gl.Address
    github_login: str
    challenge: str
    state: gl.u256
    reserved_at: gl.u256
    reservation_deadline: gl.u256
    accepted_at: gl.u256
    work_deadline: gl.u256
    pr_number: gl.u256
    attempts: gl.u256
    active_attempt: gl.u256
    judgment_timeout: gl.u256
    retry_deadline: gl.u256
    outcome: gl.u256
    evidence_digest: str
    reason: str
    candidate_paid: bool
    referrer_paid: bool
    terminal_reason: str


class CampaignCreated(gl.chain.Event):
    def __init__(self, campaign_id: gl.u256, employer: gl.Address, /, **blob): ...


class PositionReserved(gl.chain.Event):
    def __init__(self, campaign_id: gl.u256, position_id: gl.u256, /, **blob): ...


class PositionTransition(gl.chain.Event):
    def __init__(self, campaign_id: gl.u256, position_id: gl.u256, /, **blob): ...


class JudgmentRequested(gl.chain.Event):
    def __init__(self, campaign_id: gl.u256, position_id: gl.u256, attempt_id: gl.u256, /, **blob): ...


class CampaignSettled(gl.chain.Event):
    def __init__(self, campaign_id: gl.u256, amount: gl.u256, /, **blob): ...


def contract_at(address: gl.Address):
    getter = getattr(gl, "get_contract_at", None)
    if getter is not None:
        return getter(address)
    module = getattr(gl, "contract", None)
    getter = getattr(module, "get_contract_at", None) or getattr(module, "get_at", None)
    if getter is None:
        raise AttributeError("GenVM contract proxy unavailable")
    return getter(address)


class ReferralRailV2(gl.contract.Contract):
    owner: gl.Address
    judge_address: gl.Address
    next_campaign_id: gl.u256
    campaigns: gl.storage.TreeMap[gl.u256, Campaign]
    positions: gl.storage.TreeMap[gl.u256, Position]
    position_exists: gl.storage.TreeMap[gl.u256, bool]
    used_github: gl.storage.TreeMap[str, bool]
    total_funded: gl.u256
    total_paid: gl.u256
    total_refunded: gl.u256

    def __init__(self):
        self.owner = gl.message.sender_address
        self.judge_address = ZERO
        self.next_campaign_id = gl.u256(1)
        self.total_funded = gl.u256(0)
        self.total_paid = gl.u256(0)
        self.total_refunded = gl.u256(0)

    def _campaign(self, cid: gl.u256) -> Campaign:
        if int(cid) <= 0 or int(cid) >= int(self.next_campaign_id):
            raise gl.vm.UserError("unknown campaign")
        return self.campaigns[cid]

    def _key(self, cid: int, pid: int) -> gl.u256:
        return gl.u256(cid * 1000000 + pid)

    def _position(self, cid: gl.u256, pid: gl.u256) -> Position:
        key = self._key(int(cid), int(pid))
        if not bool(self.position_exists.get(key) or False):
            raise gl.vm.UserError("unknown position")
        return self.positions[key]

    def _unit(self, c: Campaign) -> int:
        return int(c.unit_funding)

    def _transition(self, cid: gl.u256, p: Position, state: int, reason: str = "") -> None:
        old = int(p.state)
        p.state = gl.u256(state)
        if reason:
            p.terminal_reason = text(reason, 160)
        PositionTransition(cid, p.position_id, previous=old, current=state, reason=text(reason, 160)).emit()

    def _release_slot(self, c: Campaign, p: Position, state: int, reason: str) -> None:
        if int(c.occupied) <= 0:
            raise gl.vm.UserError("capacity invariant violated")
        c.occupied = gl.u256(int(c.occupied) - 1)
        c.failed = gl.u256(int(c.failed) + 1)
        self._transition(p.campaign_id, p, state, reason)

    def _send(self, recipient: gl.Address, amount: int) -> None:
        if amount > 0:
            _Recipient(recipient).emit_transfer(value=gl.u256(amount))

    @gl.public.write
    def set_judge(self, judge_address: str) -> None:
        if gl.message.sender_address != self.owner or self.judge_address != ZERO or int(self.next_campaign_id) != 1:
            raise gl.vm.UserError("judge binding is not available")
        judge = gl.Address(judge_address)
        if judge == ZERO or judge == self.owner:
            raise gl.vm.UserError("invalid judge")
        self.judge_address = judge

    @gl.public.write.payable
    def create_campaign(self, title: str, brief: str, criteria: str, repo_owner: str, repo_name: str, base_branch: str, max_positions: gl.u256, candidate_reward: gl.u256, referral_reward: gl.u256, reservation_window_seconds: gl.u256, work_duration_seconds: gl.u256, campaign_duration_seconds: gl.u256, max_pending_per_referrer: gl.u256) -> gl.u256:
        if self.judge_address == ZERO:
            raise gl.vm.UserError("judge is not configured")
        if not 3 <= len(text(title, 120)) or len(text(brief)) < 20 or len(text(criteria)) < 20:
            raise gl.vm.UserError("campaign text is incomplete")
        if not owner_ok(repo_owner) or not repo_ok(repo_name) or len(text(base_branch, 120)) == 0:
            raise gl.vm.UserError("invalid repository configuration")
        n = int(max_positions)
        rw = int(reservation_window_seconds)
        wd = int(work_duration_seconds)
        cd = int(campaign_duration_seconds)
        if n <= 0 or n > MAX_POSITIONS or int(candidate_reward) <= 0 or int(referral_reward) <= 0:
            raise gl.vm.UserError("invalid campaign economics")
        if rw < MIN_SECONDS or rw > MAX_SECONDS or wd < MIN_SECONDS or wd > MAX_SECONDS or cd <= wd or cd > MAX_SECONDS:
            raise gl.vm.UserError("campaign timing is outside protocol bounds")
        pending = int(max_pending_per_referrer)
        if pending <= 0 or pending > n:
            raise gl.vm.UserError("invalid pending referral bound")
        unit = int(candidate_reward) + int(referral_reward)
        funding = n * unit
        if int(gl.message.value) != funding:
            raise gl.vm.UserError("funding must equal capacity times both rewards")
        cid = gl.u256(int(self.next_campaign_id))
        self.next_campaign_id = gl.u256(int(self.next_campaign_id) + 1)
        now = now_ts()
        self.campaigns[cid] = Campaign(gl.message.sender_address, text(title, 120), text(brief), text(criteria), str(repo_owner).strip(), str(repo_name).strip(), text(base_branch, 120), gl.u256(n), gl.u256(int(candidate_reward)), gl.u256(int(referral_reward)), gl.u256(unit), gl.u256(funding), gl.u256(now + cd), gl.u256(rw), gl.u256(wd), gl.u256(pending), gl.u256(CAMPAIGN_ACTIVE), gl.u256(1), gl.u256(0), gl.u256(0), gl.u256(0), gl.u256(0), gl.u256(0), gl.u256(now), gl.u256(0))
        self.total_funded = gl.u256(int(self.total_funded) + funding)
        CampaignCreated(cid, gl.message.sender_address, funding=funding, max_positions=n).emit()
        return cid

    @gl.public.write
    def create_referral(self, campaign_id: gl.u256, candidate_address: str) -> gl.u256:
        c = self._campaign(campaign_id)
        now = now_ts()
        if int(c.state) != CAMPAIGN_ACTIVE or now > int(c.participation_deadline):
            raise gl.vm.UserError("campaign intake is closed")
        if int(c.occupied) >= int(c.max_positions):
            raise gl.vm.UserError("no funded position is available")
        candidate = gl.Address(candidate_address)
        referrer = gl.message.sender_address
        if candidate == ZERO or candidate == referrer or candidate == c.employer or referrer == c.employer:
            raise gl.vm.UserError("campaign roles must be distinct")
        pid = gl.u256(int(c.next_position_id))
        c.next_position_id = gl.u256(int(c.next_position_id) + 1)
        p = Position(campaign_id, pid, candidate, referrer, "", "", gl.u256(POS_RESERVED), gl.u256(now), gl.u256(min(now + int(c.reservation_window), int(c.participation_deadline))), gl.u256(0), gl.u256(0), gl.u256(0), gl.u256(0), gl.u256(0), gl.u256(0), gl.u256(0), gl.u256(OUTCOME_NONE), "", "", False, False, "")
        key = self._key(int(campaign_id), int(pid))
        self.positions[key] = p
        self.position_exists[key] = True
        c.occupied = gl.u256(int(c.occupied) + 1)
        PositionReserved(campaign_id, pid, candidate=candidate.as_hex, referrer=referrer.as_hex, reservation_deadline=int(p.reservation_deadline)).emit()
        return pid

    @gl.public.write
    def accept_referral(self, campaign_id: gl.u256, position_id: gl.u256, github_login: str) -> None:
        c = self._campaign(campaign_id); p = self._position(campaign_id, position_id); now = now_ts()
        if int(p.state) != POS_RESERVED or gl.message.sender_address != p.candidate or now > int(p.reservation_deadline):
            raise gl.vm.UserError("reservation cannot be accepted")
        login = text(github_login, 39)
        if not owner_ok(login):
            raise gl.vm.UserError("invalid GitHub login")
        identity = str(int(campaign_id)) + ":" + str(int(position_id)) + ":" + p.candidate.as_hex.lower() + ":" + login.lower()
        if bool(self.used_github.get(identity) or False):
            raise gl.vm.UserError("GitHub identity is already bound in this campaign")
        self.used_github[identity] = True
        challenge = "ReferralRailV2:" + str(int(campaign_id)) + ":" + str(int(position_id)) + ":" + p.candidate.as_hex + ":" + digest(identity)[:32]
        p.github_login = login; p.challenge = challenge; p.accepted_at = gl.u256(now); p.work_deadline = gl.u256(min(now + int(c.work_duration), int(c.participation_deadline)))
        self._transition(campaign_id, p, POS_ACCEPTED, "candidate accepted")

    @gl.public.write
    def decline_referral(self, campaign_id: gl.u256, position_id: gl.u256) -> None:
        c = self._campaign(campaign_id); p = self._position(campaign_id, position_id)
        if int(p.state) != POS_RESERVED or gl.message.sender_address not in (p.candidate, p.referrer):
            raise gl.vm.UserError("reservation cannot be declined")
        self._release_slot(c, p, POS_DECLINED, "candidate declined")

    @gl.public.write
    def release_referral(self, campaign_id: gl.u256, position_id: gl.u256) -> None:
        c = self._campaign(campaign_id); p = self._position(campaign_id, position_id)
        if int(p.state) != POS_RESERVED or gl.message.sender_address != p.referrer:
            raise gl.vm.UserError("only the referrer can release a reservation")
        self._release_slot(c, p, POS_EXPIRED, "referrer released reservation")

    def _request_judgment(self, c: Campaign, p: Position) -> None:
        if self.judge_address == ZERO:
            raise gl.vm.UserError("judge is not configured")
        p.attempts = gl.u256(int(p.attempts) + 1); p.active_attempt = p.attempts; p.judgment_timeout = gl.u256(now_ts() + JUDGMENT_TIMEOUT)
        self._transition(p.campaign_id, p, POS_JUDGING, "judgment requested")
        judge = contract_at(self.judge_address)
        judge.emit(on="finalized").evaluate(int(p.campaign_id), int(p.position_id), int(p.active_attempt), c.repo_owner, c.repo_name, c.base_branch, int(p.pr_number), p.github_login, p.challenge, c.brief, c.criteria, int(p.accepted_at), int(p.work_deadline))
        JudgmentRequested(p.campaign_id, p.position_id, p.active_attempt).emit()

    @gl.public.write
    def submit_work(self, campaign_id: gl.u256, position_id: gl.u256, pr_number: gl.u256) -> None:
        c = self._campaign(campaign_id); p = self._position(campaign_id, position_id); now = now_ts()
        if int(p.state) != POS_ACCEPTED or gl.message.sender_address != p.candidate or int(pr_number) <= 0 or now > int(p.work_deadline):
            raise gl.vm.UserError("work submission is not allowed")
        p.pr_number = pr_number
        self._request_judgment(c, p)

    @gl.public.write
    def retry_inconclusive(self, campaign_id: gl.u256, position_id: gl.u256, pr_number: gl.u256) -> None:
        c = self._campaign(campaign_id); p = self._position(campaign_id, position_id); now = now_ts()
        if int(p.state) != POS_INCONCLUSIVE or gl.message.sender_address != p.candidate or int(p.attempts) >= MAX_ATTEMPTS or now > int(p.retry_deadline) or int(pr_number) <= 0:
            raise gl.vm.UserError("inconclusive retry is not allowed")
        p.pr_number = pr_number
        self._request_judgment(c, p)

    @gl.public.write
    def resolve_judgment(self, campaign_id: gl.u256, position_id: gl.u256, attempt_id: gl.u256) -> None:
        c = self._campaign(campaign_id); p = self._position(campaign_id, position_id)
        if int(p.state) != POS_JUDGING or int(p.active_attempt) != int(attempt_id):
            raise gl.vm.UserError("judgment is not pending")
        judge = contract_at(self.judge_address)
        record = judge.view().get_judgment(int(campaign_id), int(position_id), int(attempt_id))
        outcome = int(record.get("outcome_code", 0))
        if outcome not in (OUTCOME_COMPLETED, OUTCOME_NOT_COMPLETED, OUTCOME_INCONCLUSIVE):
            raise gl.vm.UserError("no finalized judgment exists")
        p.outcome = gl.u256(outcome); p.evidence_digest = text(record.get("evidence_digest", ""), 180); p.reason = text(record.get("reason", ""), 700)
        if outcome == OUTCOME_COMPLETED:
            c.successful = gl.u256(int(c.successful) + 1); self._transition(campaign_id, p, POS_COMPLETED, "GenLayer completed the work")
        elif outcome == OUTCOME_NOT_COMPLETED:
            self._release_slot(c, p, POS_FAILED, "GenLayer found mandatory requirements incomplete")
        else:
            self._transition(campaign_id, p, POS_INCONCLUSIVE, "evidence was inconclusive")
            p.retry_deadline = gl.u256(now_ts() if int(p.attempts) >= MAX_ATTEMPTS else now_ts() + RETRY_WINDOW)
        if int(c.successful) >= int(c.max_positions):
            c.state = gl.u256(CAMPAIGN_RESOLVING); c.closed_at = gl.u256(now_ts())

    @gl.public.write
    def settle_position(self, campaign_id: gl.u256, position_id: gl.u256) -> None:
        c = self._campaign(campaign_id); p = self._position(campaign_id, position_id)
        if int(p.state) != POS_COMPLETED:
            raise gl.vm.UserError("position is not completed")
        if not p.candidate_paid:
            p.candidate_paid = True; self._send(p.candidate, int(c.candidate_reward)); c.paid_total = gl.u256(int(c.paid_total) + int(c.candidate_reward)); self.total_paid = gl.u256(int(self.total_paid) + int(c.candidate_reward))
        if not p.referrer_paid:
            p.referrer_paid = True; self._send(p.referrer, int(c.referral_reward)); c.paid_total = gl.u256(int(c.paid_total) + int(c.referral_reward)); self.total_paid = gl.u256(int(self.total_paid) + int(c.referral_reward))
        self._transition(campaign_id, p, POS_PAID, "both payout legs released")

    def _recover(self, c: Campaign, p: Position, reason: str) -> None:
        if int(p.state) == POS_RESERVED and now_ts() > int(p.reservation_deadline):
            self._release_slot(c, p, POS_EXPIRED, reason); return
        if int(p.state) == POS_ACCEPTED and now_ts() > int(p.work_deadline):
            self._release_slot(c, p, POS_EXPIRED, reason); return
        if int(p.state) == POS_JUDGING and now_ts() > int(p.judgment_timeout):
            self._release_slot(c, p, POS_FAILED, reason); return
        if int(p.state) == POS_INCONCLUSIVE and (int(p.attempts) >= MAX_ATTEMPTS or now_ts() > int(p.retry_deadline)):
            self._release_slot(c, p, POS_FAILED, reason); return
        raise gl.vm.UserError("position is not recoverable")

    @gl.public.write
    def recover_position(self, campaign_id: gl.u256, position_id: gl.u256) -> None:
        c = self._campaign(campaign_id); p = self._position(campaign_id, position_id); self._recover(c, p, "permissionless timeout recovery")

    @gl.public.write
    def close_intake(self, campaign_id: gl.u256) -> None:
        c = self._campaign(campaign_id)
        if gl.message.sender_address != c.employer or int(c.state) != CAMPAIGN_ACTIVE:
            raise gl.vm.UserError("intake cannot be closed")
        c.state = gl.u256(CAMPAIGN_RESOLVING); c.closed_at = gl.u256(now_ts())

    @gl.public.write
    def finalise_campaign(self, campaign_id: gl.u256) -> None:
        c = self._campaign(campaign_id)
        if int(c.state) != CAMPAIGN_RESOLVING or int(c.occupied) != 0 or int(c.successful) + int(c.failed) < int(c.max_positions) and now_ts() <= int(c.participation_deadline):
            raise gl.vm.UserError("campaign still has unresolved or legally replaceable positions")
        available = int(c.max_positions) - int(c.successful)
        amount = available * self._unit(c)
        if amount <= 0 or int(c.state) == CAMPAIGN_REFUNDED:
            raise gl.vm.UserError("no refundable campaign escrow")
        c.refunded_total = gl.u256(int(c.refunded_total) + amount); self.total_refunded = gl.u256(int(self.total_refunded) + amount); c.state = gl.u256(CAMPAIGN_REFUNDED); self._send(c.employer, amount); CampaignSettled(campaign_id, gl.u256(amount), terminal="REFUNDED").emit()

    @gl.public.write
    def cancel_campaign(self, campaign_id: gl.u256) -> None:
        c = self._campaign(campaign_id)
        if gl.message.sender_address != c.employer or int(c.state) != CAMPAIGN_ACTIVE or int(c.occupied) != 0:
            raise gl.vm.UserError("campaign cannot be cancelled")
        amount = int(c.initial_funding); c.refunded_total = gl.u256(amount); self.total_refunded = gl.u256(int(self.total_refunded) + amount); c.state = gl.u256(CAMPAIGN_CANCELLED); self._send(c.employer, amount); CampaignSettled(campaign_id, gl.u256(amount), terminal="CANCELLED").emit()

    def _campaign_dict(self, cid: gl.u256, c: Campaign) -> dict:
        return {"id": int(cid), "employer": c.employer.as_hex, "title": c.title, "brief": c.brief, "criteria": c.criteria, "repo_owner": c.repo_owner, "repo_name": c.repo_name, "base_branch": c.base_branch, "max_positions": int(c.max_positions), "successful": int(c.successful), "occupied": int(c.occupied), "open_positions": int(c.max_positions) - int(c.occupied), "failed": int(c.failed), "candidate_reward": int(c.candidate_reward), "referral_reward": int(c.referral_reward), "unit_funding": int(c.unit_funding), "initial_funding": int(c.initial_funding), "paid_total": int(c.paid_total), "refunded_total": int(c.refunded_total), "locked_total": int(c.initial_funding) - int(c.paid_total) - int(c.refunded_total), "participation_deadline": int(c.participation_deadline), "state": state_name(int(c.state)), "state_code": int(c.state), "created_at": int(c.created_at), "closed_at": int(c.closed_at)}

    @gl.public.view
    def get_campaign(self, campaign_id: gl.u256) -> dict:
        return self._campaign_dict(campaign_id, self._campaign(campaign_id))

    @gl.public.view
    def get_position(self, campaign_id: gl.u256, position_id: gl.u256) -> dict:
        p = self._position(campaign_id, position_id)
        return {"campaign_id": int(p.campaign_id), "position_id": int(p.position_id), "candidate": p.candidate.as_hex, "referrer": p.referrer.as_hex, "github_login": p.github_login, "challenge": p.challenge, "state": position_name(int(p.state)), "state_code": int(p.state), "reserved_at": int(p.reserved_at), "reservation_deadline": int(p.reservation_deadline), "accepted_at": int(p.accepted_at), "work_deadline": int(p.work_deadline), "pr_number": int(p.pr_number), "attempts": int(p.attempts), "active_attempt": int(p.active_attempt), "judgment_timeout": int(p.judgment_timeout), "retry_deadline": int(p.retry_deadline), "outcome": outcome_name(int(p.outcome)), "outcome_code": int(p.outcome), "evidence_digest": p.evidence_digest, "reason": p.reason, "candidate_paid": bool(p.candidate_paid), "referrer_paid": bool(p.referrer_paid), "settlement_released": bool(p.candidate_paid and p.referrer_paid), "terminal_reason": p.terminal_reason}

    @gl.public.view
    def list_campaigns(self, offset: gl.u256 = gl.u256(0), limit: gl.u256 = gl.u256(20)) -> list:
        start = max(1, int(offset) + 1); end = min(int(self.next_campaign_id), start + min(int(limit), 50)); return [self._campaign_dict(gl.u256(i), self.campaigns[gl.u256(i)]) for i in range(start, end)]

    @gl.public.view
    def list_positions(self, campaign_id: gl.u256, offset: gl.u256 = gl.u256(0), limit: gl.u256 = gl.u256(20)) -> list:
        c = self._campaign(campaign_id); start = max(1, int(offset) + 1); end = min(int(c.next_position_id), start + min(int(limit), 100)); return [self.get_position(campaign_id, gl.u256(i)) for i in range(start, end) if bool(self.position_exists.get(self._key(int(campaign_id), i)) or False)]

    @gl.public.view
    def get_campaign_accounting(self, campaign_id: gl.u256) -> dict:
        c = self._campaign(campaign_id); locked = int(c.initial_funding) - int(c.paid_total) - int(c.refunded_total); return {"initial_funding": int(c.initial_funding), "paid": int(c.paid_total), "refunded": int(c.refunded_total), "still_locked": locked, "available_capacity": int(c.max_positions) - int(c.occupied), "occupied_capacity": int(c.occupied), "successful": int(c.successful), "conserved": int(c.initial_funding) == int(c.paid_total) + int(c.refunded_total) + locked}

    @gl.public.view
    def get_protocol_config(self) -> dict:
        return {"version": "2", "chain_id": 61997, "max_positions": MAX_POSITIONS, "max_attempts": MAX_ATTEMPTS, "judgment_timeout_seconds": JUDGMENT_TIMEOUT, "retry_window_seconds": RETRY_WINDOW, "min_seconds": MIN_SECONDS, "max_seconds": MAX_SECONDS, "state_model": "campaign capacity is success based; terminal failure reopens a funded slot while intake is active"}
