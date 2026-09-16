from v2_model import CampaignModel

def test_failed_position_reopens_capacity_and_stays_backed():
    c = CampaignModel(capacity=1); i = c.refer("ref", "candidate"); c.accept(i, "candidate"); c.submit(i, "candidate"); c.resolve(i, "NOT_COMPLETED")
    assert c.occupied == 0
    j = c.refer("ref2", "candidate2"); assert j == 1; assert c.initial == 12

def test_success_then_settlement_and_final_refund_conserve():
    c = CampaignModel(capacity=2); i = c.refer("ref", "candidate"); c.accept(i, "candidate"); c.submit(i, "candidate"); c.resolve(i, "COMPLETED"); c.settle(i); c.close(); c.finalise()
    assert c.paid == 12 and c.refunded == 12 and c.conservation()

def test_employer_cannot_refer_or_overbook():
    c = CampaignModel(capacity=1)
    try: c.refer("employer", "candidate"); assert False
    except AssertionError: pass
    c.refer("ref", "candidate")
    try: c.refer("ref2", "candidate2"); assert False
    except AssertionError: pass
