"""Regression checks for COBRA's public surfaces and provenance artifacts."""

from hashlib import sha256
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PUBLIC_PAGES = (
    "index.html",
    "docs.html",
    "explorer.html",
    "research.html",
    "offline.html",
    "cli.html",
    "terms.html",
)
PRIMARY_ROUTES = (
    "/",
    "/docs.html",
    "/explorer.html",
    "/research.html",
    "/offline.html",
    "/cli.html",
)
PROVENANCE_HASHES = {
    "notebook": "01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b",
    "How_To_Create_A_Bitcoin_Address_From_Randomly_Generated_Numbers.ipynb": (
        "46b834d022edb425ee68b0a8196595a7cd24db4448f14aab11977615ec89eb6b"
    ),
}


def page_source(name):
    return (ROOT / name).read_text(encoding="utf-8")


def test_every_public_page_uses_the_shared_navigation_and_theme():
    for page in PUBLIC_PAGES:
        source = page_source(page)
        assert 'class="brand"' in source
        assert ">COBRA</a>" in source
        assert 'class="mark"' not in source
        assert 'href="/site-ui.css"' in source or 'href="site-ui.css"' in source
        assert 'src="/site-ui.js"' in source or 'src="site-ui.js"' in source
        for route in PRIMARY_ROUTES:
            assert f'href="{route}"' in source


def test_capability_statuses_are_explicit():
    docs = page_source("docs.html").lower()
    for status in ("available", "experimental", "research", "roadmap"):
        assert f">{status}<" in docs

    assert ">roadmap<" in page_source("explorer.html").lower()
    assert ">research<" in page_source("research.html").lower()
    assert ">experimental" in page_source("offline.html").lower()
    assert ">experimental" in page_source("cli.html").lower()


def test_public_copy_does_not_expose_internal_agent_or_planning_language():
    combined = "\n".join(page_source(page).lower() for page in PUBLIC_PAGES)
    banned = (
        "working with ai agents",
        "agents can reason",
        "ready to be connected",
        "what we are investigating",
        "coming later",
        "privacy coming soon",
    )
    for phrase in banned:
        assert phrase not in combined


def test_home_does_not_load_retired_promotional_injections():
    script = page_source("app.js")
    for module in (
        "research-frontier.js",
        "ui-patch.js",
        "agents-home.js",
        "explorer-home.js",
        "cli-status.js",
    ):
        assert module not in script


def test_provenance_artifacts_remain_byte_for_byte_unchanged():
    for filename, expected in PROVENANCE_HASHES.items():
        digest = sha256((ROOT / filename).read_bytes()).hexdigest()
        assert digest == expected
