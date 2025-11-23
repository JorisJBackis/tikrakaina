import requests
import json, ast, re
import pandas as pd
from bs4 import BeautifulSoup
from base64 import b64decode
import os


## importing model
BASE = "https://www.aruodas.lt/butu-nuoma/vilniuje/puslapis/{page}/"

# A small pool of real-world browser UAs
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/115.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) "
    "Version/14.1.2 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/114.0.0.0 Safari/537.36",
]

# Extended headers to mimic a real browser
COMMON_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;"
              "q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Upgrade-Insecure-Requests": "1",
    "Referer": "https://www.aruodas.lt/",
    "Connection": "keep-alive",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Dest": "document",
}


def make_session():
    sess = requests.Session()
    sess.headers.update(COMMON_HEADERS)
    # Prime cookies or JS challenges
    sess.get("https://www.aruodas.lt/butu-nuoma/vilniuje/", timeout=5)
    return sess


def parse_dl_block(dl):
    """
    Extract <dt>/<dd> pairs from a <dl> block.
    Returns a dict of {key: [values]}.
    """
    out = {}
    if not dl:
        return out
    for dt in dl.find_all("dt"):
        key = dt.get_text(strip=True).rstrip(":")
        dd = dt.find_next_sibling("dd")
        if not dd:
            continue

        spans = [s.get_text(strip=True) for s in dd.find_all("span") if s.get_text(strip=True)]
        if spans:
            out[key] = spans
        else:
            text = dd.get_text(strip=True)
            out[key] = [text] if text else []
    return out


def add_primary_heating_dummies(df, source_col="Šildymas"):
    """
    From df[source_col] (list or JSON-string list of heating types), extract
    the first word of the first list entry and one-hot encode:
      - Centrinis
      - Dujinis
      - Elektra
    using 'Kita' as the reference (i.e. no dummy for 'Kita').

    Returns a new DataFrame with the dummy columns added.
    """

    def get_primary(s):
        if pd.isna(s):
            return "Kita"
        # Case 1: already a list
        if isinstance(s, (list, tuple, set)):
            items = list(s)
        else:
            # Case 2: string
            try:
                items = json.loads(s)
            except Exception:
                try:
                    items = ast.literal_eval(str(s))
                except Exception:
                    return "Kita"
        if not items:
            return "Kita"
        first = str(items[0])
        # grab the first token before space or comma
        m = re.match(r"^([^ ,]+)", first)
        return m.group(1) if m else "Kita"

    # 1) build a Series of the primary heating type
    prim = df[source_col].map(get_primary).astype("category")

    # 2) manually create dummies for the 3 you want
    df = df.copy()
    df["heat_Centrinis"] = (prim == "Centrinis").astype(int)
    df["heat_Dujinis"] = (prim == "Dujinis").astype(int)
    df["heat_Elektra"] = (prim == "Elektra").astype(int)

    # 'Kita' is the implicit case when all three are 0
    return df


def add_window_orientation_dummies(df, source_col="Langų orientacija"):
    """
    From df[source_col] (JSON‑string lists of orientations), extract
    the first word of the first list entry (Pietūs, Vakarai, Rytai, Šiaurė, etc.),
    then one‑hot encode:
      - orient_Pietus
      - orient_Vakarai
      - orient_Rytai
    using 'Šiaurė' as the implicit reference (all zeros).
    """

    def get_primary_orient(s):
        if pd.isna(s):
            return "Šiaurė"
        try:
            items = json.loads(s)
            if not items:
                return "Šiaurė"
            first = items[0]
            # grab the first token before space or comma
            m = re.match(r"^([^ ,]+)", first)
            return m.group(1) if m else "Šiaurė"
        except Exception:
            return "Šiaurė"

    prim = df[source_col].map(get_primary_orient).astype("category")

    out = df.copy()
    out["orient_Pietus"] = (prim == "Pietūs").astype(int)
    out["orient_Vakarai"] = (prim == "Vakarai").astype(int)
    out["orient_Rytai"] = (prim == "Rytai").astype(int)
    # Šiaurė is the reference (when all three dummies are zero)
    return out


def zyte_fetch_html(url, render=False, api_key=None, timeout=30):
    """
    Fetches the full HTML of a webpage using the Zyte Extract API.

    Parameters
    ----------
    url : str
        The webpage URL to fetch (e.g. an Aruodas detail page).
    render : bool, optional
        If False (default), Zyte returns static HTML via `httpResponseBody`
        — fastest and cheapest mode (no JavaScript executed).
        If True, Zyte launches a headless Chromium browser and returns
        fully rendered HTML via `browserHtml` — slower and pricier,
        only needed for dynamic JS-heavy pages.
    api_key : str, optional
        Zyte API key. If not provided, tries to read from the environment
        variable `ZYTE_API_KEY`.
    timeout : int, optional
        Maximum time (in seconds) to wait for Zyte’s API response.

    Returns
    -------
    str
        Decoded HTML of the requested webpage, ready for parsing
        with BeautifulSoup or similar tools.

    Raises
    ------
    RuntimeError
        If the API key is not set.
    requests.exceptions.RequestException
        If Zyte’s API call fails (network, 4xx, 5xx errors, etc.).
    ValueError
        If Zyte’s response doesn’t contain a valid HTML body.

    Notes
    -----
    - Zyte handles all Cloudflare / bot-detection layers internally.
    - You’re only charged for successful requests, so small failures
      (e.g. 404 or invalid URLs) won’t cost much.
    - For Aruodas.lt, `render=False` is typically sufficient.
    """

    # Prefer the explicitly passed key; fallback to env var
    key = api_key or os.getenv("ZYTE_API_KEY")
    if not key:
        raise RuntimeError("ZYTE_API_KEY not set. Export it or pass api_key=...")

    # Build Zyte API request payload
    payload = {
        "url": url,
        "httpResponseBody": True,  # request the raw HTML (base64 encoded)
        "followRedirect": True,    # follow 301/302 redirects automatically
        "browserHtml": bool(render)  # enable Chromium rendering if needed
    }

    # Send POST request to Zyte’s Extract API
    response = requests.post(
        "https://api.zyte.com/v1/extract",
        auth=(key, ""),       # Basic auth: username = API key
        json=payload,
        timeout=timeout
    )
    response.raise_for_status()  # raises HTTPError on failure

    # Parse JSON response
    data = response.json()

    # Try multiple possible HTML keys (depends on Zyte mode)
    body_b64 = (
        data.get("httpResponseBody")
        or data.get("browserHtml")
        or data.get("text")
        or ""
    )

    # Decode from Base64 → UTF-8 text
    if not body_b64:
        raise ValueError(f"No HTML content returned for {url}")

    html = b64decode(body_b64).decode("utf-8", errors="ignore")
    return html

def _parsed_looks_complete(soup: BeautifulSoup, verbose: bool = False) -> bool:
    """
    Check whether both 'obj-details' and 'obj-stats' sections exist.
    If verbose=True, prints which section(s) are missing.
    """
    has_details = soup.select_one("dl.obj-details") is not None
    has_stats   = soup.select_one("div.obj-stats dl") is not None

    if verbose and (not has_details or not has_stats):
        missing_parts = []
        if not has_details:
            missing_parts.append("obj-details")
        if not has_stats:
            missing_parts.append("obj-stats")
        print(f"⚠️ Missing section(s): {', '.join(missing_parts)}")

    return has_details and has_stats

