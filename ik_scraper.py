#!/usr/bin/env python3
"""
Justice Desk — Indian Kanoon Scraper + Embedder
Scrapes Supreme Court + all Indian High Court judgments from indiankanoon.org,
generates Gemini embeddings, and inserts directly into PostgreSQL.
Run with --resume to pick up from where a previous run left off.
"""

import argparse
import asyncio
import os
import sys
import time
import json
import psycopg2
import requests
import google.auth
import google.auth.transport.requests
from google.oauth2 import service_account
from google import genai as google_genai
from dotenv import load_dotenv
from playwright.async_api import async_playwright

# ── Config ────────────────────────────────────────────────────────────────────
load_dotenv(dotenv_path=os.path.expanduser("~/Adalat/ai_backend/.env"))

GEMINI_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_KEY:
    print("❌ GEMINI_API_KEY not found in .env"); sys.exit(1)

DB_CONFIG = {
    "dbname": "postgres", "user": "postgres",
    "password": "Monty@1117", "host": "8.231.89.59",
    "port": "5432", "sslmode": "require"
}

# ── Search strategy: 200+ queries × 10 pages × ~8 docs = ~16,000+ unique ──────
# Year sweeps cover bulk volume; topic searches cover depth.
# Combined with dedup, target is 52,000+ Supreme Court judgments.

# Year-based sweeps — full SC history from 1950 through current year
YEAR_QUERIES = [f"fromdate:01-01-{y} todate:31-12-{y}" for y in range(1950, 2027)]

# IPC sections (criminal law — most litigated)
IPC_QUERIES = [
    "section 302 IPC murder", "section 307 IPC attempt to murder",
    "section 304 IPC culpable homicide", "section 304A IPC negligent death",
    "section 304B IPC dowry death", "section 306 IPC abetment suicide",
    "section 376 IPC rape", "section 354 IPC outrage modesty",
    "section 363 IPC kidnapping", "section 364A IPC kidnapping ransom",
    "section 395 IPC dacoity", "section 392 IPC robbery",
    "section 420 IPC cheating", "section 406 IPC criminal breach of trust",
    "section 409 IPC breach of trust public servant",
    "section 415 IPC cheating", "section 467 IPC forgery",
    "section 468 IPC forgery fraud", "section 471 IPC forged document",
    "section 498A IPC cruelty wife", "section 494 IPC bigamy",
    "section 120B IPC criminal conspiracy", "section 34 IPC common intention",
    "section 149 IPC unlawful assembly", "section 147 IPC rioting",
    "section 186 IPC obstruct public servant", "section 353 IPC assault",
    "section 332 IPC hurt public servant", "section 325 IPC grievous hurt",
    "section 323 IPC voluntarily hurt", "section 279 IPC rash driving",
    "section 338 IPC grievous hurt negligence",
]

# CrPC sections
CRPC_QUERIES = [
    "section 438 CrPC anticipatory bail", "section 439 CrPC bail",
    "section 482 CrPC inherent power high court quash FIR",
    "section 173 CrPC charge sheet", "section 167 CrPC remand",
    "section 161 CrPC statement witness", "section 313 CrPC accused statement",
    "section 227 CrPC discharge", "section 319 CrPC additional accused",
    "section 311 CrPC recall witness", "section 321 CrPC withdrawal prosecution",
    "section 125 CrPC maintenance", "section 145 CrPC property dispute",
    "section 156 CrPC police investigation", "section 154 CrPC FIR",
    "section 197 CrPC sanction prosecution public servant",
    "section 389 CrPC suspension sentence appeal",
    "section 397 CrPC revision", "section 401 CrPC revision high court",
]

