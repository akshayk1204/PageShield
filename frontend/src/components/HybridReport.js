import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Clipboard, ExternalLink, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import PropTypes from 'prop-types';

// Reusable Section Component
const Section = ({ title, children, style = {}, collapsible = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      style={{
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '28px',
        backgroundColor: '#1e1e1e',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        ...style
      }}
    >
      <h2 
        style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          color: '#34d399', 
          marginBottom: isCollapsed ? '0' : '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: collapsible ? 'pointer' : 'default'
        }}
        onClick={() => collapsible && setIsCollapsed(!isCollapsed)}
      >
        {collapsible && (
          isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />
        )}
        {title}
      </h2>
      {!isCollapsed && children}
    </div>
  );
};

Section.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  style: PropTypes.object,
  collapsible: PropTypes.bool
};

// List Component with virtualization for large datasets
const List = ({ items, maxHeight = 180 }) => {
  if (!Array.isArray(items)) {
    return (
      <span style={{ fontStyle: 'italic', color: '#777', display: 'inline-block', marginBottom: '8px' }}>
        Data not available
      </span>
    );
  }

  if (items.length === 0) {
    return (
      <span style={{ fontStyle: 'italic', color: '#777', display: 'inline-block', marginBottom: '8px' }}>
        None detected
      </span>
    );
  }

  return (
    <div style={{ 
      maxHeight: `${maxHeight}px`, 
      overflowY: 'auto', 
      paddingRight: '8px', 
      marginBottom: '12px', 
      borderLeft: '2px solid #444', 
      paddingLeft: '12px' 
    }}>
      <ul style={{ 
        paddingLeft: '20px', 
        margin: 0, 
        color: '#ddd',
        listStyleType: 'none'
      }}>
        {items.map((item, i) => (
          <li key={`item-${i}`} style={{ 
            wordBreak: 'break-word', 
            marginBottom: '8px',
            position: 'relative',
            paddingLeft: '20px'
          }}>
            <span style={{
              position: 'absolute',
              left: 0,
              color: '#666'
            }}>•</span>
            {typeof item === 'string' ? item : JSON.stringify(item)}
          </li>
        ))}
      </ul>
    </div>
  );
};

List.propTypes = {
  items: PropTypes.array,
  maxHeight: PropTypes.number
};

// Copyable Block Component with improved accessibility
const CopyableBlock = ({ text, label }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!text) return;
    
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text:', err);
      });
  };

  return (
    <div style={{ position: 'relative', marginTop: '20px' }}>
      <h3 style={{ 
        color: label.includes('Suggested') ? '#a6f3a6' : '#facc15', 
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        {label}
      </h3>
      <pre style={{
        background: label.includes('Suggested') ? '#1f3f1f' : '#252525',
        padding: '14px',
        borderRadius: '6px',
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace',
        color: label.includes('Suggested') ? '#a6f3a6' : '#ddd',
        border: label.includes('Suggested') ? '1px solid #3fa73f' : '1px solid #444',
        margin: 0,
        position: 'relative',
        overflowX: 'auto'
      }}>
        {text || 'Not available'}
        {text && (
          <button
            onClick={handleCopy}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              padding: '6px 10px',
              background: '#333',
              border: 'none',
              color: '#fff',
              fontSize: '12px',
              cursor: 'pointer',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'background 0.2s',
              ':hover': {
                background: '#444'
              }
            }}
            aria-label={`Copy ${label}`}
            disabled={copied}
          >
            <Clipboard size={14} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </pre>
    </div>
  );
};

CopyableBlock.propTypes = {
  text: PropTypes.string,
  label: PropTypes.string.isRequired
};

// URL Component with safety checks
const SafeUrl = ({ url }) => {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        style={{
          color: '#58a6ff',
          textDecoration: 'none',
          ':hover': {
            textDecoration: 'underline'
          }
        }}
      >
        {parsed.hostname}
        <ExternalLink size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
      </a>
    );
  } catch {
    return <span style={{ color: '#ddd' }}>{url}</span>;
  }
};

SafeUrl.propTypes = {
  url: PropTypes.string
};

