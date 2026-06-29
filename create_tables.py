import psycopg2

def setup_database():
    try:
        # Connect to the database
        conn = psycopg2.connect(
            dbname="postgres",
            user="postgres",
            password="Monty@1117",
            host="8.231.89.59",
            port="5432"
        )
        
        # Open a cursor to perform database operations
        cur = conn.cursor()
        
        print("\n⏳ Building the legal documents table...")

        # SQL command to create the table
        # 768 is the standard dimension size for Gemini AI text embeddings
        create_table_query = """
        CREATE TABLE IF NOT EXISTS legal_documents (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            metadata JSONB,
            embedding vector(768),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        """
        
        cur.execute(create_table_query)
        
        # Commit the changes to the database
        conn.commit()
        
        print("✅ Table 'legal_documents' created successfully!")
        
        # Close communication with the database
        cur.close()
        conn.close()

    except Exception as e:
        print(f"\n❌ Failed to create table: {e}\n")

if __name__ == "__main__":
    setup_database()
