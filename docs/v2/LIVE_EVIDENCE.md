# v2 live evidence

The current verified evidence is recorded in `deployment/v2/live-evidence.json`. It must contain fresh deployment addresses, finalized transaction hashes, actor addresses, campaign and position snapshots, judgment records, payout flags, refund flags, and conservation results.

The evidence record is generated from finalized live outputs. Missing or stale fields are not treated as success. The corrected multi-position deployment must replace this record after its fresh lifecycle runs.
