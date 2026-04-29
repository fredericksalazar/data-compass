import os
import sys
import json
import logging

logger = logging.getLogger(__name__)

try:
    import firebase_admin
    from firebase_admin import credentials
    from .config import settings

    # 1. Check for credentials in environment variable (base64 encoded JSON)
    firebase_creds_b64 = os.environ.get("FIREBASE_CREDS_BASE64")
    if firebase_creds_b64:
        logger.debug("FIREBASE_CREDS_BASE64 environment variable found")
        try:
            import base64
            decoded = base64.b64decode(firebase_creds_b64)
            creds_dict = json.loads(decoded)
            logger.debug("Successfully decoded Firebase credentials from base64")
            cred = credentials.Certificate(creds_dict)
            firebase_admin.initialize_app(cred)
            from firebase_admin import firestore
            db = firestore.client()
            logger.info("✅ Firebase initialized from environment variable (FIREBASE_CREDS_BASE64)")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase from FIREBASE_CREDS_BASE64: {type(e).__name__}: {e}", exc_info=True)
            db = None

    # 2. Check if running on GCP with default credentials
    elif os.environ.get("GOOGLE_CLOUD_PROJECT"):
        logger.debug(f"GOOGLE_CLOUD_PROJECT={os.environ.get('GOOGLE_CLOUD_PROJECT')} found, using default GCP credentials")
        try:
            firebase_admin.initialize_app()
            from firebase_admin import firestore
            db = firestore.client()
            logger.info("✅ Firebase initialized with default GCP credentials")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase with default GCP credentials: {type(e).__name__}: {e}", exc_info=True)
            db = None

    # 3. Try local file as fallback
    else:
        firebase_path = os.path.join(os.path.dirname(__file__), "..", "..", settings.firebase_credentials_path)
        logger.debug(f"Checking for local Firebase credentials at: {firebase_path}")
        if os.path.exists(firebase_path):
            logger.debug("Local Firebase credentials file found, attempting initialization")
            try:
                cred = credentials.Certificate(firebase_path)
                firebase_admin.initialize_app(cred)
                from firebase_admin import firestore
                db = firestore.client()
                logger.info("✅ Firebase initialized from local file")
            except Exception as e:
                logger.error(f"Failed to initialize Firebase from local file: {type(e).__name__}: {e}", exc_info=True)
                db = None
        else:
            logger.warning(f"Firebase credentials not found at {firebase_path}")
            logger.warning("Firebase will be unavailable. Data will NOT be saved to Firestore.")
            db = None

except Exception as e:
    logger.error(f"Fatal error during Firebase initialization: {type(e).__name__}: {e}", exc_info=True)
    db = None