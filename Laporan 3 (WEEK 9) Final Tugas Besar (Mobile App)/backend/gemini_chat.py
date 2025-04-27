import os
import re
import google.generativeai as genai
from firebase_service import get_book_stock, get_user_due_dates, find_best_matching_book

# Konfigurasi API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-pro-latest")

def clean_text(text):
    if not text:
        return "Maaf, saya tidak dapat menemukan jawaban saat ini."
    text = re.sub(r"\*\*(.*?)\*\*", r"\1", text)
    text = re.sub(r"_([^_]+)_", r"\1", text)
    text = re.sub(r"^\s*[*-]\s+", "• ", text, flags=re.MULTILINE)
    text = re.sub(r"\n{2,}", "\n\n", text)
    return text.strip()

# ======================== INTENT DETECTION ============================

def is_asking_stock(prompt):
    prompt = prompt.lower()
    keywords = ["stok", "stock", "tersedia", "availability", "ada stok", "buku tersedia", "stock buku"]
    return any(keyword in prompt for keyword in keywords)

def is_asking_due_date(prompt):
    prompt = prompt.lower()
    keywords = ["kapan", "sampai kapan", "pengembalian", "mengembalikan", "deadline buku", "waktu kembalikan"]
    return any(keyword in prompt for keyword in keywords)

def normalize_book_query(prompt):
    prompt = prompt.lower()
    noise_words = [
        "stok", "stock", "tersedia", "availability", "yang tersedia", "apakah",
        "buku", "ada", "semua", "?", ".", "saya", "kapan", "pengembalian",
        "mengembalikan", "harus", "waktu", "kembalikan", "mengembalikannya",
        "pengembalikannya"
    ]
    for word in noise_words:
        prompt = prompt.replace(word, "")
    return prompt.strip()

# ========================= SPECIAL QUERY ==============================

def process_special_query(prompt, user_id=None):
    prompt_lower = prompt.lower()

    if is_asking_stock(prompt):
        title_fragment = normalize_book_query(prompt)
        matched_title = find_best_matching_book(title_fragment)

        if matched_title:
            stock = get_book_stock(matched_title)
            return f"📚 Buku '{matched_title}' tersedia {stock} stok."
        else:
            return f"❌ Maaf, saya tidak menemukan buku terkait '{title_fragment}'."

    if is_asking_due_date(prompt):
        if user_id:
            due_dates = get_user_due_dates(user_id)
            if not due_dates:
                return "✅ Kamu tidak memiliki buku yang sedang dipinjam."

            title_fragment = normalize_book_query(prompt)
            matched_due = None

            if title_fragment:
                for title, due_date in due_dates:
                    if title_fragment.lower() in title.lower():
                        matched_due = (title, due_date)
                        break

            if matched_due:
                book_title, due_date = matched_due
                date_str = due_date.strftime('%d %B %Y')
                return f"🗕️ Buku '{book_title}' harus dikembalikan sebelum {date_str}."
            else:
                if len(due_dates) == 1:
                    # Kalau hanya ada satu buku dipinjam, otomatis fallback ke situ
                    book_title, due_date = due_dates[0]
                    date_str = due_date.strftime('%d %B %Y')
                    return f"🗕️ Buku '{book_title}' harus dikembalikan sebelum {date_str}."
                else:
                    return "✅ Kamu tidak memiliki pinjaman untuk buku tersebut."
        else:
            return "⚠️ Untuk mengecek pengembalian, silakan login terlebih dahulu."

# =========================== ASK GEMINI ==============================

def ask_gemini(prompt):
    try:
        response = model.generate_content(prompt)
        return clean_text(response.text)
    except Exception as e:
        return f"❌ Terjadi kesalahan: {str(e)}"
