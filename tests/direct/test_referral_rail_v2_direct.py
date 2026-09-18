def deploy_v2(direct_deploy, direct_vm, owner):
    direct_vm.sender = owner
    rail = direct_deploy("contracts/referral_rail_v2.py")
    import genlayer.contract
    with direct_vm.activate():
        rail.set_judge("0x" + "1" * 40)
    return rail


def create_campaign(rail, direct_vm, employer, value):
    direct_vm.sender = employer
    direct_vm.value = value
    with direct_vm.activate():
        direct_vm.value = value
        return rail.create_campaign(
            "V2 direct campaign",
            "Bounded public deliverable",
            "The evidence must satisfy the frozen criteria",
            "",
            "",
            "",
            1,
            200,
            100,
            120,
            300,
            600,
            1,
            "PUBLIC_WEB",
            "",
            True,
        )


def test_v2_direct_deploy_and_binding(direct_deploy, direct_vm, direct_owner):
    rail = deploy_v2(direct_deploy, direct_vm, direct_owner)
    assert rail.judge_address.as_hex.lower() == ("0x" + "1" * 40)
    with direct_vm.expect_revert("judge binding is not available"):
        rail.set_judge("0x" + "2" * 40)


def test_v2_direct_under_and_overfund_rejected(direct_deploy, direct_vm, direct_owner):
    rail = deploy_v2(direct_deploy, direct_vm, direct_owner)
    with direct_vm.expect_revert("funding must equal"):
        create_campaign(rail, direct_vm, direct_owner, 299)
    with direct_vm.expect_revert("funding must equal"):
        create_campaign(rail, direct_vm, direct_owner, 301)
