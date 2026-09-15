# { "Depends": "py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng" }
"""ReferralRail settlement contract.

Referral attribution is economic protocol state. An employer fully funds one
opportunity, a referrer binds the nominated candidate, the candidate explicitly
accepts that attribution, and only the configured OutcomeJudge can settle it.

Target network for this repository: GenLayer Studio Next / Studionet Dev 61997.
"""
from dataclasses import dataclass
from datetime import datetime, timezone
import typing

import genlayer as gl

try:
    allow_storage = gl.allow_storage
except AttributeError:
    # v0.19 SDK compatibility; the v0.6 runner exposes the top-level name.
    allow_storage = gl.storage.allow


# Opportunity lifecycle. Values are deliberately stable for frontend decoding.
STATE_OPEN = 1
STATE_REFERRED = 2
STATE_ACCEPTED = 3
STATE_JUDGING = 4
STATE_INCONCLUSIVE = 5
STATE_PAID = 6
STATE_REFUNDED = 7
STATE_EXPIRED = 8
STATE_CANCELLED = 9

OUTCOME_NONE = 0
OUTCOME_COMPLETED = 1
OUTCOME_NOT_COMPLETED = 2
OUTCOME_INCONCLUSIVE = 3

MAX_TITLE_LEN = 120
MAX_BRIEF_LEN = 2600
MAX_CRITERIA_LEN = 2600
MAX_REPO_OWNER_LEN = 39
MAX_REPO_NAME_LEN = 100
MAX_GITHUB_LOGIN_LEN = 39
MAX_REASON_LEN = 700
MAX_AUDIT_LEN = 1200
MAX_WINDOW_SECONDS = 45 * 24 * 60 * 60
MIN_WINDOW_SECONDS = 60
MAX_ATTEMPTS = 2
INCONCLUSIVE_CURE_SECONDS = 24 * 60 * 60
JUDGMENT_TIMEOUT_SECONDS = 24 * 60 * 60
ZERO_ADDRESS = gl.Address("0x0000000000000000000000000000000000000000")


@gl.evm.contract_interface
class _Recipient:
    class View:
        pass

    class Write:
        pass


@allow_storage
@dataclass
class Opportunity:
    employer: gl.Address
    candidate: gl.Address
    title: str
    brief: str
    acceptance_criteria: str
    repo_owner: str
    repo_name: str
    candidate_payment: gl.u256
    referral_reward: gl.u256
    funded_amount: gl.u256
    created_at: gl.u256
    referral_deadline: gl.u256
    completion_deadline: gl.u256
    state: gl.u256
    referrer: gl.Address
    candidate_github: str
    referred_at: gl.u256
    accepted_at: gl.u256
    active_attempt: gl.u256
    attempt_count: gl.u256
    active_pr_number: gl.u256
    evidence_submitted_at: gl.u256
    judgment_timeout_at: gl.u256
    retry_deadline: gl.u256
    last_outcome: gl.u256
    last_evidence_digest: str
    last_reason: str
    last_audit: str
    closed_at: gl.u256


class OpportunityCreated(gl.chain.Event):
    def __init__(self, opportunity_id: gl.u256, employer: gl.Address, candidate: gl.Address, /, **blob): ...


class ReferralLocked(gl.chain.Event):
    def __init__(self, opportunity_id: gl.u256, referrer: gl.Address, candidate: gl.Address, /, **blob): ...


class ReferralAccepted(gl.chain.Event):
    def __init__(self, opportunity_id: gl.u256, candidate: gl.Address, /, **blob): ...


class WorkSubmitted(gl.chain.Event):
    def __init__(self, opportunity_id: gl.u256, attempt_id: gl.u256, pr_number: gl.u256, /, **blob): ...


class OutcomeRecorded(gl.chain.Event):
    def __init__(self, opportunity_id: gl.u256, attempt_id: gl.u256, outcome: gl.u256, /, **blob): ...


class OpportunitySettled(gl.chain.Event):
    def __init__(self, opportunity_id: gl.u256, state: gl.u256, /, **blob): ...


def now_ts() -> int:
    """Consensus-safe transaction timestamp exposed through GenVM."""
    return int(datetime.now(timezone.utc).timestamp())


def clean_text(value: typing.Any, max_len: int) -> str:
    return " ".join(str(value).strip().split())[:max_len]


