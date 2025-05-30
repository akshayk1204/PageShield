const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const path = require('path');

function normalizeURL(url) {
  return /^https?:\/\//i.test(url) ? url : 'https://' + url;
}

const TRACKERS = [
  'google-analytics.com', 'googletagmanager.com', 'doubleclick.net', 'facebook.net',
  'facebook.com', 'twitter.com', 'linkedin.com', 'hotjar.com', 'cloudflareinsights.com',
  'quantserve.com', 'scorecardresearch.com', 'adnxs.com', 'taboola.com', 'outbrain.com',
  'yandex.ru', 'bing.com', 'matomo.org', 'segment.io', 'cdn.segment.com',
];

const suspiciousPatterns = [
  /eval\s*\(/, /document\.write\s*\(/, /Function\s*\(/, /atob\s*\(/, /setTimeout\s*\(\s*['"`]/
];

const DANGEROUS_HEADERS = ['x-powered-by', 'server'];

function generateCSP(domains, inlineScripts) {
  const scriptSrc = ['\'self\'', ...domains.map(d => `https://${d}`)];
  if (inlineScripts) scriptSrc.push('\'unsafe-inline\'');
  return `Content-Security-Policy: default-src 'self'; script-src ${scriptSrc.join(' ')};`;
}

async function scanURL(rawUrl) {
  const targetUrl = normalizeURL(rawUrl);
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();

  const scripts = new Set();
  const requestDomains = new Set();
  let cspHeader = null;
  const dangerousHeaders = {};
  let inlineScriptDetected = false;
  const suspiciousScripts = [];

  // Capture all requested domains
  page.on('request', (req) => {
    try {
      const url = new URL(req.url());
      requestDomains.add(url.hostname);
    } catch (err) {
      console.warn(`Request parsing error: ${err.message}`);
    }
  });

  // Capture headers
  page.on('response', async (res) => {
    const headers = res.headers();
    for (let h of DANGEROUS_HEADERS) {
      if (headers[h]) dangerousHeaders[h] = headers[h];
    }
    if (headers['content-security-policy'] && !cspHeader) {
      cspHeader = headers['content-security-policy'];
    }
  });

  try {
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Extract JS scripts
    const scriptSources = await page.$$eval('script', (scripts) =>
      scripts.map(s => s.src || '[inline]')
    );

    for (let src of scriptSources) {
      if (src === '[inline]') inlineScriptDetected = true;
      scripts.add(src);
    }

    // Static suspicious patterns
    const pageContent = await page.content();
    for (let pattern of suspiciousPatterns) {
      if (pattern.test(pageContent)) suspiciousScripts.push(pattern.toString());
    }

    // Mixed content detection
    const mixedContent = await page.$$eval('*', elements =>
      elements
        .map(el => el.getAttribute('src') || el.getAttribute('href') || '')
        .filter(link => typeof link === 'string' && link.startsWith('http://'))
    );

    // Insecure form actions
    const insecureForms = await page.$$eval('form', forms =>
      forms
        .map(f => f.action)
        .filter(a => typeof a === 'string' && a.startsWith('http://'))
    );

    // Third-party iframes
    const thirdPartyIframes = await page.$$eval('iframe', (frames, pageHost) =>
      frames
        .map(f => f.src)
        .filter(src => {
          try {
            const frameHost = new URL(src).hostname;
            return src && frameHost !== pageHost && !frameHost.endsWith('.' + pageHost);
          } catch {
            return false;
          }
        }), new URL(targetUrl).hostname
    );

    // Generate CSP
    const cspGenerated = generateCSP([...requestDomains], inlineScriptDetected);

    // Call Python scanner
    const pythonResult = await runPythonScanner(targetUrl);

    await browser.close();

    const allDomains = Array.from(requestDomains);
    const trackerMatches = allDomains.filter(domain =>
      TRACKERS.some(tracker => domain.includes(tracker))
    );

    return {
      success: true,
      url: targetUrl,
      summary: {
        mixedContent: mixedContent.length ? 'Mixed content found' : 'None detected',
        suspiciousScripts: suspiciousScripts.length ? 'Suspicious scripts present' : 'None detected',
        insecureForms: insecureForms.length ? 'Insecure form actions found' : 'None',
        thirdPartyIframes: thirdPartyIframes.length ? 'Third-party iframes found' : 'None',
      },
      jsScanner: {
        scripts: Array.from(scripts),
        requestedDomains: allDomains,
        csp: cspHeader || 'Not set',
        trackerDomains: trackerMatches,
        mixedContent,
        suspiciousPatterns: suspiciousScripts,
        insecureForms,
        thirdPartyIframes,
        suggestedCSP: cspGenerated,
        dangerousHeaders,
      },
      pyScanner: pythonResult
    };
  } catch (err) {
    console.error('Scan failed:', err);
    await browser.close();
    return {
      success: false,
      url: targetUrl,
      error: 'Scan failed',
      details: err.message || 'Unknown scan error'
    };
  }
}

async function runPythonScanner(url) {
  const pythonPath = 'python3';
  const scriptPath = path.join(__dirname, '../utils/scanner.py');

  return new Promise((resolve, reject) => {
    const py = spawn(pythonPath, [scriptPath, url]);
    let output = '', error = '';

    py.stdout.on('data', data => output += data.toString());
    py.stderr.on('data', data => error += data.toString());

    py.on('close', code => {
      if (code !== 0) {
        console.error('Python script failed:', error);
        return reject(`Python script exited with code ${code}, error: ${error}`);
      }
      try {
        const parsed = JSON.parse(output);
        resolve(parsed);
      } catch (e) {
        console.error('Failed to parse Python output:', output);
        reject(`Failed to parse Python output: ${e.message}, raw output: ${output}`);
      }
    });

    py.on('error', err => {
      console.error('Python process error:', err);
      reject(`Failed to start Python process: ${err.message}`);
    });
  });
}

module.exports = { scanURL };
