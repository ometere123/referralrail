def deploy_v2(direct_deploy, direct_vm, owner, value=300):
    direct_vm.sender = owner
    direct_vm.value = value
    rail = direct_deploy("contracts/referral_rail_v2.py")
    import genlayer.contract
    with direct_vm.activate():
        rail.set_judge("0x" + "1" * 40)
    return rail


def create_campaign(rail, direct_vm, employer, value, max_positions=1):
    direct_vm.sender = employer
    direct_vm.value = value
    with direct_vm.activate():
        direct_vm.value = value
        direct_vm._refresh_gl_message()
        return rail.create_campaign(
            "V2 direct campaign",
            "Bounded public deliverable",
            "The evidence must satisfy the frozen criteria",
            "",
            "",
            "",
            max_positions,
            200,
            100,
            120,
            300,
            600,
            max_positions,
            "PUBLIC_WEB",
            "",
            False,
        )


def write(rail, direct_vm, sender, method, *args):
    if isinstance(sender, str):
        sender = bytes.fromhex(sender[2:] if sender.startswith("0x") else sender)
    direct_vm.sender = sender
    direct_vm.value = 0
    with direct_vm.activate():
        return getattr(rail, method)(*args)


def test_v2_direct_deploy_and_binding(direct_deploy, direct_vm, direct_owner):
    rail = deploy_v2(direct_deploy, direct_vm, direct_owner)
    assert rail.judge_address.as_hex.lower() == ("0x" + "1" * 40)
    with direct_vm.expect_revert("judge binding is not available"):
        rail.set_judge("0x" + "2" * 40)


def test_v2_direct_under_and_overfund_rejected(direct_deploy, direct_vm, direct_owner):
    rail = deploy_v2(direct_deploy, direct_vm, direct_owner, value=299)
    with direct_vm.expect_revert("funding must equal"):
        create_campaign(rail, direct_vm, direct_owner, 299)
    rail = deploy_v2(direct_deploy, direct_vm, direct_owner, value=301)
    with direct_vm.expect_revert("funding must equal"):
        create_campaign(rail, direct_vm, direct_owner, 301)

def test_unused_campaign_can_cancel_and_refund_full_escrow(direct_deploy, direct_vm, direct_owner):
    rail = deploy_v2(direct_deploy, direct_vm, direct_owner)
    create_campaign(rail, direct_vm, direct_owner, 300)
    write(rail, direct_vm, direct_owner, "cancel_campaign", 1)
    campaign = write(rail, direct_vm, direct_owner, "get_campaign", 1)
    accounting = write(rail, direct_vm, direct_owner, "get_campaign_accounting", 1)
    assert campaign["state"] == "CANCELLED"
    assert campaign["refunded_total"] == 300 and campaign["paid_total"] == 0
    assert accounting["conserved"] and accounting["still_locked"] == 0


def test_partial_success_cannot_cancel_after_settlement(direct_deploy, direct_vm, direct_owner):
    rail = deploy_v2(direct_deploy, direct_vm, direct_owner, value=600)
    create_campaign(rail, direct_vm, direct_owner, 600, max_positions=2)
    campaign = rail.campaigns[1]
    campaign.successful = 1
    campaign.paid_total = 300
    campaign.occupied = 0
    campaign.pending_successes = 0
    with direct_vm.expect_revert("campaign cannot be cancelled"):
        write(rail, direct_vm, direct_owner, "cancel_campaign", 1)

def test_partial_success_finalise_refunds_only_unused_unit_and_conserves(direct_deploy, direct_vm, direct_owner):
    rail = deploy_v2(direct_deploy, direct_vm, direct_owner, value=600)
    create_campaign(rail, direct_vm, direct_owner, 600, max_positions=2)
    campaign = rail.campaigns[1]
    campaign.state = 2
    campaign.successful = 1
    campaign.failed = 1
    campaign.paid_total = 300
    campaign.occupied = 0
    campaign.pending_successes = 0
    write(rail, direct_vm, direct_owner, "finalise_campaign", 1)
    campaign_view = write(rail, direct_vm, direct_owner, "get_campaign", 1)
    accounting = write(rail, direct_vm, direct_owner, "get_campaign_accounting", 1)
    assert campaign_view["state"] == "REFUNDED"
    assert campaign_view["paid_total"] == 300 and campaign_view["refunded_total"] == 300
    assert accounting["conserved"] and accounting["still_locked"] == 0

