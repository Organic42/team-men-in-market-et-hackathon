"""
IGX (Indian Gas Exchange) daily market data scraper.

Pulls trade-level data from the public market-data endpoint. The route is GET-only
(POST returns 405) and takes a date range plus filter arrays. Passing `all` for the
filters returns every hub / state / delivery point / product.

History runs from 2020-12-10 (exchange inception) to present.

Usage:
    python igx_scraper.py --backfill          # inception -> today (run once)
    python igx_scraper.py                     # incremental: fills any gap to today
    python igx_scraper.py --from 2024-01-01 --to 2024-12-31
"""

from __future__ import annotations

import argparse
import html as htmllib
import logging
import random
import re
import sys
import time
from datetime import date, datetime, timedelta
from pathlib import Path

import pandas as pd
import requests

URL = "https://exchange.igxindia.com/web/market-data-daily"
INCEPTION = date(2020, 12, 10)
OUT = Path(__file__).parent / "data" / "igx_daily.parquet"

# Be a good citizen: this is a small public exchange site running Laravel with
# debug mode on (error pages are ~577KB stack traces). Low volume, slow, backs off.
DELAY_SEC = 2.0
TIMEOUT = 90
MAX_RETRIES = 4
UA = "igx-research-scraper/1.0 (+market data research; contact: meshcraftassets@gmail.com)"

# Parsed positionally from the <td> cells rather than via pandas.read_html:
# read_html silently drops the Scheduled Qty column (its <th> lacks the class
# attribute the others carry), which would quietly lose a field from an archive
# that is expensive to re-pull. Order verified against <thead> by check_header().
COLUMNS = [
    "trade_date", "hub_state", "delivery_point", "product", "contract",
    "buy_bid_qty", "sell_bid_qty", "trade_price", "trade_qty", "scheduled_qty",
    "best_buy_bid", "best_sell_bid", "delivery_days",
]
# Substring probes, in column order, to assert the site's schema hasn't shifted.
HEADER_PROBES = [
    "Trade Date", "Hub-State", "Delivery Point", "Product", "Contract",
    "Buy Bid Qty", "Sell Bid Qty", "Trade Price", "Trade Qty", "Scheduled Qty",
    "Best Buy Bid", "Best Sell Bid", "Delivery Days",
]
NUMERIC = [
    "buy_bid_qty", "sell_bid_qty", "trade_price", "trade_qty",
    "scheduled_qty", "best_buy_bid", "best_sell_bid", "delivery_days",
]
# (trade_date, contract) is the natural key -- contract encodes delivery point,
# delivery date and product, so it is unique within a trade date.
KEY = ["trade_date", "contract"]

log = logging.getLogger("igx")


def fetch(session: requests.Session, start: date, end: date) -> str:
    """GET one date range. Retries with exponential backoff."""
    params = [
        ("fromDate", start.strftime("%d-%m-%Y")),
        ("toDate", end.strftime("%d-%m-%Y")),
        ("hubSelectionID[]", "all"),
        ("state[]", "all"),
        ("delivery_point[]", "all"),
        ("product[]", "all"),
    ]
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            r = session.get(URL, params=params, timeout=TIMEOUT)
            r.raise_for_status()
            return r.text
        except requests.RequestException as e:
            if attempt == MAX_RETRIES:
                raise
            wait = DELAY_SEC * (2 ** attempt) + random.uniform(0, 1)
            log.warning("  fetch failed (%s), retry %d/%d in %.1fs",
                        e.__class__.__name__, attempt, MAX_RETRIES, wait)
            time.sleep(wait)
    raise RuntimeError("unreachable")


def _text(fragment: str) -> str:
    return htmllib.unescape(re.sub(r"<[^>]+>", " ", fragment)).strip()


def check_header(table: str) -> None:
    """Assert the column order still matches what we parse positionally."""
    head = table[: table.find("</tr>")] if "</tr>" in table else table
    # \b guards against <thead> also matching a <th...> pattern.
    cells = [_text(x) for x in re.findall(r"<th\b[^>]*>.*?</th>", head, re.S)]
    joined = " | ".join(cells)
    for i, probe in enumerate(HEADER_PROBES):
        if probe not in joined:
            raise RuntimeError(
                f"IGX schema changed: expected column {i} ~ {probe!r}; header was: {joined!r}"
            )


