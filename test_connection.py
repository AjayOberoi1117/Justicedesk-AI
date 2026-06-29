import psycopg2

try:
    # Attempt to connect to Google Cloud SQL
    conn = psycopg2.connect(
        dbname="postgres",
        user="postgres",
        password="Monty@1117",
        host="8.231.89.59",
        port="5432"
    )
    
    print("\n✅ Successfully connected to the Adalat Cloud Database!")
    
    # Verify that pgvector is installed and ready
    cur = conn.cursor()
    cur.execute("SELECT extname FROM pg_extension WHERE extname = 'vector';")
    result = cur.fetchone()
    
    if result:
        print("✅ pgvector extension is fully active and ready for AI embeddings!\n")
    else:
        print("❌ Connected, but pgvector is missing.\n")
        
    cur.close()
    conn.close()

except Exception as e:
    print(f"\n❌ Connection failed: {e}\n")
