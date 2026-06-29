import os
import pg8000
from google import genai

DB_USER = "postgres"
DB_PASS = os.environ.get("DB_PASSWORD", "YOUR_DB_PASSWORD")
DB_NAME = "adalat_db"
DB_HOST = "127.0.0.1"

client = genai.Client(api_key="AIzaSyAmN8UExdv49aYKrl_6IDR1mBgCb1tTmEA")
TARGET_FILE = "./library/SC_1703207_Satyawati_Sharma_Dead_By_Lrs_vs_Union_Of.txt"

def chunk_text(text, chunk_size=1000, overlap=200):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

def main():
    print(f"📖 Opening {TARGET_FILE}...")
    try:
        with open(TARGET_FILE, "r", encoding="utf-8") as f:
            document_text = f.read()
    except FileNotFoundError:
        print("❌ Error: Could not find the file.")
        return

    chunks = chunk_text(document_text)
    print("⏳ Connecting to PostgreSQL Database...")
    
    try:
        conn = pg8000.connect(user=DB_USER, password=DB_PASS, database=DB_NAME, host=DB_HOST)
        conn.autocommit = True
        cursor = conn.cursor()
        cursor.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        cursor.execute("CREATE TABLE IF NOT EXISTS legal_documents (id SERIAL PRIMARY KEY, content TEXT NOT NULL, embedding vector(768));")
        conn.autocommit = False
    except Exception as e:
        print(f"❌ Failed to setup database: {e}")
        return

    print("⏳ Generating mathematical vectors and saving to database...")
    success_count = 0
    
    for i, chunk in enumerate(chunks):
        try:
            response = client.models.embed_content(model="gemini-embedding-2", contents=chunk)
            embedding_vector = response.embeddings[0].values
            cursor.execute("INSERT INTO legal_documents (content, embedding) VALUES (%s, %s)", (chunk, str(embedding_vector)))
            success_count += 1
            print(f"🔹 Processed chunk {i+1}/{len(chunks)}")
        except Exception as e:
            print(f"⚠️ Failed to process chunk {i+1}: {e}")

    conn.commit()
    cursor.close()
    conn.close()
    
    if success_count > 0:
        print(f"\n✅ SUCCESS: Ingested {success_count} chunks into Adalat AI!")
    else:
        print("\n❌ Ingestion failed.")

if __name__ == "__main__":
    main()