def parse(html: str) -> pd.DataFrame:
    """Extract <table id="example_table"> into a clean frame."""
    m = re.search(r'<table id="example_table".*?</table>', html, re.S)
    if not m:
        # Either a genuinely empty range or a Laravel error page.
        if "MethodNotAllowed" in html or "Exception" in html[:2000]:
            raise RuntimeError("server returned an error page, not the data table")
        return pd.DataFrame()
    table = m.group(0)
    check_header(table)

    records = []
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", table, re.S):
        cells = [_text(td) for td in re.findall(r"<td\b[^>]*>.*?</td>", tr, re.S)]
        if not cells:
            continue
        # Skip the "Grand Total/Avg:" footer -- it has no real trade date.
        if not re.match(r"^\d{2}-\d{2}-\d{4}$", cells[0]):
            continue
        if len(cells) != len(COLUMNS):
            raise RuntimeError(
                f"expected {len(COLUMNS)} cells, got {len(cells)}: {cells!r}"
            )
        records.append(cells)

    if not records:
        return pd.DataFrame()
    df = pd.DataFrame(records, columns=COLUMNS)

    df["trade_date"] = pd.to_datetime(df["trade_date"], format="%d-%m-%Y").dt.date

    for c in NUMERIC:
        # '-' means no trade / no bid; strip thousands separators before coercing.
        df[c] = pd.to_numeric(
            df[c].astype(str).str.replace(",", "", regex=False).str.strip().replace("-", None),
            errors="coerce",
        )

    for c in ["hub_state", "delivery_point", "product", "contract"]:
        df[c] = df[c].astype(str).str.strip()

    return df.reset_index(drop=True)


def month_chunks(start: date, end: date):
    """Yield (start, end) per calendar month. Smaller chunks = resumable + gentle."""
    cur = start
    while cur <= end:
        nxt = (cur.replace(day=1) + timedelta(days=32)).replace(day=1)
        yield cur, min(nxt - timedelta(days=1), end)
        cur = nxt


def load() -> pd.DataFrame:
    if OUT.exists():
        return pd.read_parquet(OUT)
    return pd.DataFrame()


def save(df: pd.DataFrame) -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    df = df.sort_values(KEY).reset_index(drop=True)
    df.to_parquet(OUT, index=False)
    df.to_csv(OUT.with_suffix(".csv"), index=False)


def scrape(start: date, end: date, existing: pd.DataFrame) -> pd.DataFrame:
    """Fetch date range month-by-month, checkpointing to disk after every chunk."""
    session = requests.Session()
    session.headers["User-Agent"] = UA
    combined = existing.copy() if not existing.empty else pd.DataFrame()
    chunks = list(month_chunks(start, end))
    new_rows = 0
    for i, (a, b) in enumerate(chunks, 1):
        df = parse(fetch(session, a, b))
        log.info("[%2d/%d] %s -> %s : %4d rows", i, len(chunks), a, b, len(df))
        if not df.empty:
            combined = pd.concat([combined, df], ignore_index=True)
            combined = combined.drop_duplicates(subset=KEY, keep="last")
            save(combined)
            new_rows += len(df)
        if i < len(chunks):
            time.sleep(DELAY_SEC + random.uniform(0, 0.5))
    return combined, new_rows


def main() -> int:
    p = argparse.ArgumentParser(description="Scrape IGX daily market data.")
    p.add_argument("--backfill", action="store_true", help="pull from inception")
    p.add_argument("--from", dest="frm", help="YYYY-MM-DD")
    p.add_argument("--to", dest="to", help="YYYY-MM-DD")
    a = p.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(message)s")
    today = date.today()
    existing = load()

    if a.backfill:
        start = INCEPTION
    elif a.frm:
        start = datetime.strptime(a.frm, "%Y-%m-%d").date()
    elif not existing.empty:
        # Re-pull the last stored day: same-day rows can still be updating.
        start = max(existing["trade_date"])
        log.info("archive holds %d rows through %s; resuming", len(existing), start)
    else:
        log.info("no archive found -- run with --backfill first")
        return 1
    end = datetime.strptime(a.to, "%Y-%m-%d").date() if a.to else today

    if start > end:
        log.info("up to date, nothing to fetch")
        return 0

    log.info("fetching %s -> %s", start, end)
    combined, new_rows = scrape(start, end, existing)

    if combined.empty:
        log.error("no data returned")
        return 1

    log.info(
        "\nnew=%d  total=%d  span=%s..%s  trading_days=%d\n-> %s",
        new_rows, len(combined),
        min(combined["trade_date"]), max(combined["trade_date"]),
        combined["trade_date"].nunique(), OUT,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
