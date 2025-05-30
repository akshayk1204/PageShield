import httpx
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin
from .score import compute_score
from .csp_generator import generate_csp
import logging

logger = logging.getLogger(__name__)

TRACKER_PATTERNS = [
    "googletagmanager.com", "google-analytics.com", "facebook.net",
    "hotjar.com", "mixpanel.com", "doubleclick.net", "segment.io"
]

MALICIOUS_PATTERNS = [
    "coinhive", "cryptojacking", "skimmer", "jquery.fake",
    "obfuscated.js", "base64,eval", "evil.js", "suspicious.min.js"
]

def is_mixed_content(script_src: str, page_url: str) -> bool:
    return page_url.startswith("https://") and script_src.startswith("http://")

async def analyze_url(url: str):
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url)
            html = response.text
            headers = response.headers

        soup = BeautifulSoup(html, "html.parser")
        parsed_url = urlparse(url)

        js_libraries = []
        tracker_scripts = []
        mixed_content_scripts = []
        malicious_scripts = []

        for script in soup.find_all("script"):
            src = script.get("src")
            content = script.string or ""

            if src:
                full_src = urljoin(url, src)
                js_libraries.append(full_src)

                if is_mixed_content(full_src, url):
                    mixed_content_scripts.append(full_src)

                if any(tracker in full_src for tracker in TRACKER_PATTERNS):
                    tracker_scripts.append(full_src)

                if any(mal in full_src for mal in MALICIOUS_PATTERNS):
                    malicious_scripts.append(full_src)
            else:
                if any(mal in content for mal in MALICIOUS_PATTERNS):
                    malicious_scripts.append("inline-script")

        csp_headers = {
            k: v for k, v in headers.items()
            if k.lower() == "content-security-policy"
        }

        # CDN Detection - naive Cloudflare header or JS usage
        server_header = headers.get("server", "").lower()
        cdn_used = "Cloudflare" if "cloudflare" in server_header or any("cloudflare" in js for js in js_libraries) else "Unknown"

        result = {
            "url": url,
            "libraries": js_libraries,
            "csp": csp_headers,
            "trackers": tracker_scripts,
            "mixed_content": mixed_content_scripts,
            "malicious_scripts": malicious_scripts,
            "cdn_used": cdn_used,
        }

        result["score"] = compute_score(result)
        result["suggested_csp"] = generate_csp(result)

        logger.info(f"Scan successful for {url}")
        return result

    except Exception as e:
        logger.exception(f"Error analyzing {url}: {e}")
        return {
            "error": str(e),
            "score": 0,
            "url": url,
            "libraries": [],
            "csp": {},
            "trackers": [],
            "mixed_content": [],
            "malicious_scripts": [],
            "cdn_used": "Unknown",
            "suggested_csp": ""
        }
