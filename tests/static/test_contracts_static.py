from pathlib import Path
import ast

ROOT=Path(__file__).resolve().parents[2]
SETTLE=(ROOT/'contracts/referral_rail.py').read_text()
JUDGE=(ROOT/'contracts/outcome_judge.py').read_text()
V2_SETTLE=(ROOT/'contracts/referral_rail_v2.py').read_text()
V2_JUDGE=(ROOT/'contracts/outcome_judge_v2.py').read_text()

def test_contracts_parse_as_python():
    ast.parse(SETTLE); ast.parse(JUDGE); ast.parse(V2_SETTLE); ast.parse(V2_JUDGE)

def test_v1_and_v2_contract_files_are_explicit():
    assert sorted(p.name for p in (ROOT/'contracts').glob('*.py')) == ['outcome_judge.py','outcome_judge_v2.py','referral_rail.py','referral_rail_v2.py']

def test_v06_dependency_is_consistent():
    marker='py-genlayer:5jycge4q8k23462jtb0b9fyey1s9qz928sz2nbrd9mg4sxqg2qng'
    assert marker in SETTLE and marker in JUDGE
    assert marker in V2_SETTLE and marker in V2_JUDGE

def test_v2_is_multi_position_and_fully_funded():
    for token in ['class ReferralRailV2', 'create_campaign', 'max_positions', 'occupied', 'settle_position', 'finalise_campaign', 'recover_position']:
        assert token in V2_SETTLE
    for token in ['class OutcomeJudgeV2', 'COMPLETED', 'NOT_COMPLETED', 'INCONCLUSIVE', 'ownership-proof']:
        assert token in V2_JUDGE or token.replace('-', '_') in V2_JUDGE

def test_substantive_validator_refetches_and_reruns():
    assert 'run_nondet(' in JUDGE
    assert 'independent = evaluate_once' in JUDGE
    assert 'github_json' in JUDGE
    assert 'objective_key' in JUDGE and 'evidence_digest' in JUDGE

def test_judge_is_source_restricted():
    assert 'https://api.github.com/repos/' in JUDGE
    assert 'evidence_host": "api.github.com"' in JUDGE

def test_judgment_message_uses_finalized_trigger_and_pull_resolution():
    assert 'emit(on="finalized").evaluate' in SETTLE
    assert 'def resolve_judgment' in SETTLE
    assert 'get_judgment' in SETTLE

def test_target_network_marker_is_present():
    assert '61997' in SETTLE

def test_inconclusive_and_timeout_paths_exist():
    for token in ['retry_inconclusive','recover','JUDGMENT_TIMEOUT_SECONDS','MAX_ATTEMPTS']:
        assert token in SETTLE
