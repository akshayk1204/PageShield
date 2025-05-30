# 🛡️ PageShield

PageShield is a powerful hybrid web security scanner that inspects both static HTML and dynamically loaded JavaScript resources to detect common vulnerabilities and misconfigurations. It provides an actionable security report complete with recommendations and a visual security score.

## 🌐 Features

- ✅ **Hybrid Scanning**: Combines static HTML analysis (Python) and dynamic JS analysis (Puppeteer).
- 🔍 **Detects**:
  - Mixed content (HTTP over HTTPS)
  - Dangerous or missing Content Security Policy (CSP)
  - Suspicious JavaScript patterns
  - Tracker domains and third-party scripts
  - Insecure form actions
  - Meta tag leaks and misconfigurations
  - Dangerous response headers
- 📊 **Security Score & Summary**: Easy-to-understand score based on findings.
- 📋 **Suggested CSP Generator**: Sample CSP header based on detected resources.
- 📁 **Exportable Reports** *(coming soon)*

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+)
- Python 3.9+
- Docker (optional for deployment)
- Puppeteer (installed via Node)
- PostgreSQL (for storing scan history)

### Setup Instructions

#### 1. Clone the repo

```bash
git clone https://github.com/akshayk1204/pageshield.git
cd pageshield
