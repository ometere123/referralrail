import pytest
from referralrail_model import *


def funded(p):
    return p.create('employer','candidate',800,200,now=0,referral_window=100,completion_window=1000,value=1000)

def accepted(p):
    oid=funded(p); p.refer(oid,'referrer','candidate',10); p.accept(oid,'candidate','alice',20); return oid


def test_requires_exact_prefunding():
    p=Protocol()
    with pytest.raises(AssertionError): p.create('e','c',8,2,value=9)

def test_self_referral_rejected_for_employer():
    p=Protocol(); oid=funded(p)
    with pytest.raises(AssertionError): p.refer(oid,'employer','candidate',1)

def test_self_referral_rejected_for_candidate():
    p=Protocol(); oid=funded(p)
    with pytest.raises(AssertionError): p.refer(oid,'candidate','candidate',1)

def test_wrong_candidate_cannot_be_referred():
    p=Protocol(); oid=funded(p)
    with pytest.raises(AssertionError): p.refer(oid,'referrer','other',1)

def test_candidate_must_accept_own_referral():
    p=Protocol(); oid=funded(p); p.refer(oid,'referrer','candidate',1)
    with pytest.raises(AssertionError): p.accept(oid,'referrer','alice',2)

def test_referrer_attribution_is_immutable_after_lock():
    p=Protocol(); oid=funded(p); p.refer(oid,'r1','candidate',1)
    with pytest.raises(AssertionError): p.refer(oid,'r2','candidate',2)
    assert p.opps[oid].referrer == 'r1'

def test_employer_cannot_cancel_after_referral():
    p=Protocol(); oid=funded(p); p.refer(oid,'r1','candidate',1)
    with pytest.raises(AssertionError): p.cancel(oid,'employer')

def test_wrong_candidate_cannot_submit_work():
    p=Protocol(); oid=accepted(p)
    with pytest.raises(AssertionError): p.submit(oid,'attacker',30)

def test_completed_settles_once_and_conserves_funds():
    p=Protocol(); oid=accepted(p); attempt=p.submit(oid,'candidate',30)
    p.callback(oid,attempt,'COMPLETED',now=31)
    assert p.opps[oid].state == PAID and p.paid == 1000 and p.locked == 0
    assert p.conservation() == 0
    with pytest.raises(AssertionError): p.callback(oid,attempt,'COMPLETED',now=32)

def test_no_fabricated_callback_from_unauthorized_contract():
    p=Protocol(); oid=accepted(p); a=p.submit(oid,'candidate',30)
    with pytest.raises(AssertionError): p.callback(oid,a,'COMPLETED',sender='attacker')
    assert p.locked == 1000

def test_attempt_replay_for_same_opportunity_rejected():
    p=Protocol(); oid=accepted(p); a=p.submit(oid,'candidate',30)
    with pytest.raises(AssertionError): p.callback(oid,a+1,'COMPLETED')

def test_attempt_cannot_be_replayed_for_another_opportunity():
    p=Protocol(); one=accepted(p); two=accepted(p); a=p.submit(one,'candidate',30); p.submit(two,'candidate',30)
    p.callback(one,a,'COMPLETED')
    with pytest.raises(AssertionError): p.callback(two,a+1,'COMPLETED')

def test_not_completed_refunds_employer_side_of_accounting():
    p=Protocol(); oid=accepted(p); a=p.submit(oid,'candidate',30); p.callback(oid,a,'NOT_COMPLETED')
    assert p.opps[oid].state == REFUNDED and p.refunded == 1000 and p.conservation() == 0

def test_inconclusive_is_first_class_and_retryable_once():
    p=Protocol(); oid=accepted(p); a=p.submit(oid,'candidate',30); p.callback(oid,a,'INCONCLUSIVE',now=40)
    assert p.opps[oid].state == INCONCLUSIVE and p.locked == 1000
    second=p.submit(oid,'candidate',50); assert second == 2
    p.callback(oid,second,'COMPLETED',now=60)
    assert p.opps[oid].state == PAID and p.conservation() == 0

def test_second_inconclusive_has_immediate_bounded_recovery():
    p=Protocol(); oid=accepted(p); a=p.submit(oid,'candidate',30); p.callback(oid,a,'INCONCLUSIVE',now=40)
    a2=p.submit(oid,'candidate',50); p.callback(oid,a2,'INCONCLUSIVE',now=60)
    p.recover(oid,61)
    assert p.opps[oid].state == REFUNDED and p.conservation() == 0

def test_stalled_judgment_can_be_recovered():
    p=Protocol(); oid=accepted(p); p.submit(oid,'candidate',30)
    with pytest.raises(AssertionError): p.recover(oid,100)
    p.recover(oid,131)
    assert p.opps[oid].state == REFUNDED and p.conservation() == 0

def test_unreferred_opportunity_expires_and_refunds():
    p=Protocol(); oid=funded(p); p.expire(oid,101)
    assert p.opps[oid].state == EXPIRED and p.conservation() == 0

def test_expired_opportunity_cannot_later_be_paid():
    p=Protocol(); oid=funded(p); p.expire(oid,101)
    with pytest.raises(AssertionError): p.callback(oid,1,'COMPLETED')

def test_cancel_before_referral_is_terminal_and_no_overpay():
    p=Protocol(); oid=funded(p); p.cancel(oid,'employer')
    assert p.refunded == 1000 and p.locked == 0 and p.conservation() == 0
    with pytest.raises(AssertionError): p.cancel(oid,'employer')
