def generate_csp(report):
    script_sources = set()

    for js in report["libraries"]:
        if "://" in js:
            domain = js.split("//")[1].split("/")[0]
            script_sources.add(domain)

    if report["trackers"]:
        script_sources.add("analytics-src")

    if report["malicious_scripts"]:
        script_sources.add("'none'")

    csp = "default-src 'self';\n"
    if script_sources:
        csp += "script-src 'self' " + " ".join(script_sources) + ";"

    return csp
