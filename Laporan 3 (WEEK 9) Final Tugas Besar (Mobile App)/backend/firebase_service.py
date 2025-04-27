import firebase_admin
from firebase_admin import credentials, firestore
from difflib import get_close_matches
from datetime import datetime, timedelta
import locale

# Set locale untuk tanggal dalam bahasa Indonesia
try:
    locale.setlocale(locale.LC_TIME, 'id_ID.utf8')  # Linux/Mac
except locale.Error:
    try:
        locale.setlocale(locale.LC_TIME, 'ind')      # Windows fallback
    except locale.Error:
        pass  # Kalau gagal, biarkan tetap default English

# Inisialisasi Firebase sekali saja
if not firebase_admin._apps:
    cred = credentials.Certificate('firebase-adminsdk.json')
    firebase_admin.initialize_app(cred)

db = firestore.client()

# ===================== FIREBASE SERVICE =====================

def get_all_book_titles():
    books_ref = db.collection('books')
    docs = books_ref.stream()
    return [doc.to_dict().get('title', '') for doc in docs]

def find_best_matching_book(title_fragment):
    all_titles = get_all_book_titles()
    matches = get_close_matches(title_fragment.lower(), [t.lower() for t in all_titles], n=1, cutoff=0.5)
    if matches:
        for title in all_titles:
            if title.lower() == matches[0]:
                return title
    return None

def get_book_stock(title):
    books_ref = db.collection('books')
    query = books_ref.where('title', '==', title).limit(1).stream()
    for doc in query:
        data = doc.to_dict()
        return data.get('stock', 0)
    return 0

def get_user_due_dates(user_id):
    print(f"🔍 Mencari pinjaman untuk user: {user_id}")
    borrowings_ref = db.collection('borrowings')
    borrowings = borrowings_ref.where('userId', '==', user_id).where('isReturned', '==', False).stream()
    result = []

    for borrowing in borrowings:
        data = borrowing.to_dict()
        print(f"📚 Data pinjaman ditemukan: {data}")
        book_doc_id = data.get('bookId')
        due_date = data.get('returnDueDate')

        book_title = None
        if book_doc_id:
            book_ref = db.collection('books').document(book_doc_id)
            book_snapshot = book_ref.get()

            if book_snapshot.exists:
                book_data = book_snapshot.to_dict()
                book_title = book_data.get('title')

        if book_title and due_date:
            if hasattr(due_date, 'to_datetime'):
                due_date_converted = due_date.to_datetime()
            else:
                due_date_converted = due_date
            result.append((book_title, due_date_converted))
        else:
            print(f"⚠️ Warning: Data bermasalah. BookID: {book_doc_id}")

    print(f"📦 Total pinjaman aktif ditemukan: {len(result)}")
    return result

def format_tanggal_indonesia(date_obj):
    try:
        return date_obj.strftime('%-d %B %Y')  # Contoh: 3 Mei 2025
    except:
        return date_obj.strftime('%d %B %Y')    # Backup untuk Windows

def find_due_date_by_title(user_id, user_input_title):
    due_dates = get_user_due_dates(user_id)
    user_input_title = user_input_title.strip().lower()

    if not due_dates:
        return "✅ Kamu tidak memiliki buku yang sedang dipinjam."

    matched_due = None

    if user_input_title:
        for title, due_date in due_dates:
            if title and user_input_title in title.strip().lower():
                matched_due = (title, due_date)
                break

    now = datetime.now()

    if matched_due:
        book_title, due_date = matched_due
        hari_tersisa = (due_date - now).days
        reminder = ""

        if hari_tersisa <= 2:
            reminder = "\n⚠️ Segera kembalikan atau ajukan perpanjangan!"
        
        return f"Buku **{book_title}** harus dikembalikan sebelum {format_tanggal_indonesia(due_date)}.{reminder}"
    else:
        # Jika tidak ada buku yang cocok, jawab tidak ditemukan
        return f"❌ Kamu tidak meminjam buku dengan judul '{user_input_title}'."