# Constitutional law
CONST_QUERIES = [
    "article 14 equality before law", "article 16 equality opportunity",
    "article 19 freedom speech", "article 21 right to life liberty",
    "article 22 preventive detention", "article 32 constitutional remedies",
    "article 136 special leave petition", "article 142 complete justice",
    "article 226 writ jurisdiction high court",
    "habeas corpus detention illegal", "mandamus writ",
    "certiorari judicial review", "prohibition writ",
    "fundamental rights violation", "directive principles",
    "article 25 freedom religion", "article 300A right to property",
    "article 311 civil services dismissal", "article 12 state definition",
    "article 13 laws inconsistent fundamental rights",
]

# Civil laws
CIVIL_QUERIES = [
    "adverse possession limitation", "specific performance contract",
    "partition suit coparcenary", "injunction interlocutory",
    "decree execution attachment", "res judicata cause of action",
    "order 39 rule 1 2 CPC temporary injunction",
    "order 7 rule 11 CPC rejection plaint",
    "section 9 CPC civil court jurisdiction",
    "section 34 CPC interest decree",
    "section 96 CPC first appeal", "section 100 CPC second appeal",
    "section 151 CPC inherent powers", "section 47 CPC execution decree",
    "Hindu Succession Act inheritance", "Transfer of Property Act sale deed",
    "contract breach damages", "tort negligence",
    "land acquisition compensation enhanced",
    "benami transaction property",
]

# Special laws
SPECIAL_QUERIES = [
    "section 138 Negotiable Instruments Act cheque bounce",
    "Prevention of Corruption Act section 7 13",
    "POCSO Act child sexual abuse", "Domestic Violence Act section 12",
    "Motor Vehicles Act compensation", "Consumer Protection Act complaint",
    "Arbitration Conciliation Act award", "Insolvency Bankruptcy Code IBC",
    "NDPS Act section 15 20 37", "UAPA unlawful activities",
    "Arms Act possession", "Excise Act liquor",
    "Income Tax Act section 148 reassessment",
    "Income Tax Act section 263 revision",
    "Customs Act smuggling", "GST IGST assessment",
    "Companies Act winding up", "SEBI securities fraud",
    "Environment Protection Act pollution",
    "Right to Information Act RTI",
    "Scheduled Castes Tribes Atrocities Act",
    "PMLA Prevention Money Laundering",
    "Electricity Act tariff", "Telecom regulatory",
    "Rent Control Act eviction", "Hindu Marriage Act divorce",
    "Muslim Personal Law talaq", "Guardians Wards Act custody",
    "Juvenile Justice Act", "Maintenance Welfare Parents Act",
    "Workmen Compensation Act", "Industrial Disputes Act retrenchment",
    "EPF Employees Provident Fund", "Gratuity Act",
    "Service law promotion seniority", "Disciplinary proceedings misconduct",
    "Land Revenue Act mutation", "Urban Land Ceiling Act",
    "Forest Rights Act tribal", "Mines Minerals Act",
    "Copyright Act infringement", "Trademark Act passing off",
    "Patent Act", "Information Technology Act cyber crime",
    "Banking Recovery Debts Due DRT DRAT",
    "Sarfaesi Act securitisation",
]

# Procedural and evidence
EVIDENCE_QUERIES = [
    "Indian Evidence Act section 65B electronic record",
    "section 27 Evidence Act discovery",
    "section 3 Evidence Act proved",
    "circumstantial evidence chain",
    "dying declaration section 32 Evidence Act",
    "expert witness medical opinion",
    "last seen together accused",
    "identification parade test",
    "confessional statement admissibility",
    "FIR veracity evidentiary value",
]

# Landmark judgments
LANDMARK_QUERIES = [
    "landmark judgment constitutional law",
    "landmark judgment criminal law",
    "landmark judgment property rights",
    "landmark judgment fundamental rights",
    "landmark judgment service law",
    "landmark judgment family law",
    "landmark judgment environmental law",
    "precedent overruled three judge bench",
    "constitution bench five judges",
    "seven judge bench larger bench",
    "judgment law declared supreme court",
]

