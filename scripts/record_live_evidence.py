#!/usr/bin/env python3
"""Append a real finalized transaction evidence record; never invent values."""
import argparse, json, re
from datetime import datetime, timezone
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"deployment/live-evidence.json"
HASH=re.compile(r"^0x[a-fA-F0-9]{64}$")

p=argparse.ArgumentParser()
p.add_argument("--label", required=True)
p.add_argument("--hash", required=True)
p.add_argument("--state", required=True)
p.add_argument("--readback", required=True, help="truthful compact readback or note")
a=p.parse_args()
if not HASH.match(a.hash): raise SystemExit("transaction hash must be 0x + 64 hex chars")
data={"network":"Studio Next / Studionet Dev","chainId":61997,"transactions":[]}
if OUT.exists(): data=json.loads(OUT.read_text())
data.setdefault("transactions",[]).append({
  "label":a.label,"hash":a.hash,"finalState":a.state,"readback":a.readback,
  "recordedAt":datetime.now(timezone.utc).isoformat(),
})
OUT.write_text(json.dumps(data,indent=2)+"\n")
print(OUT)
