# 90–120 second demo script

The demo should show the product, not slides about the product.

## 0–12s — thesis

Open ReferralRail. Say:

“Referral rewards usually live in private employer records. ReferralRail locks the referral before the work starts, requires the candidate to accept it, then pays both candidate and referrer only when GenLayer verifies the finished work.”

Briefly point to the visible lifecycle rail.

## 12–30s — employer funds

Use the employer wallet and open **Fund opportunity**. Show:

- immutable brief and acceptance criteria;
- GitHub repository;
- candidate wallet;
- candidate payment and referral reward as separate obligations;
- total committed funding.

Submit. Keep the transaction panel on screen long enough to show signature → submitted → consensus → finalized → readback. Open the opportunity in `OPEN` state.

## 30–45s — referrer locks attribution

Switch to the referrer wallet. Click **Create referral**. Show that the candidate is already fixed and that the referrer is locking themselves as the attribution source. Submit and show `REFERRED`.

## 45–58s — candidate explicitly accepts

Switch to candidate wallet. Enter the candidate's GitHub login and click **Accept referral**. Call out that a referrer cannot silently claim a person; acceptance happens before work submission. Show `ACCEPTED` and immutable referrer/reward.

## 58–82s — submit real work / GenLayer judges

Enter the merged PR number and submit. Explain while the UI tracks:

“ReferralRail does not trust an AI label. The judge verifies the frozen repository, candidate authorship, merge status and deadline, then validators independently refetch the PR and independently decide whether the merged diff satisfies the acceptance criteria.”

Show `JUDGING`, then the OutcomeJudge evidence digest/reason/audit when available.

## 82–105s — economic consequence

Refresh/read back final state `PAID`. Hold on the settlement panel showing:

- candidate paid amount;
- referrer reward;
- referrer's address;
- wording that the referrer earned because their accepted referral completed;
- terminal state.

Optionally open the explorer transaction in a second tab.

## 105–120s — close

Say:

“The referral was fixed before the result, the candidate accepted it, GenLayer verified the real work, and the payment split was automatic. Referral attribution is now enforceable economic state.”

End on the lifecycle with `PAID` highlighted.

## Recording notes

Use real 61997 contracts and a real GitHub PR. Do not splice a mocked success screen into the flow. If consensus timing is too long for a single continuous capture, speed up dead waiting time in editing but keep the transaction IDs and finalized readbacks visible and truthful.
