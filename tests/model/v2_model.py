"""Executable economic model for the v2 campaign rules."""
from dataclasses import dataclass

ACTIVE, RESOLVING, REFUNDED = "ACTIVE", "RESOLVING", "REFUNDED"
RESERVED, ACCEPTED, JUDGING, INCONCLUSIVE, COMPLETED, PAID, FAILED = range(1, 8)

@dataclass
class Position:
    candidate: str
    referrer: str
    state: int = RESERVED
    attempts: int = 0

class CampaignModel:
    def __init__(self, employer="employer", capacity=2, candidate_reward=10, referral_reward=2, deadline=100):
        self.employer = employer; self.capacity = capacity; self.unit = candidate_reward + referral_reward
        self.initial = capacity * self.unit; self.candidate_reward = candidate_reward; self.referral_reward = referral_reward
        self.deadline = deadline; self.now = 0; self.state = ACTIVE; self.positions = []
        self.paid = 0; self.refunded = 0; self.pending_successes = 0
    @property
    def occupied(self): return sum(p.state in (RESERVED, ACCEPTED, JUDGING, INCONCLUSIVE, COMPLETED) for p in self.positions)
    @property
    def successful(self): return sum(p.state in (COMPLETED, PAID) for p in self.positions)
    @property
    def reusable_capacity(self): return self.capacity - self.successful - self.occupied + self.pending_successes
    def refer(self, sender, candidate):
        assert self.state == ACTIVE and self.now <= self.deadline and sender not in (self.employer, candidate)
        assert self.reusable_capacity > 0
        p = Position(candidate, sender); self.positions.append(p); return len(self.positions) - 1
    def accept(self, i, sender):
        p = self.positions[i]; assert p.state == RESERVED and p.candidate == sender; p.state = ACCEPTED
    def submit(self, i, sender):
        p = self.positions[i]; assert p.candidate == sender and p.state in (ACCEPTED, INCONCLUSIVE); p.attempts += 1; assert p.attempts <= 2; p.state = JUDGING
    def resolve(self, i, outcome):
        p = self.positions[i]; assert p.state == JUDGING
        if outcome == "COMPLETED": p.state = COMPLETED; self.pending_successes += 1
        elif outcome == "NOT_COMPLETED": p.state = FAILED
        else: p.state = INCONCLUSIVE
    def settle(self, i):
        p = self.positions[i]; assert p.state == COMPLETED; p.state = PAID; self.pending_successes -= 1; self.paid += self.unit
    def close(self): self.state = RESOLVING
    def cancel(self):
        assert self.state == ACTIVE and self.occupied == 0 and self.successful == 0 and self.paid == 0
        self.refunded += self.initial; self.state = REFUNDED
    def finalise(self):
        assert self.state == RESOLVING and self.occupied == 0 and self.pending_successes == 0
        self.refunded += (self.capacity - self.successful) * self.unit; self.state = REFUNDED
    def conservation(self): return self.initial == self.paid + self.refunded + (self.initial - self.paid - self.refunded)
