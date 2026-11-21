"""Merakit Code.gs, index.html, dan versi artifact dari potongan sumber."""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), "dist")
os.makedirs(OUT, exist_ok=True)
subprocess.check_call([sys.executable, "-I", os.path.join(HERE, "gen_data.py"), HERE])

def rd(n):
    return open(os.path.join(HERE, n), encoding="utf-8").read()

defaults = rd("defaults.json")
seed = rd("seed_products.json")

# ---- Code.gs
code = rd("Code.template.gs").replace("/*__DEFAULTS__*/", defaults).replace("/*__SEED__*/", seed)
open(os.path.join(OUT, "Code.gs"), "w", encoding="utf-8").write(code)

# ---- Supabase
mini = lambda t: json.dumps(json.loads(t), ensure_ascii=False, separators=(",", ":"))
edge = rd("edge.template.ts").replace("/*__DEFAULTS__*/", mini(defaults)).replace("/*__SEED__*/", mini(seed))
open(os.path.join(OUT, "edge_function.ts"), "w", encoding="utf-8").write(edge)
open(os.path.join(OUT, "schema.sql"), "w", encoding="utf-8").write(rd("schema.sql"))

# ---- Front-end
logo_sm = "data:image/webp;base64," + rd("logo_sm.b64").strip()
logo_lg = "data:image/webp;base64," + rd("logo_lg.b64").strip()
js = "\n".join(rd(n) for n in ("core.js", "store.js", "admin.js", "academy.js", "boot.js"))
js = js.replace("/*__DEFAULTS__*/", defaults).replace("/*__SEED__*/", seed)
js = js.replace("__LOGO_SM__", logo_sm).replace("__LOGO_LG__", logo_lg)
app_js = "var CONFIG = { apiUrl: \"\" };\n(function () {\n'use strict';\n" + js + "\n})();\n"
open(os.path.join(OUT, "app.js"), "w", encoding="utf-8").write(app_js)

body = (
    "<title>SegarKite</title>\n"
    "<meta name=\"claude:viewport-fit-sides\" content=\"cover\">\n"
    "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n"
    "<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n"
    "<link href=\"https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap\" rel=\"stylesheet\">\n"
    "<style>\n" + rd("style.css") + "\n</style>\n"
    + rd("shell.html") + "\n<script>\n" + app_js + "</script>\n"
)
open(os.path.join(OUT, "artifact.html"), "w", encoding="utf-8").write(body)

head = (
    "<!doctype html>\n<html lang=\"id\">\n<head>\n<meta charset=\"utf-8\">\n"
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n"
    "<link rel=\"icon\" type=\"image/webp\" href=\"" + logo_sm + "\">\n"
)
api = os.environ.get("SK_API_URL", "")
live = body.replace('var CONFIG = { apiUrl: "" };', 'var CONFIG = { apiUrl: "%s" };' % api)
open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(head + live + "</body>\n</html>\n")
print("build ok:", {f: os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)})
