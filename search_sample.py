import os
import psycopg2
import google.generativeai as genai
from dotenv import load_dotenv

# Load the hidden passwords
load_dotenv()

# Configure the Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def search_adalat():
    # 1. The Question you want to ask your database
    query_text = "What does the law say about the name of our country?"
    
    try:
        print(f"\n🔍 Asking Adalat: '{query_text}'\n")
        print("⏳ Converting question to a 768-dimensional vector...")
        
        # 2. Get the embedding for the question
        result = genai.embed_content(
            model="models/gemini-embedding-001",
            content=query_text,
            task_type="retrieval_query",
            output_dimensionality=768
        )
        query_vector = result['embedding']
        
        # Format the vector so Postgres can understand it
        vector_string = '[' + ','.join(map(str, query_vector)) + ']'
        
        print("⏳ Searching the database for the closest mathematical match...")

        # 3. Connect to Google Cloud SQL
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password="Monty@1117",
            host="8.231.89.59",
            port="5432",
            sslmode="require"
        )
        cur = conn.cursor()

        # 4. Perform the Vector Similarity Search
        # The <=> operator calculates how similar the question vector is to the document vectors
        search_query = """
        SELECT title, content 
        FROM legal_documents 
        ORDER BY embedding <=> %s::vector 
        LIMIT 1;
        """
        
        cur.execute(search_query, (vector_string,))
        match = cur.fetchone()

        if match:
            print("\n✅ MATCH FOUND!")
            print("-" * 50)
            print(f"📄 SOURCE:  {match[0]}")
            print(f"⚖️ EXTRACT: {match[1]}")
            print("-" * 50 + "\n")
        else:
            print("\n❌ No matches found in the database.\n")

        cur.close()
        conn.close()

    except Exception as e:
        print(f"\n❌ Search failed: {e}\n")

if __name__ == "__main__":
    search_adalat()
