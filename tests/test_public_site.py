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
    "notebook": (
        "01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b"
    ),
    "How_To_Create_A_Bitcoin_Address_From_Randomly_Generated_Numbers.ipynb": (
        "46b834d022edb425ee68b0a8196595a7cd24db4448f14aab11977615ec89eb6b"
    ),
}


def page_source(name):
    return (ROOT / name).read_text(encoding="utf-8")


def test_every_public_page_uses_shared_navigation_theme_and_language():
    for page in PUBLIC_PAGES:
        source = page_source(page)
        assert 'class="brand"' in source
        assert ">COBRA</a>" in source
        assert 'class="mark"' not in source
        assert (
            'href="/site-ui.css"' in source or 'href="site-ui.css"' in source
        )
        assert 'src="/site-ui.js"' in source or 'src="site-ui.js"' in source
        assert 'src="/surface-i18n.js"' in source
        assert 'saved === "dark" ? "dark" : "light"' in source
        for route in PRIMARY_ROUTES:
            assert f'href="{route}"' in source


def test_capability_statuses_are_explicit():
    docs = page_source("docs.html").lower()
    for status in ("available", "experimental", "research"):
        assert f">{status}<" in docs

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
        "key 01",
        "key 02",
        "proposed public fields",
        "research content is not a deployed product capability",
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


def test_docs_do_not_publish_internal_provenance_notes():
    docs = page_source("docs.html").lower()
    assert "provenance" not in docs
    assert "how_to_create_a_bitcoin_address" not in docs
    assert "root-level file" not in docs


def test_home_restores_public_research_news_poll_and_build_surfaces():
    home = page_source("index.html")
    home_script = page_source("home-live.js")
    app_script = page_source("app.js")
    assert 'src="/assets/cobra-hero.jpg"' in home
    assert "Create randomness." in home
    assert "Derive addresses." in home
    assert "Create cryptographic randomness" in home
    assert "Create Bitcoin address" in home
    assert "Cryptographic random generator" not in home
    assert "Bitcoin address generator" not in home
    assert "Generate random value" not in home
    assert "playground" not in home.lower()
    assert 'class="research-frontier"' in home
    assert 'id="newsFeatured"' in home
    assert "DOJ: Won’t pursue coders merely for writing code" in home
    assert "justice.gov/opa/speech/" in home
    assert "Ethereum maps its post-quantum cryptography transition" in home
    assert "ethereum.org/roadmap/security/quantum-resistance/" in home
    assert 'id="newsLatest"' in home
    assert 'class="news-more"' in home
    assert 'id="network-poll"' in home
    assert "What blockchain would you like next?" in home
    for network in (
        "Ethereum (EVM Ecosystem)",
        "Solana",
        "Litecoin",
        "Other / Suggest",
    ):
        assert f'"{network}"' in home_script
    assert 'class="developer-terminal"' in home
    assert "Tell us about your project" in home
    assert 'id="feature-poll"' in home
    for feature in (
        "Onchain privacy",
        "Wallet systems",
        "Cold-storage integrations",
        "COBRA cross-border payments",
        "Offline functionality",
        "Public API & SDK",
        "COBRA Mining & Intelligence",
    ):
        assert f'"{feature}"' in home_script
    assert "COBRA × AI AGENTS" in home
    assert "robots and physical-intelligence systems" in home
    assert 'id="publishToExplorer"' in home
    assert "cobra-explorer-opt-in-v1" in app_script
    assert "publishToExplorer?.checked" in app_script
    assert 'getElementById("newsFeatured")' not in home_script
    assert "the shared registry is not connected" not in home.lower()
    assert "built on the original 2023" not in home.lower()


def test_explorer_is_a_live_mainnet_surface():
    explorer = page_source("explorer.html").lower()
    script = page_source("explorer.js")
    api = page_source("api/bitcoin.js")
    assert "bitcoin mainnet" in explorer
    assert "testnet" not in explorer
    assert "roadmap" not in explorer
    assert 'id="pricechart"' in explorer
    assert 'id="txchart"' in explorer
    assert 'id="cobraaddresscount"' in explorer
    assert 'fetch("/api/bitcoin"' in script
    assert "api.blockchain.info" in api


def test_shared_registry_accepts_only_public_or_aggregate_state():
    schema = page_source("database/schema.sql").lower()
    registry_api = page_source("api/registry.js")
    app = page_source("app.js")
    assert "cobra_public_addresses" in schema
    assert "cobra_creation_events" in schema
    assert "is_public boolean" in schema
    assert "cobra_contacts" not in schema
    assert 'visibility: isPublic ? "public" : "private"' in app
    assert "if (isPublic) payload.address = address" in app
    assert "private_event_must_not_include_address" in registry_api
    assert "isMainnetP2pkhAddress" in registry_api
    for secret in ("privateHex", "privateKey", "wif", "seedPhrase", "entropy"):
        assert f"payload.{secret}" not in app


def test_both_polls_use_global_persistent_voting():
    schema = page_source("database/schema.sql")
    poll_api = page_source("api/polls.js")
    home_script = page_source("home-live.js")
    assert "cobra_poll_votes" in schema
    assert "unique (poll_id, anonymous_voter_hash)" in schema
    assert 'fetch("/api/polls"' in home_script
    assert 'poll: slug' in home_script
    assert "cobra-global-voter-id-v1" in home_script
    assert "createHash(\"sha256\")" in poll_api
    assert "on conflict (poll_id, anonymous_voter_hash) do update" in poll_api


def test_explorer_includes_persistent_and_live_intelligence():
    explorer = page_source("explorer.html")
    script = page_source("explorer.js")
    api = page_source("api/bitcoin.js")
    for element_id in (
        "high24h",
        "low24h",
        "circulatingSupply",
        "difficulty",
        "blockReward",
        "hashRateChart",
        "volumeChart",
        "latestBlocks",
        "latestTransactions",
        "cobraVoteCount",
    ):
        assert f'id="{element_id}"' in explorer
    assert 'fetch("/api/registry?limit=12"' in script
    assert "mempool.space/api" in api
    assert "estimated-transaction-volume-usd" in api
    assert "cobraPublicCount" in script


def test_database_health_endpoint_never_returns_credentials():
    health = page_source("api/health.js")
    assert 'database: "connected"' in health
    assert 'schema: "ready"' in health
    assert "connectionString" not in health
    assert "DATABASE_URL" not in health


def test_requested_footer_is_consistent():
    for page in PUBLIC_PAGES:
        source = page_source(page)
        assert "COBRA by ols-cloud" in source
        assert "Cryptographic sovereignty." in source
        assert "Your keys. Your mathematics. Your authority." in source
        assert "First roll out 2023." in source
        assert "Last Updated 2026" in source
        assert "v1.0.0.1" in source


def test_language_switcher_supports_six_languages():
    script = page_source("surface-i18n.js")
    for language in ("en", "fr", "es", "pt", "de", "zh"):
        assert f'["{language}",' in script
    assert 'visibleLabel.textContent = "Language"' in script
    assert "option.textContent = fullLabel" in script


def test_provenance_artifacts_remain_byte_for_byte_unchanged():
    for filename, expected in PROVENANCE_HASHES.items():
        digest = sha256((ROOT / filename).read_bytes()).hexdigest()
        assert digest == expected
