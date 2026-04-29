import os
import sys
import json

try:
    import firebase_admin
    from firebase_admin import credentials
    from .config import settings

    # 1. Check for credentials in environment variable (base64 encoded JSON)
    firebase_creds_b64 = os.environ.get("FIREBASE_CREDS_BASE64")
    if firebase_creds_b64:
        import base64
        creds_dict = json.loads(base64.b64decode(firebase_creds_b64))
        cred = credentials.Certificate(creds_dict)
        firebase_admin.initialize_app(cred)
        from firebase_admin import firestore
        db = firestore.client()
        print("Firebase initialized from environment variable")
    
    # 2. Check if running on GCP with default credentials
    elif os.environ.get("GOOGLE_CLOUD_PROJECT"):
        firebase_admin.initialize_app()
        from firebase_admin import firestore
        db = firestore.client()
        print("Firebase initialized with default GCP credentials")
    
    # 3. Try local file as fallback
    else:
        firebase_path = os.path.join(os.path.dirname(__file__), "..", "..", settings.firebase_credentials_path)
        if os.path.exists(firebase_path):
            cred = credentials.Certificate(firebase_path)
            firebase_admin.initialize_app(cred)
            from firebase_admin import firestore
            db = firestore.client()
            print("Firebase initialized from local file")
        else:
            print(f"Warning: Firebase credentials not found at {firebase_path}", file=sys.stderr)
            db = None
except Exception as e:
    print(f"Warning: Firebase initialization skipped: {e}", file=sys.stderr)
    db = None