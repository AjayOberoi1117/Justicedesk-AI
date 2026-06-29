import asyncio
import os
import re
from playwright.async_api import async_playwright

# Ensure the library directory exists so your ingest script can find them later
LIBRARY_DIR = "./library"
os.makedirs(LIBRARY_DIR, exist_ok=True)

async def extract_judgments():
    print("🚀 Starting Adalat AI IndianKanoon Extractor...")
    search_url = "https://indiankanoon.org/search/?formInput=tenant+eviction+doctypes:supremecourt"

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        print(f"🔄 Fetching search results...")
        await page.goto(search_url, wait_until="domcontentloaded", timeout=60000)
        
        # Extract document links
        links = await page.eval_on_selector_all("a", "elements => elements.map(e => e.href)")
        
        # Filter for /doc/ links, remove duplicates, and grab the first 5 for our test run
        doc_links = list(set([link for link in links if link and "/doc/" in link]))[:5]
        
        if not doc_links:
            print("⚠️ No document links found.")
            await browser.close()
            return

        print(f"🎯 Found {len(doc_links)} judgments. Starting extraction phase...")

        for i, link in enumerate(doc_links):
            print(f"📄 [{i+1}/{len(doc_links)}] Extracting text from: {link}")
            try:
                await page.goto(link, wait_until="domcontentloaded", timeout=60000)
                
                # Get the title and clean it up to use as a filename
                title = await page.title()
                safe_title = re.sub(r'[^a-zA-Z0-9_\- ]', '', title)[:40].strip().replace(' ', '_')
                doc_id = link.split('/doc/')[1].replace('/', '')
                filename = f"SC_{doc_id}_{safe_title}.txt"
                filepath = os.path.join(LIBRARY_DIR, filename)
                
                # IndianKanoon stores the actual judgment text in a div with the class "judgments"
                content_elements = await page.locator(".judgments").all_inner_texts()
                
                if content_elements:
                    full_text = "\n".join(content_elements)
                else:
                    # Fallback just in case the layout is different
                    full_text = await page.locator("body").inner_text()
                
                # Save the text file directly to your library
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(f"Source URL: {link}\nTitle: {title}\n\n{full_text}")
                    
                print(f"✅ Saved to {filepath}")
                
                # Sleep for 2 seconds between downloads to be polite and avoid IP bans
                await asyncio.sleep(2)
                
            except Exception as e:
                print(f"❌ Failed to extract {link}: {e}")

        await browser.close()
        print(f"🏁 Extraction Complete. Your files are waiting in the {LIBRARY_DIR} folder!")

if __name__ == "__main__":
    asyncio.run(extract_judgments())
