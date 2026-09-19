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

def test_two_slots_one_paid_one_unused_refunds_unused_unit():
    c = CampaignModel(capacity=2); i = c.refer("ref", "candidate"); c.accept(i, "candidate"); c.submit(i, "candidate"); c.resolve(i, "COMPLETED"); c.settle(i); c.close(); c.finalise()
    assert c.successful == 1 and c.paid == 12 and c.refunded == 12 and c.reusable_capacity == 1 and c.conservation()

def test_success_failure_and_replacement_never_exceeds_funded_capacity():
    c = CampaignModel(capacity=2); i = c.refer("ref", "one"); j = c.refer("ref2", "two")
    c.accept(i, "one"); c.submit(i, "one"); c.resolve(i, "COMPLETED"); c.settle(i)
    c.accept(j, "two"); c.submit(j, "two"); c.resolve(j, "NOT_COMPLETED")
    k = c.refer("ref3", "three"); c.accept(k, "three"); c.submit(k, "three"); c.resolve(k, "COMPLETED"); c.settle(k); c.close(); c.finalise()
    assert c.successful == 2 and c.paid == 24 and c.refunded == 0 and c.conservation()

def test_all_failures_refund_every_unit():
    c = CampaignModel(capacity=2)
    for candidate, referrer in (("one", "ref"), ("two", "ref2")):
        i = c.refer(referrer, candidate); c.accept(i, candidate); c.submit(i, candidate); c.resolve(i, "NOT_COMPLETED")
    c.close(); c.finalise(); assert c.successful == 0 and c.refunded == 24 and c.conservation()

def test_completed_consumes_capacity_until_settlement_and_paid_releases_it():
    c = CampaignModel(capacity=1); i = c.refer("ref", "candidate"); c.accept(i, "candidate"); c.submit(i, "candidate"); c.resolve(i, "COMPLETED")
    assert c.occupied == 1 and c.reusable_capacity == 0
    c.settle(i); assert c.occupied == 0 and c.reusable_capacity == 0

def test_double_settlement_and_early_finalisation_are_rejected():
    c = CampaignModel(capacity=1); i = c.refer("ref", "candidate"); c.accept(i, "candidate"); c.submit(i, "candidate"); c.resolve(i, "COMPLETED")
    try: c.close(); c.finalise(); assert False
    except AssertionError: pass
    c.settle(i)
    try: c.settle(i); assert False
    except AssertionError: pass

def test_unused_campaign_cancel_refunds_full_escrow():
    c = CampaignModel(capacity=2)
    c.cancel()
    assert c.refunded == c.initial and c.paid == 0 and c.conservation()


def test_partial_success_cannot_cancel_and_separate_campaigns_conserve():
    c = CampaignModel(capacity=2); i = c.refer("ref", "candidate"); c.accept(i, "candidate"); c.submit(i, "candidate"); c.resolve(i, "COMPLETED"); c.settle(i)
    try: c.cancel(); assert False
    except AssertionError: pass
    other = CampaignModel(capacity=1); other.cancel()
    assert c.paid == 12 and c.refunded == 0 and c.conservation()
    assert other.refunded == other.initial and other.conservation()

def test_validator_disagreement_rejects_different_objective_result():
    import ast
    from pathlib import Path
    source = Path(__file__).parents[2].joinpath("contracts", "outcome_judge_v2.py").read_text()
    tree = ast.parse(source)
    node = next(item for item in tree.body if isinstance(item, ast.FunctionDef) and item.name == "substantive_validator_agrees")
    namespace = {"OUTCOME_COMPLETED": 1, "OUTCOME_NOT_COMPLETED": 2, "OUTCOME_INCONCLUSIVE": 3}
    exec(compile(ast.Module(body=[node], type_ignores=[]), "outcome_judge_v2.py", "exec"), namespace)
    substantive_validator_agrees = namespace["substantive_validator_agrees"]
    leader = {"outcome": 1, "objective_key": "criterion=met", "evidence_digest": "digest-a"}
    different_evidence = {"outcome": 1, "objective_key": "criterion=not-met", "evidence_digest": "digest-b"}
    different_outcome = {"outcome": 2, "objective_key": "criterion=met", "evidence_digest": "digest-a"}
    same = dict(leader)
    assert substantive_validator_agrees(leader, same)
    assert not substantive_validator_agrees(leader, different_evidence)
    assert not substantive_validator_agrees(leader, different_outcome)