# Additional Supreme Court topic queries
SC_EXTRA_QUERIES = [
    # PIL & public law
    "Public Interest Litigation PIL environment Supreme Court",
    "Public Interest Litigation PIL fundamental rights Supreme Court",
    "Public Interest Litigation PIL governance accountability",
    # Constitution bench specific areas
    "reservation OBC creamy layer Supreme Court",
    "reservation SC ST promotion roster Supreme Court",
    "EWS economically weaker section reservation",
    "electoral bond election funding Supreme Court",
    "demonetisation currency Supreme Court",
    "right to privacy data protection Supreme Court",
    "marital rape exception Supreme Court",
    "same sex marriage LGBTQ rights Supreme Court",
    "sedition section 124A IPC Supreme Court",
    "capital punishment death penalty commutation",
    "preventive detention NSA COFEPOSA Supreme Court",
    "judicial appointments collegium Supreme Court",
    "federalism state centre dispute Supreme Court",
    "cooperative federalism GST Supreme Court",
    "legislative privilege parliamentary contempt",
    "anti defection Tenth Schedule speaker",
    "governor discretion assembly dissolution",
    "emergency proclamation article 356",
    # Service & administrative law
    "Central Administrative Tribunal CAT service matter",
    "departmental inquiry natural justice",
    "voluntary retirement VRS pension gratuity",
    "reservation roster backlog vacancies",
    # Family & personal law SC
    "Hindu Marriage Act irretrievable breakdown",
    "Muslim divorce talaq-e-biddat Supreme Court",
    "adoption guardianship inter-country",
    "succession intestate property Supreme Court",
    # Commercial SC
    "insolvency resolution NCLT NCLAT Supreme Court",
    "arbitration international commercial award enforcement",
    "competition law CCI abuse dominant position",
    "intellectual property patent trademark Supreme Court",
    # Criminal SC expanded
    "anticipatory bail conditions Supreme Court",
    "default bail statutory bail NDPS",
    "sentencing policy mitigating circumstances",
    "remission sentence article 72 161",
    "extradition fugitive offender",
    "witness protection programme",
    "victim compensation NALSA",
    "undertrials bail period incarceration",
]

# High Court topic queries — all 25 Indian High Courts
HC_QUERIES = [
    # Major High Courts — criminal + civil split
    "Delhi High Court criminal", "Delhi High Court civil",
    "Bombay High Court criminal", "Bombay High Court civil",
    "Calcutta High Court criminal", "Calcutta High Court civil",
    "Madras High Court criminal", "Madras High Court civil",
    "Allahabad High Court criminal", "Allahabad High Court civil",
    "Punjab Haryana High Court criminal", "Punjab Haryana High Court civil",
    "Karnataka High Court criminal", "Karnataka High Court civil",
    "Kerala High Court criminal", "Kerala High Court civil",
    "Gujarat High Court criminal", "Gujarat High Court civil",
    "Rajasthan High Court criminal", "Rajasthan High Court civil",
    "Madhya Pradesh High Court criminal", "Madhya Pradesh High Court civil",
    "Andhra Pradesh High Court criminal", "Andhra Pradesh High Court civil",
    "Telangana High Court criminal", "Telangana High Court civil",
    # Remaining High Courts (single query each — lower volume)
    "Orissa High Court", "Jharkhand High Court",
    "Uttarakhand High Court", "Himachal Pradesh High Court",
    "Gauhati High Court", "Patna High Court",
    "Chhattisgarh High Court", "Jammu Kashmir High Court",
    "Manipur High Court", "Meghalaya High Court",
    "Tripura High Court", "Sikkim High Court",
]

# High Court year sweeps — major HCs, 2000-2026
# This captures the bulk volume of recent HC judgments on IK.
_MAJOR_HCS = [
    "Delhi High Court", "Bombay High Court", "Calcutta High Court",
    "Madras High Court", "Allahabad High Court", "Punjab Haryana High Court",
    "Karnataka High Court", "Kerala High Court", "Gujarat High Court",
    "Rajasthan High Court", "Madhya Pradesh High Court",
    "Andhra Pradesh High Court", "Telangana High Court",
    "Patna High Court", "Orissa High Court", "Gauhati High Court",
]

