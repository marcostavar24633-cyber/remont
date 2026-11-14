from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import json
import re
import sys
import xml.etree.ElementTree as ET

PAGES = [
    "index.html",
    "remont-kvartir.html",
    "otdelka-vannoy.html",
    "otdelka-domov.html",
    "remont-sanuzla.html",
    "otdelochnye-raboty.html",
]
EXPECTED_PHONE = "+79631282558"

class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.links = []
        self.h1_count = 0
        self.images_without_alt = 0
        self.jsonld = []
        self._jsonld_active = False
        self._jsonld_parts = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag == "h1":
            self.h1_count += 1
        if tag == "a" and "href" in attrs:
            self.links.append(attrs["href"])
        if tag == "img" and "alt" not in attrs:
            self.images_without_alt += 1
        if tag == "script" and attrs.get("type") == "application/ld+json":
            self._jsonld_active = True
            self._jsonld_parts = []

    def handle_data(self, data):
        if self._jsonld_active:
            self._jsonld_parts.append(data)

    def handle_endtag(self, tag):
        if tag == "script" and self._jsonld_active:
            self.jsonld.append("".join(self._jsonld_parts))
            self._jsonld_active = False
            self._jsonld_parts = []

errors = []
parsed = {}
for page in PAGES:
    path = Path(page)
    if not path.exists():
        errors.append(f"Missing page: {page}")
        continue
    parser = SiteParser()
    parser.feed(path.read_text(encoding="utf-8"))
    parsed[page] = parser
    duplicates = sorted({item for item in parser.ids if parser.ids.count(item) > 1})
    if duplicates:
        errors.append(f"{page}: duplicate IDs: {', '.join(duplicates)}")
    if parser.h1_count != 1:
        errors.append(f"{page}: expected one H1, found {parser.h1_count}")
    if parser.images_without_alt:
        errors.append(f"{page}: {parser.images_without_alt} image(s) without alt")
    for item in parser.jsonld:
        try:
            json.loads(item)
        except json.JSONDecodeError as exc:
            errors.append(f"{page}: invalid JSON-LD: {exc}")
    if 'src="script.js"' not in path.read_text(encoding="utf-8"):
        errors.append(f"{page}: script.js is not included")
    for href in parser.links:
        if href.startswith("tel:"):
            if href[4:] != EXPECTED_PHONE:
                errors.append(f"{page}: unexpected phone link {href}")
            continue
        if href.startswith(("#", "http://", "https://", "mailto:", "javascript:", "data:")):
            if href.startswith("#") and href[1:] not in parser.ids:
                errors.append(f"{page}: broken anchor {href}")
            continue
        parts = urlsplit(href)
        target = (path.parent / parts.path).resolve() if parts.path else path.resolve()
        if not target.exists():
            errors.append(f"{page}: missing local link target {href}")
            continue
        if parts.fragment and target.suffix == ".html":
            target_parser = parsed.get(target.name)
            if target_parser is None:
                target_parser = SiteParser()
                target_parser.feed(target.read_text(encoding="utf-8"))
            if parts.fragment not in target_parser.ids:
                errors.append(f"{page}: broken local fragment {href}")

css = Path("styles.css").read_text(encoding="utf-8")
css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
css = re.sub(r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'', "", css)
if css.count("{") != css.count("}"):
    errors.append("styles.css: unbalanced curly braces")

js = Path("script.js")
if not js.exists() or not js.read_text(encoding="utf-8").strip():
    errors.append("script.js: missing or empty")

sitemap = ET.parse("sitemap.xml")
locs = [node.text for node in sitemap.findall(".//{*}loc")]
if len(locs) != 6:
    errors.append(f"sitemap.xml: expected 6 URLs, found {len(locs)}")

home = Path("index.html").read_text(encoding="utf-8")
groups = set(re.findall(r'data-planner-group="([^"]+)"', home))
if groups != {"object", "scope", "condition"}:
    errors.append(f"project planner: unexpected option groups {sorted(groups)}")
if 'href="#project-studio"' not in home:
    errors.append("homepage: no direct project planner link")

if errors:
    print("SITE VALIDATION FAILED")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print(f"SITE VALIDATION PASSED: {len(PAGES)} pages, links, anchors, phone, images, JSON-LD, CSS, planner and sitemap.")
