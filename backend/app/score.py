def compute_score(report):
    score = 100

    if report["malicious_scripts"]:
        score -= 40
    if report["mixed_content"]:
        score -= 20
    if not report["csp"]:
        score -= 20
    if report["trackers"]:
        score -= 10

    return max(score, 0)
