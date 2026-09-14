"""Pure-Python executable specification for ReferralRail invariants.

This is intentionally independent of GenVM. It lets CI exercise the money and
state-machine rules even when a GenLayer node is unavailable. Direct-mode tests
remain required before live deployment; see docs/TEST_PLAN.md.
"""
from dataclasses import dataclass

OPEN='OPEN'; REFERRED='REFERRED'; ACCEPTED='ACCEPTED'; JUDGING='JUDGING'; INCONCLUSIVE='INCONCLUSIVE'
PAID='PAID'; REFUNDED='REFUNDED'; EXPIRED='EXPIRED'; CANCELLED='CANCELLED'
MAX_ATTEMPTS=2

@dataclass
class Opp:
    employer: str
    candidate: str
    candidate_payment: int
    referral_reward: int
    referral_deadline: int
    completion_deadline: int
    state: str = OPEN
    referrer: str = ''
    github: str = ''
    attempts: int = 0
    active_attempt: int = 0
    retry_deadline: int = 0
    judgment_timeout: int = 0
    last_outcome: str = ''

    @property
    def funded(self): return self.candidate_payment + self.referral_reward

class Protocol:
    def __init__(self):
        self.opps={}
        self.next_id=1
        self.locked=0; self.paid=0; self.refunded=0; self.total_funded=0
        self.judge='judge'

    def create(self, employer, candidate, cp, rr, now=0, referral_window=100, completion_window=1000, value=None):
        assert employer != candidate and candidate
        assert cp > 0 and rr > 0
        expected=cp+rr
        assert value == expected
        assert completion_window > referral_window >= 1
        oid=self.next_id; self.next_id += 1
        self.opps[oid]=Opp(employer,candidate,cp,rr,now+referral_window,now+completion_window)
        self.locked += expected; self.total_funded += expected
        return oid

    def refer(self, oid, sender, candidate, now):
        o=self.opps[oid]
        assert o.state == OPEN and now <= o.referral_deadline
        assert candidate == o.candidate
        assert sender not in (o.employer,o.candidate) and sender
        o.referrer=sender; o.state=REFERRED

    def accept(self, oid, sender, github, now):
        o=self.opps[oid]
        assert o.state == REFERRED and sender == o.candidate and now <= o.referral_deadline
        assert github
        o.github=github; o.state=ACCEPTED

    def submit(self, oid, sender, now):
        o=self.opps[oid]
        assert sender == o.candidate
        if o.state == ACCEPTED:
            assert now <= o.completion_deadline
        else:
            assert o.state == INCONCLUSIVE and now <= o.retry_deadline and o.attempts < MAX_ATTEMPTS
        o.attempts += 1; o.active_attempt=o.attempts; o.state=JUDGING; o.judgment_timeout=now+100
        return o.active_attempt

    def callback(self, oid, attempt, outcome, sender='judge', now=0):
        assert sender == self.judge
        o=self.opps[oid]
        assert o.state == JUDGING and attempt == o.active_attempt
        o.last_outcome=outcome
        if outcome == 'COMPLETED':
            o.state=PAID; self.locked-=o.funded; self.paid+=o.funded
        elif outcome == 'NOT_COMPLETED':
            o.state=REFUNDED; self.locked-=o.funded; self.refunded+=o.funded
        elif outcome == 'INCONCLUSIVE':
            o.state=INCONCLUSIVE; o.retry_deadline=now if o.attempts>=MAX_ATTEMPTS else now+50
        else: raise AssertionError('bad outcome')

    def cancel(self, oid, sender):
        o=self.opps[oid]
        assert sender==o.employer and o.state==OPEN
        o.state=CANCELLED; self.locked-=o.funded; self.refunded+=o.funded

    def expire(self, oid, now):
        o=self.opps[oid]
        if o.state in (OPEN,REFERRED): assert now > o.referral_deadline
        elif o.state==ACCEPTED: assert now > o.completion_deadline
        else: raise AssertionError('not expirable')
        o.state=EXPIRED; self.locked-=o.funded; self.refunded+=o.funded

    def recover(self, oid, now):
        o=self.opps[oid]
        if o.state==JUDGING: assert now > o.judgment_timeout
        elif o.state==INCONCLUSIVE: assert o.attempts>=MAX_ATTEMPTS or now > o.retry_deadline
        else: raise AssertionError('not recoverable')
        o.state=REFUNDED; self.locked-=o.funded; self.refunded+=o.funded

    def conservation(self):
        return self.total_funded-self.paid-self.refunded-self.locked
