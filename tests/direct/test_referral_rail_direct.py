import hashlib
from pathlib import Path


def _deploy_pair(direct_deploy, direct_vm, direct_owner):
    direct_vm.sender = direct_owner
    rail = direct_deploy("contracts/referral_rail.py")
    rail_address = rail.address.as_hex
    import genlayer.contract as contract_module
    contract_module.__known_contract__ = None
    from gltest.direct.loader import create_address, deploy_contract
    from gltest.direct.vm import VMContext
    judge_address = "0x" + hashlib.sha256(str(Path("contracts/outcome_judge.py").resolve()).encode()).digest()[:20].hex()
    with direct_vm.activate():
        rail.set_judge(judge_address)
    judge_vm = VMContext()
    judge_vm.sender = create_address("judge_deployer")
    with judge_vm.activate():
        judge = deploy_contract("contracts/outcome_judge.py", judge_vm, rail_address)
        assert judge.address.as_hex.lower() == judge_address.lower()
    return rail, judge


def _deploy_rail(direct_deploy, direct_vm, direct_owner, value=300):
    direct_vm.sender = direct_owner
    direct_vm.value = value
    rail = direct_deploy("contracts/referral_rail.py")
    with direct_vm.activate():
        rail.set_judge("0x" + "1" * 40)
    return rail


def _create(rail, direct_vm, employer, candidate, value=300):
    direct_vm.sender = employer
    direct_vm.value = value
    with direct_vm.activate():
        return rail.create_opportunity(
            "Public API integration",
            "Implement the requested public API integration and ship the completed work.",
            "The merged change must implement the API integration and include tests.",
            "example", "referralrail", "0x" + candidate.hex(),
            200, 100, 120, 300,
        )


def test_both_contracts_deploy_and_judge_binding_is_one_time(direct_deploy, direct_vm, direct_owner):
    rail, judge = _deploy_pair(direct_deploy, direct_vm, direct_owner)
    judge_address = "0x" + hashlib.sha256(str(Path("contracts/outcome_judge.py").resolve()).encode()).digest()[:20].hex()
    assert rail.get_protocol_config()["judge_address"].lower() == judge_address.lower()
    with direct_vm.expect_revert("judge already configured"):
        rail.set_judge(judge_address)


def test_underfund_rejected(direct_deploy, direct_vm, direct_owner, direct_alice):
    rail = _deploy_rail(direct_deploy, direct_vm, direct_owner, 299)
    with direct_vm.expect_revert("funding must equal"):
        _create(rail, direct_vm, direct_owner, direct_alice, 299)


def test_overfund_rejected(direct_deploy, direct_vm, direct_owner, direct_alice):
    rail = _deploy_rail(direct_deploy, direct_vm, direct_owner, 301)
    with direct_vm.expect_revert("funding must equal"):
        _create(rail, direct_vm, direct_owner, direct_alice, 301)


def test_exact_payable_funding(direct_deploy, direct_vm, direct_owner, direct_alice):
    rail = _deploy_rail(direct_deploy, direct_vm, direct_owner, 300)
    assert _create(rail, direct_vm, direct_owner, direct_alice, 300) == 1
