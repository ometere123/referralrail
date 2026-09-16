"""Opt-in live Studio Next lifecycle test.

Run explicitly with the gltest CLI and three wallet variables populated.
"""

import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from scripts.live_lifecycle import main


@pytest.mark.skipif(os.environ.get("RUN_LIVE_LIFECYCLE") != "1", reason="explicit live Studio Next test")
def test_real_three_wallet_lifecycle():
    main()