// Main Report Component
const HybridReport = ({ data }) => {
  if (!data) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: '#fff',
        backgroundColor: '#121212'
      }}>
        <p>No scan data available</p>
      </div>
    );
  }

  const { url, jsScanner = {}, pyScanner = {}, summary = {} } = data;

  // Process and group security findings
  const processFindings = () => {
    // Group similar issues with counts
    const groupIssues = (issues) => {
      const grouped = {};
      issues.forEach(issue => {
        const key = issue.replace(/\d+/g, '#');
        grouped[key] = (grouped[key] || 0) + 1;
      });
      return Object.entries(grouped).map(([issue, count]) => 
        count > 1 ? `${count}x ${issue}` : issue
      );
    };

    const mixedContent = [
      ...(jsScanner.mixedContent?.length ? ['Mixed content in dynamic resources'] : []),
      ...(pyScanner.details?.mixedContent?.length ? ['Mixed content in static HTML'] : [])
    ];

    const suspiciousScripts = [
      ...(jsScanner.suspiciousPatterns?.length ? jsScanner.suspiciousPatterns.map(p => `Suspicious JavaScript pattern: ${p}`) : []),
      ...((pyScanner.details?.scripts || []).filter(s => s.reasons?.length)
        .map(s => `Suspicious ${s.source.includes('[inline]') ? 'inline script' : 'external script'}: ${s.reasons.join(', ')}`))
    ];

    const trackers = jsScanner.trackerDomains?.length
      ? [`Trackers detected: ${jsScanner.trackerDomains.join(', ')}`]
      : [];

    const insecureForms = pyScanner.details?.forms?.length
      ? pyScanner.details.forms.map(f => `Form issue: ${f.warning}`)
      : [];

    const thirdPartyIframes = [
      ...(jsScanner.thirdPartyIframes?.length ? ['Third-party iframes in dynamic content'] : []),
      ...((pyScanner.details?.iframes || []).map(f => `Third-party iframe: ${f.iframe_src}`))
    ];

    const cspIssues = [];
    if (!jsScanner.csp) {
      cspIssues.push('No Content Security Policy detected');
    } else {
      if (jsScanner.csp.includes("'unsafe-inline'")) {
        cspIssues.push('CSP contains unsafe-inline directive');
      }
      if (jsScanner.csp.includes("'unsafe-eval'")) {
        cspIssues.push('CSP contains unsafe-eval directive');
      }
    }

    const dangerousHeaders = jsScanner.dangerousHeaders
      ? Object.entries(jsScanner.dangerousHeaders).map(([header, value]) => 
          `Dangerous header detected: ${header} (${value})`)
      : [];

    const allIssues = [
      ...groupIssues(mixedContent),
      ...groupIssues(suspiciousScripts),
      ...groupIssues(trackers),
      ...groupIssues(insecureForms),
      ...groupIssues(thirdPartyIframes),
      ...groupIssues(cspIssues),
      ...groupIssues(dangerousHeaders)
    ];

    return {
      mixedContent,
      suspiciousScripts,
      trackers,
      insecureForms,
      thirdPartyIframes,
      cspIssues,
      dangerousHeaders,
      allIssues
    };
  };

  const { allIssues } = processFindings();

  // Generate recommendations
  const generateRecommendations = () => {
    const recs = [];

    if (processFindings().mixedContent.length) {
      recs.push(
        'Update all HTTP resources to HTTPS to prevent mixed content warnings',
        'Consider implementing HSTS (HTTP Strict Transport Security)'
      );
    }

    if (processFindings().suspiciousScripts.length) {
      recs.push(
        'Review all external scripts for potential malicious behavior',
        'Consider removing or replacing suspicious scripts',
        'Implement Subresource Integrity (SRI) for external scripts'
      );
    }

    if (processFindings().trackers.length) {
      recs.push(
        'Evaluate necessity of tracking scripts for privacy compliance',
        'Consider using privacy-focused analytics alternatives'
      );
    }

    if (processFindings().insecureForms.length) {
      recs.push(
        'Update form actions to use HTTPS',
        'Implement CSRF protection for all forms'
      );
    }

    if (processFindings().thirdPartyIframes.length) {
      recs.push(
        'Review third-party iframes for security implications',
        'Consider using sandbox attribute for iframes'
      );
    }

    if (processFindings().cspIssues.length) {
      recs.push(
        'Implement a strong Content Security Policy',
        'Remove unsafe-inline and unsafe-eval from CSP where possible',
        'Consider implementing reporting-uri for CSP violations'
      );
    }

    if (processFindings().dangerousHeaders.length) {
      recs.push(
        'Remove or obscure server headers that reveal implementation details'
      );
    }

    if (recs.length === 0) {
      recs.push('No specific recommendations - security posture looks good');
    }

    return recs;
  };

  const recommendations = generateRecommendations();

  // Severity level for issues
  const getSeverity = (issue) => {
    if (issue.includes('unsafe') || issue.includes('eval') || issue.includes('inline')) {
      return 'high';
    }
    if (issue.includes('tracker') || issue.includes('suspicious')) {
      return 'medium';
    }
    return 'low';
  };

  // Severity colors
  const severityColors = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#3b82f6'
  };

  // Calculate security score
  const securityScore = Math.max(0, 100 - (allIssues.length * 5));
  const securityRating = allIssues.length === 0 ? 'Excellent' :
                       allIssues.length <= 3 ? 'Good' :
                       allIssues.length <= 6 ? 'Fair' : 'Poor';

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '40px auto',
      fontFamily: 'Segoe UI, Roboto, sans-serif',
      padding: '0 20px',
      color: '#fff',
      backgroundColor: '#121212',
      minHeight: '100vh'
    }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '12px',
          color: '#34d399',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Shield size={28} /> 
          PageShield Security Report
        </h1>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          color: '#bbb',
          marginBottom: '8px'
        }}>
          <strong>Scanned URL:</strong> 
          <SafeUrl url={url} />
        </div>
        <div style={{ 
          display: 'flex', 
          gap: '16px',
          color: '#999',
          fontSize: '14px'
        }}>
          <span>
            <strong>Scan time:</strong> {new Date().toLocaleString()}
          </span>
          <span>
            <strong>Report ID:</strong> {data.reportId || 'N/A'}
          </span>
        </div>
      </header>

      {/* Security Score Card - Prominently Displayed */}
      <Section 
            title="Security Assessment" 
            style={{ 
                borderLeft: `6px solid ${severityColors[
                securityRating === 'Excellent' ? 'low' : securityRating === 'Good' ? 'medium' : 'high'
                ]}` 
            }}
            >
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '20px 0'
        }}>
          <div style={{
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: `conic-gradient(
              #10b981 ${securityScore}%,
              ${securityScore > 70 ? '#f59e0b' : '#ef4444'} ${securityScore}% 100%
            )`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
          }}>
            <span style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#fff'
            }}>
              {securityScore}%
            </span>
            <span style={{
              fontSize: '14px',
              color: '#d1fae5',
              marginTop: '4px'
            }}>
              {securityRating}
            </span>
          </div>
          
          <div style={{
            backgroundColor: '#1f2937',
            borderRadius: '8px',
            padding: '16px',
            width: '100%',
            maxWidth: '600px'
          }}>
            <h3 style={{ 
              color: '#3b82f6', 
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              Security Summary
            </h3>
            <p style={{ 
              color: '#d1d5db', 
              marginBottom: '8px',
              fontSize: '15px'
            }}>
              {allIssues.length === 0 ? (
                <span style={{ color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <CheckCircle size={18} /> No critical security issues detected
                </span>
              ) : (
                `Found ${allIssues.length} security ${allIssues.length === 1 ? 'issue' : 'issues'}`
              )}
            </p>
          </div>
        </div>
      </Section>

      {/* Security Findings and Recommendations */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        '@media (max-width: 768px)': {
          gridTemplateColumns: '1fr'
        }
      }}>
        {/* Detected Issues */}
        <Section title="Detected Issues" collapsible>
          {allIssues.length > 0 ? (
            <ul style={{ 
              paddingLeft: '0', 
              color: '#ddd', 
              marginBottom: '20px',
              listStyle: 'none'
            }}>
              {allIssues.map((issue, i) => (
                <li key={`issue-${i}`} style={{ 
                  marginBottom: '12px',
                  paddingLeft: '24px',
                  position: 'relative',
                  borderLeft: `3px solid ${severityColors[getSeverity(issue)]}`,
                  padding: '8px 12px',
                  backgroundColor: '#252525',
                  borderRadius: '4px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <AlertTriangle 
                      size={16} 
                      style={{ 
                        flexShrink: 0,
                        color: severityColors[getSeverity(issue)],
                        marginTop: '2px'
                      }} 
                    />
                    <span>{issue}</span>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#999',
                    marginTop: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      padding: '2px 6px',
                      backgroundColor: severityColors[getSeverity(issue)],
                      borderRadius: '4px',
                      color: '#fff'
                    }}>
                      {getSeverity(issue).toUpperCase()}
                    </span>
                    {issue.startsWith('CSP') && 'Content Security Policy'}
                    {issue.includes('script') && 'JavaScript Security'}
                    {issue.includes('tracker') && 'Privacy Concern'}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{
              backgroundColor: '#1f3f1f',
              padding: '16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <CheckCircle size={24} color="#34d399" />
              <div>
                <h3 style={{ color: '#a6f3a6', margin: '0 0 4px 0' }}>No Critical Issues Found</h3>
                <p style={{ color: '#d1fae5', margin: 0, fontSize: '14px' }}>
                  Basic security checks passed successfully
                </p>
              </div>
            </div>
          )}
        </Section>

        {/* Recommendations */}
        <Section title="Recommendations" collapsible>
          <ul style={{ 
            paddingLeft: '0', 
            color: '#aaffaa',
            listStyle: 'none'
          }}>
            {recommendations.map((rec, i) => (
              <li key={`rec-${i}`} style={{ 
                marginBottom: '12px',
                padding: '12px',
                backgroundColor: '#1f2f1f',
                borderRadius: '6px',
                borderLeft: '3px solid #3fa73f',
                display: 'flex',
                gap: '8px'
              }}>
                <span style={{
                  flexShrink: 0,
                  width: '24px',
                  height: '24px',
                  backgroundColor: '#3fa73f',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 'bold'
                }}>
                  {i + 1}
                </span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {/* Technical Details Sections */}
      <Section title="JavaScript Scanner (Dynamic)">
        <h3 style={{ color: '#facc15' }}>Requested Domains</h3>
        <List items={jsScanner.requestedDomains} />

        <h3 style={{ marginTop: '18px', color: '#facc15' }}>External Scripts</h3>
        <List items={jsScanner.scripts} />

        <h3 style={{ marginTop: '18px', color: '#facc15' }}>Trackers Detected</h3>
        <List items={jsScanner.trackerDomains} />

        <h3 style={{ marginTop: '18px', color: '#facc15' }}>Mixed Content</h3>
        <List items={jsScanner.mixedContent} />

        <h3 style={{ marginTop: '18px', color: '#facc15' }}>Suspicious JavaScript Patterns</h3>
        <List items={jsScanner.suspiciousPatterns} />

        <h3 style={{ marginTop: '18px', color: '#facc15' }}>Dangerous Headers</h3>
        {jsScanner.dangerousHeaders ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #444', padding: '6px', color: '#aaa' }}>Header</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #444', padding: '6px', color: '#aaa' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(jsScanner.dangerousHeaders).map(([key, value], i) => (
                  <tr key={i}>
                    <td style={{ padding: '6px 8px', verticalAlign: 'top', color: '#eee' }}>{key}</td>
                    <td style={{ padding: '6px 8px', color: '#bbb' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <span style={{ fontStyle: 'italic', color: '#777', display: 'inline-block', marginBottom: '8px' }}>
            None detected
          </span>
        )}

        <CopyableBlock text={jsScanner.csp} label="Content-Security-Policy" />
        <CopyableBlock text={jsScanner.suggestedCSP} label="Suggested CSP" />
      </Section>

      <Section title="HTML Scanner (Static)">
        <h3 style={{ color: '#facc15' }}>Script Sources</h3>
        <List items={pyScanner.details?.scripts?.map(s => s.source)} />

        <h3 style={{ marginTop: '18px', color: '#facc15' }}>Inline Script Count</h3>
        <p style={{ color: '#ddd' }}>
          <strong>{pyScanner.details?.scripts?.filter(s => s.source === '[inline script]').length || '0'}</strong>
          {pyScanner.details?.scripts?.filter(s => s.reasons?.length && s.source === '[inline script]').length > 0 && (
            <span style={{ color: '#f59e0b', marginLeft: '8px' }}>
              ({pyScanner.details.scripts.filter(s => s.reasons?.length && s.source === '[inline script]').length} suspicious)
            </span>
          )}
        </p>

        <h3 style={{ marginTop: '18px', color: '#facc15' }}>Meta Tags</h3>
        {pyScanner.details?.metaTags && Object.keys(pyScanner.details.metaTags).length ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #444', padding: '6px', color: '#aaa' }}>Name</th>
                  <th style={{ textAlign: 'left', borderBottom: '1px solid #444', padding: '6px', color: '#aaa' }}>Content</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(pyScanner.details.metaTags).map(([key, value], i) => (
                  <tr key={i}>
                    <td style={{ padding: '6px 8px', verticalAlign: 'top', color: '#eee' }}>{key}</td>
                    <td style={{ padding: '6px 8px', color: '#bbb' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ fontStyle: 'italic', color: '#777' }}>No meta tags found</p>
        )}
      </Section>
    </div>
  );
};

HybridReport.propTypes = {
  data: PropTypes.shape({
    url: PropTypes.string,
    jsScanner: PropTypes.object,
    pyScanner: PropTypes.object,
    summary: PropTypes.object,
    reportId: PropTypes.string
  })
};

export default HybridReport;