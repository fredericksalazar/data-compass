import os
import firebase_admin
from firebase_admin import credentials
from .config import settings

firebase_path = os.path.join(os.path.dirname(__file__), "..", "..", settings.firebase_credentials_path)

if os.path.exists(firebase_path):
    cred = credentials.Certificate(firebase_path)
    firebase_admin.initialize_app(cred)
else:
    firebase_admin.initialize_app(credentials.Certificate({"type": "service_account", "project_id": "dummy"}))

from firebase_admin import firestore

db = firestore.client()