def valid_github_owner(value: str) -> bool:
    # GitHub account/org names: 1..39 alphanumeric/hyphen, not edge hyphen.
    text = str(value).strip()
    if len(text) == 0 or len(text) > MAX_REPO_OWNER_LEN:
        return False
    if text[0] == "-" or text[-1] == "-":
        return False
    for ch in text:
        if not (ch.isalnum() or ch == "-"):
            return False
    return True


def valid_repo_name(value: str) -> bool:
    text = str(value).strip()
    if len(text) == 0 or len(text) > MAX_REPO_NAME_LEN:
        return False
    for ch in text:
        if not (ch.isalnum() or ch in ("-", "_", ".")):
            return False
    return text not in (".", "..")


def valid_github_login(value: str) -> bool:
    return valid_github_owner(value) and len(value) <= MAX_GITHUB_LOGIN_LEN


def state_name(value: int) -> str:
    return {
        STATE_OPEN: "OPEN",
        STATE_REFERRED: "REFERRED",
        STATE_ACCEPTED: "ACCEPTED",
        STATE_JUDGING: "JUDGING",
        STATE_INCONCLUSIVE: "INCONCLUSIVE",
        STATE_PAID: "PAID",
        STATE_REFUNDED: "REFUNDED",
        STATE_EXPIRED: "EXPIRED",
        STATE_CANCELLED: "CANCELLED",
    }.get(int(value), "UNKNOWN")


def outcome_name(value: int) -> str:
    return {
        OUTCOME_NONE: "NONE",
        OUTCOME_COMPLETED: "COMPLETED",
        OUTCOME_NOT_COMPLETED: "NOT_COMPLETED",
        OUTCOME_INCONCLUSIVE: "INCONCLUSIVE",
    }.get(int(value), "UNKNOWN")