# Smaller/newer HCs — indexed on IK from ~2010 onwards
_SMALLER_HCS = [
    "Jharkhand High Court", "Uttarakhand High Court",
    "Himachal Pradesh High Court", "Chhattisgarh High Court",
    "Jammu Kashmir High Court", "Manipur High Court",
    "Meghalaya High Court", "Tripura High Court", "Sikkim High Court",
]

HC_YEAR_QUERIES = (
    # Major HCs: 2000-2026 (extended back from 2005)
    [f"{hc} {year}" for hc in _MAJOR_HCS for year in range(2000, 2027)] +
    # Smaller HCs: 2010-2026
    [f"{hc} {year}" for hc in _SMALLER_HCS for year in range(2010, 2027)]
)

# Additional HC topic queries — major courts, high-volume areas
HC_TOPIC_QUERIES = [
    # Bail — highest volume HC matter
    "Delhi High Court bail application criminal",
    "Bombay High Court bail application criminal",
    "Allahabad High Court bail application criminal",
    "Calcutta High Court bail application criminal",
    "Madras High Court bail application criminal",
    "Punjab Haryana High Court bail application criminal",
    "Karnataka High Court bail application criminal",
    "Kerala High Court bail application criminal",
    "Gujarat High Court bail application criminal",
    "Rajasthan High Court bail application criminal",
    "Madhya Pradesh High Court bail application criminal",
    # Quashing FIR
    "Delhi High Court quash FIR section 482 CrPC",
    "Bombay High Court quash FIR section 482 CrPC",
    "Allahabad High Court quash FIR section 482 CrPC",
    "Madras High Court quash FIR section 482 CrPC",
    "Punjab Haryana High Court quash FIR section 482",
    "Karnataka High Court quash FIR section 482 CrPC",
    # Property & civil
    "Delhi High Court property dispute possession",
    "Bombay High Court property dispute possession",
    "Allahabad High Court property dispute possession",
    "Calcutta High Court property dispute possession",
    "Madras High Court property dispute possession",
    # Service law
    "Delhi High Court service law government employee",
    "Bombay High Court service law government employee",
    "Allahabad High Court service law government employee",
    "Madras High Court service law government employee",
    # Family law
    "Delhi High Court divorce matrimonial maintenance",
    "Bombay High Court divorce matrimonial maintenance",
    "Allahabad High Court divorce matrimonial maintenance",
    "Madras High Court divorce matrimonial maintenance",
    "Punjab Haryana High Court divorce matrimonial",
    # Consumer & commercial
    "Delhi High Court commercial dispute arbitration",
    "Bombay High Court commercial dispute arbitration",
    # Writ jurisdiction
    "Delhi High Court writ petition fundamental rights",
    "Bombay High Court writ petition fundamental rights",
    "Allahabad High Court writ petition fundamental rights",
    "Calcutta High Court writ petition fundamental rights",
    "Madras High Court writ petition fundamental rights",
    # Smaller HCs topic
    "Jharkhand High Court bail criminal",
    "Uttarakhand High Court bail criminal",
    "Himachal Pradesh High Court bail criminal",
    "Chhattisgarh High Court bail criminal",
    "Jammu Kashmir High Court bail criminal",
    "Patna High Court bail application criminal",
    "Gauhati High Court bail application criminal",
    "Orissa High Court bail application criminal",
]

SEARCH_QUERIES = (YEAR_QUERIES + IPC_QUERIES + CRPC_QUERIES + CONST_QUERIES +
                  CIVIL_QUERIES + SPECIAL_QUERIES + EVIDENCE_QUERIES +
                  LANDMARK_QUERIES + SC_EXTRA_QUERIES +
                  HC_QUERIES + HC_YEAR_QUERIES + HC_TOPIC_QUERIES)

