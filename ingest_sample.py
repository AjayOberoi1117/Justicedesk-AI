import os
import psycopg2
import google.generativeai as genai
from dotenv import load_dotenv

# Load the hidden passwords from the .env file (for your API Key)
load_dotenv()

# Configure the Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def ingest_sample_law():
    # 1. The Legal Data
    sample_title = "Constitution of India - Article 1"
    sample_content = "India, that is Bharat, shall be a Union of States."
    sample_metadata = '{"act": "Constitution", "year": 1950, "article": 1}'

    try:
        print("\n⏳ Asking Gemini to generate 768-dimensional embeddings...")
        
        # 2. Get the embedding from Gemini (Forcing 768 dimensions!)
        result = genai.embed_content(
            model="models/gemini-embedding-001",
            content=sample_content,
            task_type="retrieval_document",
            title=sample_title,
            output_dimensionality=768
        )
        embedding = result['embedding']
        
        print("✅ Embeddings received successfully!")
        print("⏳ Saving document and vectors to the Adalat database...")

        # 3. Connect to Google Cloud SQL (With SSL Required)
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password="Monty@1117",
            host="8.231.89.59",
            port="5432",
            sslmode="require"
        )
        cur = conn.cursor()

        # 4. Insert the data into your legal_documents table
        insert_query = """
        INSERT INTO legal_documents (title, content, metadata, embedding)
        VALUES (%s, %s, %s, %s);
        """
        
        cur.execute(insert_query, (sample_title, sample_content, sample_metadata, embedding))
        conn.commit()

        print("✅ SUCCESS: First legal document fully ingested into Adalat!\n")

        cur.close()
        conn.close()

    except Exception as e:
        print(f"\n❌ Pipeline failed: {e}\n")

if __name__ == "__main__":
    ingest_sample_law()