class ReferralRail(gl.contract.Contract):
    """Referral attribution + funded settlement state machine."""

    owner: gl.Address
    judge_address: gl.Address
    next_opportunity_id: gl.u256
    opportunities: gl.storage.TreeMap[gl.u256, Opportunity]
    total_funded: gl.u256
    total_paid: gl.u256
    total_refunded: gl.u256
    locked_total: gl.u256

    def __init__(self):
        self.owner = gl.message.sender_address
        self.judge_address = ZERO_ADDRESS
        self.next_opportunity_id = gl.u256(1)
        self.total_funded = gl.u256(0)
        self.total_paid = gl.u256(0)
        self.total_refunded = gl.u256(0)
        self.locked_total = gl.u256(0)

    def _opportunity(self, opportunity_id: gl.u256) -> Opportunity:
        oid = int(opportunity_id)
        if oid <= 0 or oid >= int(self.next_opportunity_id):
            raise gl.vm.UserError("unknown opportunity")
        return self.opportunities[opportunity_id]

    def _require_bound(self) -> None:
        if self.judge_address == ZERO_ADDRESS:
            raise gl.vm.UserError("outcome judge is not configured")

    def _send_eoa(self, recipient: gl.Address, amount: gl.u256) -> None:
        if int(amount) <= 0:
            return
        # External value messages can only execute on finalization. Address
        # validity is guaranteed by the typed candidate/referrer/employer state.
        _Recipient(recipient).emit_transfer(value=gl.u256(int(amount)))

    def _release_lock(self, amount: gl.u256) -> None:
        if int(self.locked_total) < int(amount):
            raise gl.vm.UserError("accounting invariant violated: insufficient locked total")
        self.locked_total = gl.u256(int(self.locked_total) - int(amount))

    def _refund(self, opportunity_id: gl.u256, opp: Opportunity, terminal_state: int) -> None:
        if terminal_state not in (STATE_REFUNDED, STATE_EXPIRED, STATE_CANCELLED):
            raise gl.vm.UserError("invalid refund terminal state")
        if int(opp.state) in (STATE_PAID, STATE_REFUNDED, STATE_EXPIRED, STATE_CANCELLED):
            raise gl.vm.UserError("opportunity is already terminal")

        amount = gl.u256(int(opp.funded_amount))
        self._release_lock(amount)
        opp.state = gl.u256(terminal_state)
        opp.closed_at = gl.u256(now_ts())
        self.total_refunded = gl.u256(int(self.total_refunded) + int(amount))
        self._send_eoa(opp.employer, amount)
        OpportunitySettled(opportunity_id, gl.u256(terminal_state), terminal=state_name(terminal_state), amount=int(amount)).emit()

    def _payout(self, opportunity_id: gl.u256, opp: Opportunity) -> None:
        if int(opp.state) != STATE_JUDGING:
            raise gl.vm.UserError("opportunity is not awaiting judgment")
        total = int(opp.candidate_payment) + int(opp.referral_reward)
        if total != int(opp.funded_amount):
            raise gl.vm.UserError("accounting invariant violated: split does not equal funding")

        self._release_lock(opp.funded_amount)
        opp.state = gl.u256(STATE_PAID)
        opp.closed_at = gl.u256(now_ts())
        self.total_paid = gl.u256(int(self.total_paid) + total)
        self._send_eoa(opp.candidate, opp.candidate_payment)
        self._send_eoa(opp.referrer, opp.referral_reward)
        OpportunitySettled(
            opportunity_id,
            gl.u256(STATE_PAID),
            terminal="PAID",
            candidate_amount=int(opp.candidate_payment),
            referrer_amount=int(opp.referral_reward),
        ).emit()

    def _to_dict(self, opportunity_id: gl.u256, opp: Opportunity) -> dict:
        return {
            "id": int(opportunity_id),
            "employer": opp.employer.as_hex,
            "candidate": opp.candidate.as_hex,
            "title": str(opp.title),
            "brief": str(opp.brief),
            "acceptance_criteria": str(opp.acceptance_criteria),
            "repo_owner": str(opp.repo_owner),
            "repo_name": str(opp.repo_name),
            "candidate_payment": int(opp.candidate_payment),
            "referral_reward": int(opp.referral_reward),
            "funded_amount": int(opp.funded_amount),
            "created_at": int(opp.created_at),
            "referral_deadline": int(opp.referral_deadline),
            "completion_deadline": int(opp.completion_deadline),
            "state": state_name(int(opp.state)),
            "state_code": int(opp.state),
            "referrer": opp.referrer.as_hex,
            "candidate_github": str(opp.candidate_github),
            "referred_at": int(opp.referred_at),
            "accepted_at": int(opp.accepted_at),
            "active_attempt": int(opp.active_attempt),
            "attempt_count": int(opp.attempt_count),
            "active_pr_number": int(opp.active_pr_number),
            "evidence_submitted_at": int(opp.evidence_submitted_at),
            "judgment_timeout_at": int(opp.judgment_timeout_at),
            "retry_deadline": int(opp.retry_deadline),
            "last_outcome": outcome_name(int(opp.last_outcome)),
            "last_outcome_code": int(opp.last_outcome),
            "last_evidence_digest": str(opp.last_evidence_digest),
            "last_reason": str(opp.last_reason),
            "last_audit": str(opp.last_audit),
            "closed_at": int(opp.closed_at),
        }

    @gl.public.write
    def set_judge(self, judge_address: str) -> None:
        """One-time deployment binding. Must happen before any opportunity exists."""
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("only deployer can configure judge")
        if self.judge_address != ZERO_ADDRESS:
            raise gl.vm.UserError("judge already configured")
        if int(self.next_opportunity_id) != 1:
            raise gl.vm.UserError("cannot configure judge after opportunities exist")
        judge = gl.Address(judge_address)
        if judge == ZERO_ADDRESS or judge == self.owner:
            raise gl.vm.UserError("invalid judge address")
        self.judge_address = judge

    @gl.public.write.payable
    def create_opportunity(
        self,
        title: str,
        brief: str,
        acceptance_criteria: str,
        repo_owner: str,
        repo_name: str,
        candidate_address: str,
        candidate_payment: gl.u256,
        referral_reward: gl.u256,
        referral_window_seconds: gl.u256,
        completion_window_seconds: gl.u256,
    ) -> gl.u256:
        self._require_bound()
        employer = gl.message.sender_address
        candidate = gl.Address(candidate_address)
        if candidate == ZERO_ADDRESS or candidate == employer:
            raise gl.vm.UserError("candidate must be a distinct nonzero address")

        clean_title = clean_text(title, MAX_TITLE_LEN)
        clean_brief = clean_text(brief, MAX_BRIEF_LEN)
        clean_criteria = clean_text(acceptance_criteria, MAX_CRITERIA_LEN)
        clean_owner = str(repo_owner).strip()
        clean_repo = str(repo_name).strip()
        if len(clean_title) < 3 or len(clean_brief) < 20 or len(clean_criteria) < 20:
            raise gl.vm.UserError("title, brief and acceptance criteria are required")
        if not valid_github_owner(clean_owner) or not valid_repo_name(clean_repo):
            raise gl.vm.UserError("invalid GitHub repository owner or name")

        candidate_amount = int(candidate_payment)
        referral_amount = int(referral_reward)
        if candidate_amount <= 0 or referral_amount <= 0:
            raise gl.vm.UserError("candidate payment and referral reward must both be positive")
        expected = candidate_amount + referral_amount
        if int(gl.message.value) != expected:
            raise gl.vm.UserError("funding must equal candidate payment plus referral reward")

        referral_window = int(referral_window_seconds)
        completion_window = int(completion_window_seconds)
        if referral_window < MIN_WINDOW_SECONDS or referral_window > MAX_WINDOW_SECONDS:
            raise gl.vm.UserError("referral window out of bounds")
        if completion_window <= referral_window or completion_window > MAX_WINDOW_SECONDS:
            raise gl.vm.UserError("completion window must be longer than referral window and within bounds")

        oid = gl.u256(int(self.next_opportunity_id))
        self.next_opportunity_id = gl.u256(int(self.next_opportunity_id) + 1)
        now = now_ts()
        self.opportunities[oid] = Opportunity(
            employer=employer,
            candidate=candidate,
            title=clean_title,
            brief=clean_brief,
            acceptance_criteria=clean_criteria,
            repo_owner=clean_owner,
            repo_name=clean_repo,
            candidate_payment=gl.u256(candidate_amount),
            referral_reward=gl.u256(referral_amount),
            funded_amount=gl.u256(expected),
            created_at=gl.u256(now),
            referral_deadline=gl.u256(now + referral_window),
            completion_deadline=gl.u256(now + completion_window),
            state=gl.u256(STATE_OPEN),
            referrer=ZERO_ADDRESS,
            candidate_github="",
            referred_at=gl.u256(0),
            accepted_at=gl.u256(0),
            active_attempt=gl.u256(0),
            attempt_count=gl.u256(0),
            active_pr_number=gl.u256(0),
            evidence_submitted_at=gl.u256(0),
            judgment_timeout_at=gl.u256(0),
            retry_deadline=gl.u256(0),
            last_outcome=gl.u256(OUTCOME_NONE),
            last_evidence_digest="",
            last_reason="",
            last_audit="",
            closed_at=gl.u256(0),
        )
        self.total_funded = gl.u256(int(self.total_funded) + expected)
        self.locked_total = gl.u256(int(self.locked_total) + expected)
        OpportunityCreated(
            oid,
            employer,
            candidate,
            title=clean_title,
            funded=expected,
            repo=f"{clean_owner}/{clean_repo}",
        ).emit()
        return oid

    @gl.public.write
    def create_referral(self, opportunity_id: gl.u256, candidate_address: str) -> None:
        opp = self._opportunity(opportunity_id)
        now = now_ts()
        if int(opp.state) != STATE_OPEN:
            raise gl.vm.UserError("opportunity is not open for referral")
        if now > int(opp.referral_deadline):
            raise gl.vm.UserError("referral window expired")
        candidate = gl.Address(candidate_address)
        if candidate != opp.candidate:
            raise gl.vm.UserError("referral candidate does not match the funded opportunity")
        referrer = gl.message.sender_address
        if referrer == opp.employer or referrer == opp.candidate or referrer == ZERO_ADDRESS:
            raise gl.vm.UserError("self-referral and related-party referral are not allowed")

        opp.referrer = referrer
        opp.referred_at = gl.u256(now)
        opp.state = gl.u256(STATE_REFERRED)
        ReferralLocked(
            opportunity_id,
            referrer,
            opp.candidate,
            referral_reward=int(opp.referral_reward),
        ).emit()

    @gl.public.write
    def accept_referral(self, opportunity_id: gl.u256, github_login: str) -> None:
        opp = self._opportunity(opportunity_id)
        now = now_ts()
        if int(opp.state) != STATE_REFERRED:
            raise gl.vm.UserError("opportunity is not awaiting candidate acceptance")
        if gl.message.sender_address != opp.candidate:
            raise gl.vm.UserError("only the nominated candidate can accept")
        if now > int(opp.referral_deadline):
            raise gl.vm.UserError("referral acceptance window expired")
        login = str(github_login).strip()
        if not valid_github_login(login):
            raise gl.vm.UserError("invalid GitHub login")

        # This is the attribution lock: referrer, candidate, rewards, criteria,
        # source repository and candidate GitHub identity are immutable afterwards.
        opp.candidate_github = login
        opp.accepted_at = gl.u256(now)
        opp.state = gl.u256(STATE_ACCEPTED)
        ReferralAccepted(
            opportunity_id,
            opp.candidate,
            referrer=opp.referrer.as_hex,
            github_login=login,
        ).emit()

    def _submit_to_judge(self, opportunity_id: gl.u256, opp: Opportunity, pr_number: int) -> gl.u256:
        now = now_ts()
        attempt = int(opp.attempt_count) + 1
        if attempt > MAX_ATTEMPTS:
            raise gl.vm.UserError("maximum judgment attempts reached")
        opp.attempt_count = gl.u256(attempt)
        opp.active_attempt = gl.u256(attempt)
        opp.active_pr_number = gl.u256(pr_number)
        opp.evidence_submitted_at = gl.u256(now)
        opp.judgment_timeout_at = gl.u256(now + JUDGMENT_TIMEOUT_SECONDS)
        opp.retry_deadline = gl.u256(0)
        opp.state = gl.u256(STATE_JUDGING)

        judge = gl.get_contract_at(self.judge_address)
        judge.emit(on="finalized").evaluate(
            int(opportunity_id),
            attempt,
            opp.repo_owner,
            opp.repo_name,
            int(pr_number),
            opp.candidate_github,
            opp.brief,
            opp.acceptance_criteria,
            int(opp.completion_deadline),
        )
        WorkSubmitted(
            opportunity_id,
            gl.u256(attempt),
            gl.u256(pr_number),
            repo=f"{opp.repo_owner}/{opp.repo_name}",
        ).emit()
        return gl.u256(attempt)

    @gl.public.write
    def submit_work(self, opportunity_id: gl.u256, pr_number: gl.u256) -> gl.u256:
        opp = self._opportunity(opportunity_id)
        if int(opp.state) != STATE_ACCEPTED:
            raise gl.vm.UserError("opportunity is not ready for work evidence")
        if gl.message.sender_address != opp.candidate:
            raise gl.vm.UserError("only the accepted candidate can submit work")
        if now_ts() > int(opp.completion_deadline):
            raise gl.vm.UserError("completion deadline passed; use expire")
        if int(pr_number) <= 0:
            raise gl.vm.UserError("pull request number must be positive")
        return self._submit_to_judge(opportunity_id, opp, int(pr_number))

    @gl.public.write
    def retry_inconclusive(self, opportunity_id: gl.u256, pr_number: gl.u256) -> gl.u256:
        opp = self._opportunity(opportunity_id)
        if int(opp.state) != STATE_INCONCLUSIVE:
            raise gl.vm.UserError("opportunity is not inconclusive")
        if gl.message.sender_address != opp.candidate:
            raise gl.vm.UserError("only the candidate can retry evidence")
        if int(opp.attempt_count) >= MAX_ATTEMPTS:
            raise gl.vm.UserError("maximum judgment attempts reached; recover funds")
        if now_ts() > int(opp.retry_deadline):
            raise gl.vm.UserError("inconclusive cure window expired; recover funds")
        if int(pr_number) <= 0:
            raise gl.vm.UserError("pull request number must be positive")
        return self._submit_to_judge(opportunity_id, opp, int(pr_number))

    @gl.public.write
    def record_outcome(
        self,
        opportunity_id: gl.u256,
        attempt_id: gl.u256,
        outcome: gl.u256,
        evidence_digest: str,
        reason: str,
        audit: str,
    ) -> None:
        """Only the configured judge may commit a consensus result."""
        if gl.message.sender_address != self.judge_address:
            raise gl.vm.UserError("unauthorized outcome callback")
        opp = self._opportunity(opportunity_id)
        if int(opp.state) != STATE_JUDGING:
            raise gl.vm.UserError("opportunity is not awaiting a judgment")
        if int(attempt_id) != int(opp.active_attempt):
            raise gl.vm.UserError("stale or replayed judgment attempt")
        result = int(outcome)
        if result not in (OUTCOME_COMPLETED, OUTCOME_NOT_COMPLETED, OUTCOME_INCONCLUSIVE):
            raise gl.vm.UserError("invalid judgment outcome")

        opp.last_outcome = gl.u256(result)
        opp.last_evidence_digest = clean_text(evidence_digest, 180)
        opp.last_reason = clean_text(reason, MAX_REASON_LEN)
        opp.last_audit = clean_text(audit, MAX_AUDIT_LEN)
        OutcomeRecorded(
            opportunity_id,
            attempt_id,
            gl.u256(result),
            evidence_digest=opp.last_evidence_digest,
        ).emit()

        if result == OUTCOME_COMPLETED:
            self._payout(opportunity_id, opp)
            return
        if result == OUTCOME_NOT_COMPLETED:
            self._refund(opportunity_id, opp, STATE_REFUNDED)
            return

        # INCONCLUSIVE never traps funds indefinitely. One bounded cure attempt
        # is permitted; after the maximum attempt or deadline, anyone can recover.
        opp.state = gl.u256(STATE_INCONCLUSIVE)
        now = now_ts()
        if int(opp.attempt_count) >= MAX_ATTEMPTS:
            opp.retry_deadline = gl.u256(now)
        else:
            opp.retry_deadline = gl.u256(now + INCONCLUSIVE_CURE_SECONDS)

    @gl.public.write
    def cancel_unreferred(self, opportunity_id: gl.u256) -> None:
        opp = self._opportunity(opportunity_id)
        if gl.message.sender_address != opp.employer:
            raise gl.vm.UserError("only employer can cancel")
        if int(opp.state) != STATE_OPEN:
            raise gl.vm.UserError("cannot cancel after a referral is locked")
        self._refund(opportunity_id, opp, STATE_CANCELLED)

    @gl.public.write
    def expire(self, opportunity_id: gl.u256) -> None:
        """Permissionless deterministic timeout for pre-judgment states."""
        opp = self._opportunity(opportunity_id)
        now = now_ts()
        state = int(opp.state)
        if state in (STATE_OPEN, STATE_REFERRED):
            if now <= int(opp.referral_deadline):
                raise gl.vm.UserError("referral deadline has not passed")
            self._refund(opportunity_id, opp, STATE_EXPIRED)
            return
        if state == STATE_ACCEPTED:
            if now <= int(opp.completion_deadline):
                raise gl.vm.UserError("completion deadline has not passed")
            self._refund(opportunity_id, opp, STATE_EXPIRED)
            return
        raise gl.vm.UserError("state is not eligible for expiry")

    @gl.public.write
    def recover(self, opportunity_id: gl.u256) -> None:
        """Permissionless liveness recovery for stalled judgment/inconclusive state."""
        opp = self._opportunity(opportunity_id)
        now = now_ts()
        state = int(opp.state)
        if state == STATE_JUDGING:
            if now <= int(opp.judgment_timeout_at):
                raise gl.vm.UserError("judgment timeout has not passed")
            opp.last_outcome = gl.u256(OUTCOME_INCONCLUSIVE)
            opp.last_reason = "judgment callback did not arrive before the bounded timeout"
            self._refund(opportunity_id, opp, STATE_REFUNDED)
            return
        if state == STATE_INCONCLUSIVE:
            if int(opp.attempt_count) < MAX_ATTEMPTS and now <= int(opp.retry_deadline):
                raise gl.vm.UserError("candidate still has a bounded cure window")
            self._refund(opportunity_id, opp, STATE_REFUNDED)
            return
        raise gl.vm.UserError("state has no recovery action")

    @gl.public.view
    def get_opportunity(self, opportunity_id: gl.u256) -> dict:
        return self._to_dict(opportunity_id, self._opportunity(opportunity_id))

    @gl.public.view
    def list_opportunities(self, offset: gl.u256 = gl.u256(0), limit: gl.u256 = gl.u256(20)) -> list:
        start = max(1, int(offset) + 1)
        capped = min(max(int(limit), 1), 40)
        end = min(int(self.next_opportunity_id), start + capped)
        result = []
        for oid in range(start, end):
            key = gl.u256(oid)
            result.append(self._to_dict(key, self.opportunities[key]))
        return result

    @gl.public.view
    def get_accounting(self) -> dict:
        return {
            "total_funded": int(self.total_funded),
            "total_paid": int(self.total_paid),
            "total_refunded": int(self.total_refunded),
            "locked_total": int(self.locked_total),
            "conservation_delta": int(self.total_funded)
            - int(self.total_paid)
            - int(self.total_refunded)
            - int(self.locked_total),
        }

    @gl.public.view
    def get_protocol_config(self) -> dict:
        return {
            "owner": self.owner.as_hex,
            "judge_address": self.judge_address.as_hex,
            "max_attempts": MAX_ATTEMPTS,
            "inconclusive_cure_seconds": INCONCLUSIVE_CURE_SECONDS,
            "judgment_timeout_seconds": JUDGMENT_TIMEOUT_SECONDS,
            "evidence_host": "api.github.com",
        }