# ── Pages per query by type ───────────────────────────────────────────────────
# Recent SC years are prolific — page deep. Older years need fewer pages.
# Topic/section queries: 10 pages each.
# Combined target: 52,000+ unique judgments.
PROGRESS_FILE = os.path.expanduser("~/Adalat/ai_backend/ik_scraper_progress.json")

def load_progress():
    if os.path.exists(PROGRESS_FILE):
        with open(PROGRESS_FILE) as f:
            return set(json.load(f))
    return set()

def save_progress(done_indices: set):
    with open(PROGRESS_FILE, "w") as f:
        json.dump(sorted(done_indices), f)

def pages_for_query(query):
    if "fromdate:" in query:
        try:
            # format is "fromdate:DD-MM-YYYY todate:..." — year is at position 17
            year = int(query[17:21])
            if year >= 2015: return 150  # SC very active post-2015
            if year >= 2005: return 80
            if year >= 1995: return 30
            if year >= 1980: return 15
            return 5                     # pre-1980 SC output was low
        except:
            return 10
    # HC year sweeps: "Delhi High Court 2024" etc.
    if "High Court" in query:
        parts = query.rsplit(" ", 1)
        if len(parts) == 2 and parts[1].isdigit():
            year = int(parts[1])
            if year >= 2015: return 50
            if year >= 2010: return 30
            if year >= 2005: return 15
            return 8    # 2000-2004 HC — lighter indexed
        return 30   # HC topic queries — more pages than before
    return 12       # SC topic queries
DELAY_BETWEEN_DOCS = 1.0 # seconds — Tier 1 paid; polite but fast
GEMINI_RATE_LIMIT = 999999  # Tier 1 Postpay — 2000 RPM, no pauses needed

# ── Database ──────────────────────────────────────────────────────────────────
def get_existing_ids(conn):
    """Return set of doc IDs (from content prefix) already in DB — lightweight dupe check."""
    cur = conn.cursor()
    # Store IK doc IDs in case_category field for dedup
    cur.execute("SELECT case_category FROM legal_documents WHERE case_category LIKE 'ik:%'")
    ids = {row[0] for row in cur.fetchall()}
    cur.close()
    return ids

def ensure_connected(conn):
    """Return conn if healthy, or a fresh connection."""
    try:
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.close()
        return conn
    except Exception:
        try:
            conn.close()
        except Exception:
            pass
        print("  🔄 DB connection lost — reconnecting...")
        new_conn = psycopg2.connect(**DB_CONFIG)
        print("  ✅ Reconnected to PostgreSQL")
        return new_conn

def insert_document(conn, content, source_url, ik_doc_id, court_level, embedding):
    cur = conn.cursor()
    cur.execute(
        """INSERT INTO legal_documents
           (content, embedding, case_category, court_level, precedent_strength)
           VALUES (%s, %s, %s, %s, %s)""",
        (content, embedding, f"ik:{ik_doc_id}", court_level, "binding")
    )
    conn.commit()
    cur.close()

# ── Gemini embedding ──────────────────────────────────────────────────────────
def generate_embedding(client, content):
    result = client.models.embed_content(
        model="models/gemini-embedding-2",
        contents=content[:8000],
        config={"output_dimensionality": 3072}
    )
    return list(result.embeddings[0].values)

_ALL_HC_NAMES = [
    "High Court", "Delhi HC", "Bombay HC", "Calcutta HC", "Madras HC",
    "Allahabad HC", "Punjab", "Karnataka HC", "Kerala HC", "Gujarat HC",
    "Rajasthan HC", "MP HC", "Andhra", "Telangana", "Patna", "Orissa",
    "Gauhati", "Jharkhand", "Uttarakhand", "Himachal", "Chhattisgarh",
    "Jammu", "Manipur", "Meghalaya", "Tripura", "Sikkim",
]

