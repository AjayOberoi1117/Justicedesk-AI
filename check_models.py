import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load your hidden API key
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

print("\n🔍 Checking available embedding models...")

# Loop through all models and find the ones that support 'embedContent'
found = False
for m in genai.list_models():
    if 'embedContent' in m.supported_generation_methods:
        print(f"✅ Found Model: {m.name}")
        found = True

if not found:
    print("❌ No embedding models found for this API key.")
print("\n")
