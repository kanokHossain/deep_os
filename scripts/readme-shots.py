#!/usr/bin/env python3
"""Retake the README screenshots in docs/ with realistic demo data.

Usage:  python3 scripts/readme-shots.py
Needs:  google-chrome (or CHROME env var) and ImageMagick `convert`.
Builds a single-file copy of the app, seeds localStorage with demo data,
and screenshots each view at 1440px wide, saved as 1200px JPEGs.
"""
import json, os, subprocess, sys, tempfile, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(ROOT, "docs")
CHROME = os.environ.get("CHROME", "google-chrome")
TMP = tempfile.mkdtemp(prefix="deepos-shots-")


def run(*cmd):
    subprocess.run(cmd, check=True, cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def demo_state(now):
    names = ["Product requirement preparation", "Client proposal draft", "Review pull requests",
             "Weekly status report", "Sprint planning notes"]
    log = []
    for i, (day, mins) in enumerate([(0, 25), (0, 45), (0, 15), (1, 60), (1, 30), (2, 30), (3, 90),
                                     (3, 25), (4, 40), (5, 50), (6, 20)]):
        start = now - 86400000 * day - 3600000 * (i % 3 + 1)
        log.append({"id": f"l{i}", "task": names[i % 5], "startedAt": start, "endedAt": start + mins * 60000,
                    "focusedMs": mins * 60000, "plannedMin": [25, 45, 15, 0, 25][i % 5], "parked": i % 3,
                    "outcome": "done" if i % 4 else "stopped"})
    thoughts = [("Call the bank about the card", "Client proposal draft"), ("Reply to Rafi about Friday", None),
                ("Idea: a weekly review template", "Review pull requests"), ("Book the dentist", None)]
    inbox = [{"id": f"i{i}", "text": t, "createdAt": now - (i + 1) * 900000, "fromTask": f, "status": "new"}
             for i, (t, f) in enumerate(thoughts)]
    return {"version": 1, "active": None, "draft": {"task": "", "plannedMin": 25}, "inbox": inbox, "log": log}


def main():
    run("npx", "vite", "build", "--mode", "single", "--outDir", os.path.join(TMP, "app"))
    src = open(os.path.join(TMP, "app", "index.html")).read()
    now = int(time.time() * 1000)
    idle = demo_state(now)
    running = {**idle, "active": {"id": "a", "task": "Product requirement preparation", "startedAt": now - 9 * 60000,
                                  "plannedMin": 25, "pausedAt": None, "pausedMs": 0, "parked": 1, "chimed": False}}
    # (file name, state, route, dark?, height)
    shots = [("focus", idle, "focus", False, 960), ("session-dark", running, "focus", True, 1000),
             ("brain-dump", idle, "inbox", False, 820), ("analytics-dark", idle, "analytics", True, 900)]
    for name, state, route, dark, height in shots:
        seed = '<script>localStorage.setItem("deepos.tip.popout","1");localStorage.setItem("deepos.v1",%s);location.hash="%s"</script>' % (
            json.dumps(json.dumps(state)), route)
        page = os.path.join(TMP, name + ".html")
        open(page, "w").write(src.replace("<head>", "<head>" + seed, 1))
        png = os.path.join(TMP, name + ".png")
        cmd = [CHROME, "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
               "--force-prefers-reduced-motion", f"--window-size=1440,{height}", "--virtual-time-budget=4000",
               f"--screenshot={png}"]
        if dark:
            cmd.append("--blink-settings=preferredColorScheme=0")
        run(*cmd, "file://" + page)
        run("convert", png, "-resize", "1200x", "-quality", "85", os.path.join(DOCS, name + ".jpg"))
        print("updated docs/%s.jpg" % name)


if __name__ == "__main__":
    sys.exit(main())
