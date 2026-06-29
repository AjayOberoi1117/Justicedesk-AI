import os
import psycopg2
from google import genai
from dotenv import load_dotenv

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Authorized models
EMBED_MODEL = "models/gemini-embedding-2"
GEN_MODEL = "models/gemini-3.5-flash"

def speak(text):
    clean_text = text.replace('"', '').replace("'", "").replace('*', '').replace('#', '').replace('\n', ' ')
    os.system(f'say "{clean_text}"')

def chat_with_adalat():
    print("\n⚖️ ADALAT AI - DIMENSION PATCHED\n")
    
    try:
        conn = psycopg2.connect(
            dbname="postgres", user="postgres", password="Monty@1117",
            host="8.231.89.59", port="5432", sslmode="require",
            keepalives=1, keepalives_idle=30, keepalives_interval=10, keepalives_count=5
        )
        cur = conn.cursor()
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return

    while True:
        query = input("\n🧑‍⚖️ Ask Adalat: ")
        if query.lower() in ['exit', 'quit']: break
        
        try:
            # 1. Embed with forced 768-dimension output to match your DB
            embed_result = client.models.embed_content(
                model=EMBED_MODEL,
                contents=query,
                config={"output_dimensionality": 768}
            )
            vector = embed_result.embeddings[0].values
            vector_str = str(vector)

            # 2. Search
            cur.execute("SELECT content FROM legal_documents ORDER BY embedding <=> %s::vector LIMIT 1;", (vector_str,))
            match = cur.fetchone()

            if match:
                context = match[0]
                # 3. Generate
                response = client.models.generate_content(
                    model=GEN_MODEL,
                    contents=f"Context: {context}. Question: {query}"
                )
                print(f"\n🤖 ADALAT: {response.text}\n")
                speak(response.text)
            else:
                speak("I could not find that information in your files.")
        except Exception as e:
            print(f"\n❌ Pipeline Error: {e}")

    cur.close()
    conn.close()

if __name__ == "__main__":
    chat_with_adalat()
