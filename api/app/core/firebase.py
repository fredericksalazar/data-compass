import os
import sys

try:
    import firebase_admin
    from firebase_admin import credentials
    from .config import settings

    firebase_path = os.path.join(os.path.dirname(__file__), "..", "..", settings.firebase_credentials_path)

    if os.path.exists(firebase_path):
        cred = credentials.Certificate(firebase_path)
        firebase_admin.initialize_app(cred)
        from firebase_admin import firestore
        db = firestore.client()
    else:
        print(f"Warning: Firebase credentials not found at {firebase_path}", file=sys.stderr)
        db = None
except Exception as e:
    print(f"Warning: Firebase initialization skipped: {e}", file=sys.stderr)
    db = None