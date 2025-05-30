import sys
import requests
import json
import re
import math
from bs4 import BeautifulSoup
from urllib.parse import urlparse

# Suspicious trackers, CDNs, beacons, session recorders, etc.
suspicious_keywords = [
    'ads', 'tracker', 'spy', 'click', 'analytics', 'pixel', 'adservice',
    'googletagmanager', 'doubleclick', 'facebook.net', 'gtm.js', 'heatmap',
    'track.js', 'affiliate', 'beacon', 'logger', 'sessionrecording', 'mouseflow',
    'hotjar', 'mixpanel', 'segment', 'optimizely', 'cdn-cgi', 'clarity',
    'crazyegg', 'clicktale', 'sentry', 'newrelic', 'datadog'
]

# Known vulnerable or deprecated libraries
outdated_libs = {
    'jquery-1.8.3.min.js': 'CVE-2011-4969',
    'jquery-1.12.4.js': 'CVE-2020-11022, CVE-2020-11023',
    'angular-1.2.0.js': 'CVE-2018-3741',
    'angular-1.6.0.js': 'CVE-2019-7609',
    'bootstrap-3.3.7.js': 'CVE-2018-14041',
    'bootstrap-3.4.0.js': 'CVE-2019-8331',
    'moment.js': 'Deprecated – known vulnerabilities',
    'lodash.js': 'Prototype pollution vulnerabilities',
    'underscore.js': 'CVE-2021-23358',
    'handlebars.js': 'CVE-2019-19919'
}

def entropy(s):
    """Calculate entropy of a string to detect obfuscation."""
    prob = [float(s.count(c)) / len(s) for c in dict.fromkeys(list(s))]
    return -sum(p * math.log(p) / math.log(2.0) for p in prob)

def analyze_scripts(soup):
    scripts = soup.find_all('script')
    results = []

    for script in scripts:
        entry = {"source": "", "reasons": []}

        if script.get('src'):
            src = script['src']
            entry['source'] = src
            parsed = urlparse(src)

            if parsed.scheme == 'http':
                entry['reasons'].append("Insecure HTTP Script")

            if any(kw in src.lower() for kw in suspicious_keywords):
                entry['reasons'].append("Suspicious keyword in URL")

            for lib_name, cve in outdated_libs.items():
                if lib_name in src:
                    entry['reasons'].append(f"Outdated Library: {lib_name} - {cve}")
        else:
            content = script.string or ""
            entry['source'] = "[inline script]"

            if 'eval' in content and re.search(r'(unescape|fromCharCode|\\x)', content):
                entry['reasons'].append("Obfuscated inline script using eval/unescape")

            if re.search(r'document\.write\(', content):
                entry['reasons'].append("Usage of document.write() - can lead to injection")

            if re.search(r'setTimeout\s*\(\s*[\'"]', content) or re.search(r'setInterval\s*\(\s*[\'"]', content):
                entry['reasons'].append("Unsafe use of setTimeout/setInterval with string eval")

            if len(content) > 100 and entropy(content) > 4.0:
                entry['reasons'].append("High entropy inline script - potential obfuscation")

        if entry['reasons']:
            results.append(entry)

    return results

def analyze_forms(soup):
    forms = soup.find_all('form')
    warnings = []

    for form in forms:
        action = form.get('action', '')
        if not action:
            warnings.append({"form_action": "[empty]", "warning": "Form has no action"})
        elif action.startswith('http:'):
            warnings.append({"form_action": action, "warning": "Insecure form action using HTTP"})
    return warnings

def analyze_iframes(soup, base_url):
    iframes = soup.find_all('iframe')
    third_party = []
    base_domain = urlparse(base_url).netloc

    for iframe in iframes:
        src = iframe.get('src', '')
        if src:
            parsed = urlparse(src)
            if parsed.scheme in ['http', 'https']:
                domain = parsed.netloc
                if base_domain not in domain:
                    third_party.append({
                        "iframe_src": src,
                        "warning": "Third-party iframe from external domain"
                    })
    return third_party

def detect_csp_headers(headers):
    csp = headers.get("Content-Security-Policy")
    if not csp:
        return {"status": "missing", "warning": "No Content-Security-Policy header set"}
    elif "'unsafe-inline'" in csp:
        return {"status": "present", "warning": "CSP contains 'unsafe-inline'"}
    return {"status": "present", "message": "CSP is set"}

def detect_mixed_content(soup):
    tags_with_urls = soup.find_all(src=True) + soup.find_all(href=True)
    mixed = []
    for tag in tags_with_urls:
        url = tag.get('src') or tag.get('href')
        if url and url.startswith('http:'):
            mixed.append(url)
    return mixed

def run_static_analysis(html_content, response_headers, base_url):
    soup = BeautifulSoup(html_content, 'html.parser')
    return {
        "scripts": analyze_scripts(soup),
        "forms": analyze_forms(soup),
        "iframes": analyze_iframes(soup, base_url),
        "headers": {
            "csp": detect_csp_headers(response_headers)
        },
        "mixedContent": detect_mixed_content(soup)
    }

def main():
    if len(sys.argv) != 2:
        print("❌ Usage: python3 scanner.py <url>", file=sys.stderr)
        sys.exit(1)

    url = sys.argv[1]
    print("⚙️ Python scanner started", file=sys.stderr)

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9"
        }

        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        html = response.text

        result = run_static_analysis(html, response.headers, url)

        print(json.dumps({
            "url": url,
            "status": "scanned",
            "details": result
        }, indent=2))

        print("✅ Python scanner finished", file=sys.stderr)

    except requests.exceptions.HTTPError as e:
        print(f"❌ Failed to fetch URL: HTTP {e.response.status_code} - {e.response.reason}", file=sys.stderr)
        print(json.dumps({
            "url": url,
            "status": "error",
            "message": f"HTTP error {e.response.status_code} - {e.response.reason}"
        }))
        sys.exit(1)
    except requests.exceptions.RequestException as e:
        print(f"❌ Failed to fetch URL: {str(e)}", file=sys.stderr)
        print(json.dumps({
            "url": url,
            "status": "error",
            "message": f"Request failed - {str(e)}"
        }))
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}", file=sys.stderr)
        print(json.dumps({
            "url": url,
            "status": "error",
            "message": f"Unexpected error - {str(e)}"
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