def _is_hc_query(query: str) -> bool:
    return any(hc in query for hc in _ALL_HC_NAMES)

# ── Scraper ───────────────────────────────────────────────────────────────────
async def scrape_and_ingest(resume: bool = False):
    print("="*60)
    print("  JUSTICE DESK — Indian Kanoon Bulk Scraper")
    if resume:
        print("  MODE: RESUME (skipping completed query indices)")
    print("="*60)

    # Connect
    print("\n⏳ Connecting to database...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print("✅ Connected to PostgreSQL")
    except Exception as e:
        print(f"❌ DB connection failed: {e}"); return

    existing_ids = get_existing_ids(conn)
    print(f"📋 Already indexed from IK: {len(existing_ids)} documents\n")

    done_indices = load_progress() if resume else set()
    if resume:
        print(f"📂 Resuming — {len(done_indices)} query indices already completed\n")

    gemini_client = google_genai.Client(api_key=GEMINI_KEY)
    gemini_calls = 0
    total_inserted = 0
    total_skipped = 0
    total_failed = 0

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.set_extra_http_headers({
            "User-Agent": "Mozilla/5.0 (compatible; JusticeDeskBot/1.0; +https://justice-desk.in)"
        })

        for query_idx, query in enumerate(SEARCH_QUERIES):
            if query_idx in done_indices:
                print(f"⏭  [{query_idx+1}/{len(SEARCH_QUERIES)}] Already done — skip: {query[:60]}")
                continue

            print(f"\n{'─'*50}")
            print(f"🔍 [{query_idx+1}/{len(SEARCH_QUERIES)}] Topic: {query}")
            print(f"{'─'*50}")

            doc_links = []
            n_pages = pages_for_query(query)
            for page_num in range(n_pages):
                # HC queries search all courts; SC year/topic queries focus on SC
                if _is_hc_query(query):
                    doctype_filter = ""
                else:
                    doctype_filter = "+doctypes:supremecourt"
                search_url = (
                    f"https://indiankanoon.org/search/"
                    f"?formInput={query.replace(' ', '+')}{doctype_filter}"
                    f"&pagenum={page_num}"
                )
                try:
                    await page.goto(search_url, wait_until="domcontentloaded", timeout=30000)
                    links = await page.eval_on_selector_all(
                        "a[href*='/doc/']",
                        "els => els.map(e => e.href)"
                    )
                    new_links = [l for l in set(links) if "/doc/" in l and l not in doc_links]
                    doc_links.extend(new_links)
                    print(f"  Page {page_num}/{n_pages}: found {len(new_links)} judgment links")
                    await asyncio.sleep(1.5)
                except Exception as e:
                    print(f"  ⚠️ Search page failed: {e}")

            print(f"  Total: {len(doc_links)} judgment URLs to process")

            for i, doc_url in enumerate(doc_links, 1):
                # Extract IK doc ID for dedup
                ik_doc_id = doc_url.split("/doc/")[1].split("/")[0] if "/doc/" in doc_url else doc_url
                ik_key = f"ik:{ik_doc_id}"
                if ik_key in existing_ids:
                    print(f"  [{i}/{len(doc_links)}] ⏭  Already indexed — skip")
                    total_skipped += 1
                    continue

                try:
                    await page.goto(doc_url, wait_until="domcontentloaded", timeout=30000)

                    # Extract title for display only
                    try:
                        title = (await page.title()).replace(" - Indian Kanoon", "").strip()
                    except:
                        title = doc_url

                    # Extract judgment text
                    try:
                        texts = await page.locator(".judgments").all_inner_texts()
                        content = "\n".join(texts).strip()
                    except:
                        content = ""

                    if not content or len(content) < 200:
                        print(f"  [{i}/{len(doc_links)}] ⚠️  Too short, skipping")
                        total_failed += 1
                        continue

                    # Rate limit check
                    if gemini_calls > 0 and gemini_calls % GEMINI_RATE_LIMIT == 0:
                        print("  ⏸  Gemini rate limit pause (60s)...")
                        await asyncio.sleep(62)

                    # Generate embedding
                    embedding = generate_embedding(gemini_client, content)
                    gemini_calls += 1

                    # Determine court level from URL
                    court = "high_court" if "highcourt" in doc_url.lower() else "supreme_court"
                    # Insert with actual schema (reconnect if connection dropped)
                    conn = ensure_connected(conn)
                    insert_document(conn, content, doc_url, ik_doc_id, court, embedding)
                    existing_ids.add(ik_key)
                    total_inserted += 1

                    short_title = title[:55] + "..." if len(title) > 55 else title
                    print(f"  [{i}/{len(doc_links)}] ✅ {short_title}")

                except Exception as e:
                    total_failed += 1
                    print(f"  [{i}/{len(doc_links)}] ❌ Failed: {e}")
                    try:
                        conn.rollback()
                    except Exception:
                        # Connection may be dead — reconnect for next iteration
                        try:
                            conn = psycopg2.connect(**DB_CONFIG)
                        except Exception:
                            pass

                await asyncio.sleep(DELAY_BETWEEN_DOCS)

            # Mark this query index as done and save progress
            done_indices.add(query_idx)
            save_progress(done_indices)

        await browser.close()

    conn.close()

    print(f"\n{'='*60}")
    print(f"  RUN COMPLETE")
    print(f"  ✅ Inserted: {total_inserted}")
    print(f"  ⏭  Skipped:  {total_skipped} (already in DB)")
    print(f"  ❌ Failed:   {total_failed}")
    print(f"{'='*60}")

    # Final count
    conn2 = psycopg2.connect(**DB_CONFIG)
    cur = conn2.cursor()
    cur.execute("SELECT COUNT(*) FROM legal_documents WHERE embedding IS NOT NULL")
    searchable = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM legal_documents")
    total = cur.fetchone()[0]
    print(f"\n📚 Database: {searchable:,} searchable / {total:,} total documents")
    cur.close(); conn2.close()

    # ── Sync count to Firestore so the app shows live number ──────────────────
    _sync_count_to_firestore(searchable)

def _sync_count_to_firestore(count: int):
    """Write judgment_count to config/stats in Firestore via REST + service account."""
    sa_path = os.path.expanduser("~/Adalat/app/serviceaccount.json")
    if not os.path.exists(sa_path):
        print("⚠️  serviceaccount.json not found — skipping Firestore sync")
        return
    try:
        creds = service_account.Credentials.from_service_account_file(
            sa_path,
            scopes=["https://www.googleapis.com/auth/datastore"]
        )
        auth_req = google.auth.transport.requests.Request()
        creds.refresh(auth_req)
        project = creds.project_id or "vakeel-sahib"
        url = (
            f"https://firestore.googleapis.com/v1/projects/{project}"
            f"/databases/(default)/documents/config/stats"
        )
        body = {
            "fields": {
                "judgment_count": {"integerValue": str(count)},
                "last_updated": {"timestampValue": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
            }
        }
        resp = requests.patch(
            url, json=body,
            headers={"Authorization": f"Bearer {creds.token}"},
            params={"updateMask.fieldPaths": ["judgment_count", "last_updated"]}
        )
        if resp.status_code == 200:
            print(f"✅ Firestore updated: judgment_count = {count:,}")
        else:
            print(f"⚠️  Firestore sync failed: {resp.status_code} {resp.text[:200]}")
    except Exception as e:
        print(f"⚠️  Firestore sync error: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Justice Desk — Indian Kanoon bulk scraper")
    parser.add_argument("--resume", action="store_true",
                        help="Skip query indices already completed in a previous run")
    args = parser.parse_args()
    asyncio.run(scrape_and_ingest(resume=args.resume))
