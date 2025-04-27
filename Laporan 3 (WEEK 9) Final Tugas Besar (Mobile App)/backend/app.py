from flask import Flask, request, make_response
from dotenv import load_dotenv
import json
import os
from gemini_chat import process_special_query, ask_gemini

# Load API Key dari .env
load_dotenv()

app = Flask(__name__)

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    message = data.get("message", "")
    user_id = data.get("userId", "").strip()

    if not user_id:
        print("⚠️ User ID kosong, tolak request.")
        return make_response(json.dumps({"reply": "⚠️ Anda belum login. Silakan login untuk menggunakan fitur ini."}), 400)

    print("📩 Message:", message)
    print("👤 User ID:", user_id)

    reply = process_special_query(message, user_id)

    if not reply:
        reply = ask_gemini(message)

    response = make_response(json.dumps({"reply": reply}, ensure_ascii=False))
    response.headers["Content-Type"] = "application/json"
    return response

if __name__ == "__main__":
    print("🚀 Librify Assistant berjalan di http://localhost:5000")
    app.run(debug=True)
