import pytest


def _deploy_pair(direct_deploy, direct_vm, direct_owner):
    rail = direct_deploy("contracts/referral_rail.py")
    # The v0.6 direct loader keeps a process-global single-contract registry;
    # clear it between independently deployed contracts in this test process.
    import genlayer.contract as contract_module
    contract_module.__known_contract__ = None
    from gltest.direct.loader import create_address
    direct_vm.sender = create_address("judge_deployer")
    judge = direct_deploy("contracts/outcome_judge.py", rail.address.as_hex)
    direct_vm.sender = rail.owner
    rail.set_judge(judge.address.as_hex)
    return rail, judge


def _create(rail, direct_vm, employer, candidate, value=300):
    direct_vm.sender = employer
    direct_vm.value = value
    return rail.create_opportunity(
        "Public API integration",
        "Implement the requested public API integration and ship the completed work.",
        "The merged change must implement the API integration and include tests.",
        "example",
        "referralrail",
        candidate.as_hex,
        200,
        100,
        120,
        300,
    )


def test_both_contracts_deploy_and_judge_binding_is_one_time(
    direct_deploy, direct_vm, direct_owner
):
    rail, judge = _deploy_pair(direct_deploy, direct_vm, direct_owner)
    assert rail.get_protocol_config()["judge_address"].lower() == judge.address.as_hex.lower()
    with direct_vm.expect_revert("judge already configured"):
        rail.set_judge(judge.address.as_hex)


def test_exact_payable_funding_and_under_overfund_rejection(
    direct_deploy, direct_vm, direct_owner, direct_alice
):
    rail, _ = _deploy_pair(direct_deploy, direct_vm, direct_owner)
    direct_vm.sender = direct_owner
    direct_vm.value = 299
    with direct_vm.expect_revert("funding must equal"):
        _create(rail, direct_vm, direct_owner, direct_alice, 299)
    direct_vm.value = 301
    with direct_vm.expect_revert("funding must equal"):
        _create(rail, direct_vm, direct_owner, direct_alice, 301)
    assert _create(rail, direct_vm, direct_owner, direct_alice) == 1


def test_referral_matrix_acceptance_and_frozen_attribution(
    direct_deploy, direct_vm, direct_owner, direct_alice, direct_bob, direct_charlie
):
    rail, _ = _deploy_pair(direct_deploy, direct_vm, direct_owner)
    oid = _create(rail, direct_vm, direct_owner, direct_alice)
    with direct_vm.prank(direct_owner):
        with direct_vm.expect_revert("self-referral"):
            rail.create_referral(oid, direct_alice.as_hex)
    with direct_vm.prank(direct_alice):
        with direct_vm.expect_revert("self-referral"):
            rail.create_referral(oid, direct_alice.as_hex)
    with direct_vm.prank(direct_bob):
        with direct_vm.expect_revert("does not match"):
            rail.create_referral(oid, direct_charlie.as_hex)
        rail.create_referral(oid, direct_alice.as_hex)
    with direct_vm.prank(direct_charlie):
        with direct_vm.expect_revert("only the nominated candidate"):
            rail.accept_referral(oid, "candidate")
    with direct_vm.prank(direct_alice):
        rail.accept_referral(oid, "candidate")
    before = rail.get_opportunity(oid)
    assert before["referrer"].lower() == direct_bob.as_hex.lower()
    assert before["candidate_github"] == "candidate"
    with direct_vm.prank(direct_bob):
        with direct_vm.expect_revert("opportunity is not open"):
            rail.create_referral(oid, direct_alice.as_hex)


def test_candidate_only_work_submission_and_wrong_callback_rejected(
    direct_deploy, direct_vm, direct_owner, direct_alice, direct_bob
):
    rail, _ = _deploy_pair(direct_deploy, direct_vm, direct_owner)
    oid = _create(rail, direct_vm, direct_owner, direct_alice)
    with direct_vm.prank(direct_bob):
        rail.create_referral(oid, direct_alice.as_hex)
    with direct_vm.prank(direct_alice):
        rail.accept_referral(oid, "candidate")
    with direct_vm.prank(direct_bob):
        with direct_vm.expect_revert("only candidate"):
            rail.submit_work(oid, 1)

    with direct_vm.prank(direct_bob):
        with direct_vm.expect_revert("only configured judge"):
            rail.record_outcome(oid, 1, 1, "digest", "reason", "audit")


@pytest.mark.parametrize("bad_url", [
    "https://api.github.com/repos/example/referralrail/pulls/99",
    "https://api.github.com/repos/example/other/pulls/99",
])
def test_strict_mock_pattern_does_not_accept_wrong_github_route(
    direct_deploy, direct_vm, direct_owner, direct_alice, bad_url
):
    _rail, judge = _deploy_pair(direct_deploy, direct_vm, direct_owner)
    direct_vm.strict_mocks = True
    direct_vm.mock_web(r"api\.github\.com/repos/example/referralrail/pulls/7(?:/files)?", {"status": 404, "body": "{}"})
    with direct_vm.prank(direct_owner):
        result = judge.evaluate(1, 1, "example", "referralrail", 7, "candidate", "brief", "criteria", 9999999999)
    assert result is None
