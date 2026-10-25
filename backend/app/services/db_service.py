"""
Phase 11 — Persistent User, Session, Inquiry, and Listing Service.
AST-XGB Real Estate Platform (GharDhundo)

Uses SQLite standard library for backend-managed persistence,
secure server-side PBKDF2-SHA256 password hashing with constant-time verification,
and 7-day session token tracking.
"""

import sqlite3
import hashlib
import hmac
import secrets
import json
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional, Dict, Any, List

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DB_PATH = DATA_DIR / "ghardhundo.db"

# Ensure data directory exists
DATA_DIR.mkdir(parents=True, exist_ok=True)


def get_db():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Users Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT,
            role TEXT DEFAULT 'Buyer',
            notification_prefs TEXT,
            search_prefs TEXT,
            created_at TEXT NOT NULL
        )
        """)

        # 2. Sessions Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            is_active INTEGER DEFAULT 1,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """)

        # 3. Saved Properties
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS saved_properties (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            property_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            UNIQUE(user_id, property_id),
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """)

        # 4. Comparison History
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS comparison_history (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            property_ids TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """)

        # 5. Recent Searches
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS recent_searches (
            id TEXT PRIMARY KEY,
            user_id_or_session TEXT NOT NULL,
            query_json TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """)

        # 6. Inquiries Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS inquiries (
            id TEXT PRIMARY KEY,
            property_id TEXT NOT NULL,
            property_title TEXT NOT NULL,
            user_id TEXT,
            inquirer_name TEXT NOT NULL,
            inquirer_phone TEXT NOT NULL,
            inquirer_email TEXT NOT NULL,
            message TEXT,
            preferred_bhk TEXT,
            status TEXT DEFAULT 'pending',
            delivery_status TEXT DEFAULT 'unconfigured_gateway',
            ip_address TEXT,
            created_at TEXT NOT NULL
        )
        """)

        # 7. Owner Listings Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS owner_listings (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            city TEXT NOT NULL,
            locality TEXT NOT NULL,
            price INTEGER NOT NULL,
            listing_json TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
        """)

        # 8. Rate Limits Table
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS rate_limits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_or_user TEXT NOT NULL,
            action TEXT NOT NULL,
            timestamp REAL NOT NULL
        )
        """)

        conn.commit()


# Initialize database schemas
init_db()


class SecurityHelper:
    @staticmethod
    def hash_password(password: str, salt: Optional[str] = None) -> tuple[str, str]:
        if salt is None:
            salt = secrets.token_hex(16)
        pw_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        ).hex()
        return pw_hash, salt

    @staticmethod
    def verify_password(password: str, pw_hash: str, salt: str) -> bool:
        computed, _ = SecurityHelper.hash_password(password, salt)
        return hmac.compare_digest(computed, pw_hash)

    @staticmethod
    def generate_session_token() -> str:
        return secrets.token_urlsafe(32)


class UserService:
    @staticmethod
    def create_user(email: str, password: str, name: str, phone: Optional[str] = None, role: str = "Buyer") -> Dict[str, Any]:
        email_clean = email.strip().lower()
        pw_hash, salt = SecurityHelper.hash_password(password)
        user_id = f"usr_{secrets.token_hex(8)}"
        now = datetime.utcnow().isoformat()
        
        default_notification_prefs = json.dumps({
            "price_drop_alerts": True,
            "new_projects_in_city": True,
            "market_quarterly_report": False,
            "sms_updates": False
        })
        default_search_prefs = json.dumps({
            "preferred_city": "Bengaluru",
            "preferred_bhk": [2, 3],
            "max_budget": 15000000
        })

        with get_db() as conn:
            cursor = conn.cursor()
            try:
                cursor.execute("""
                INSERT INTO users (id, email, password_hash, salt, name, phone, role, notification_prefs, search_prefs, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (user_id, email_clean, pw_hash, salt, name.strip(), phone, role, default_notification_prefs, default_search_prefs, now))
                conn.commit()
            except sqlite3.IntegrityError:
                raise ValueError("An account with this email address already exists.")

        return UserService.get_user_by_id(user_id)

    @staticmethod
    def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
        email_clean = email.strip().lower()
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE email = ?", (email_clean,))
            row = cursor.fetchone()
            if not row:
                return None
            
            if not SecurityHelper.verify_password(password, row["password_hash"], row["salt"]):
                return None
            
            return UserService._row_to_dict(row)

    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return UserService._row_to_dict(row)

    @staticmethod
    def update_profile(user_id: str, name: Optional[str] = None, phone: Optional[str] = None,
                       role: Optional[str] = None, notification_prefs: Optional[dict] = None,
                       search_prefs: Optional[dict] = None) -> Dict[str, Any]:
        updates = []
        params = []
        if name is not None:
            updates.append("name = ?")
            params.append(name.strip())
        if phone is not None:
            updates.append("phone = ?")
            params.append(phone.strip())
        if role is not None:
            updates.append("role = ?")
            params.append(role.strip())
        if notification_prefs is not None:
            updates.append("notification_prefs = ?")
            params.append(json.dumps(notification_prefs))
        if search_prefs is not None:
            updates.append("search_prefs = ?")
            params.append(json.dumps(search_prefs))

        if not updates:
            return UserService.get_user_by_id(user_id)

        params.append(user_id)
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", params)
            conn.commit()

        return UserService.get_user_by_id(user_id)

    @staticmethod
    def _row_to_dict(row: sqlite3.Row) -> Dict[str, Any]:
        return {
            "id": row["id"],
            "email": row["email"],
            "name": row["name"],
            "phone": row["phone"],
            "role": row["role"],
            "notification_prefs": json.loads(row["notification_prefs"]) if row["notification_prefs"] else {},
            "search_prefs": json.loads(row["search_prefs"]) if row["search_prefs"] else {},
            "created_at": row["created_at"]
        }


class SessionService:
    @staticmethod
    def create_session(user_id: str) -> Dict[str, Any]:
        token = SecurityHelper.generate_session_token()
        now = datetime.utcnow()
        expires = now + timedelta(days=7)
        now_str = now.isoformat()
        expires_str = expires.isoformat()

        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO sessions (token, user_id, created_at, expires_at, is_active)
            VALUES (?, ?, ?, ?, 1)
            """, (token, user_id, now_str, expires_str))
            conn.commit()

        return {
            "token": token,
            "user_id": user_id,
            "created_at": now_str,
            "expires_at": expires_str
        }

    @staticmethod
    def get_user_from_token(token: str) -> Optional[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT s.*, u.email, u.name, u.phone, u.role, u.notification_prefs, u.search_prefs, u.created_at as user_created_at
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.token = ? AND s.is_active = 1
            """, (token,))
            row = cursor.fetchone()
            if not row:
                return None

            expires_at = datetime.fromisoformat(row["expires_at"])
            if datetime.utcnow() > expires_at:
                # Expired session
                cursor.execute("UPDATE sessions SET is_active = 0 WHERE token = ?", (token,))
                conn.commit()
                return None

            return {
                "id": row["user_id"],
                "email": row["email"],
                "name": row["name"],
                "phone": row["phone"],
                "role": row["role"],
                "notification_prefs": json.loads(row["notification_prefs"]) if row["notification_prefs"] else {},
                "search_prefs": json.loads(row["search_prefs"]) if row["search_prefs"] else {},
                "created_at": row["user_created_at"]
            }

    @staticmethod
    def terminate_session(token: str) -> bool:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE sessions SET is_active = 0 WHERE token = ?", (token,))
            conn.commit()
            return cursor.rowcount > 0


class SavedPropertiesService:
    @staticmethod
    def get_saved(user_id: str) -> List[str]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT property_id FROM saved_properties WHERE user_id = ? ORDER BY created_at DESC", (user_id,))
            rows = cursor.fetchall()
            return [r["property_id"] for r in rows]

    @staticmethod
    def save_property(user_id: str, property_id: str) -> List[str]:
        now = datetime.utcnow().isoformat()
        rec_id = f"sp_{secrets.token_hex(6)}"
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR IGNORE INTO saved_properties (id, user_id, property_id, created_at)
            VALUES (?, ?, ?, ?)
            """, (rec_id, user_id, property_id, now))
            conn.commit()
        return SavedPropertiesService.get_saved(user_id)

    @staticmethod
    def remove_property(user_id: str, property_id: str) -> List[str]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM saved_properties WHERE user_id = ? AND property_id = ?", (user_id, property_id))
            conn.commit()
        return SavedPropertiesService.get_saved(user_id)

    @staticmethod
    def sync_local_saved(user_id: str, local_ids: List[str]) -> List[str]:
        now = datetime.utcnow().isoformat()
        with get_db() as conn:
            cursor = conn.cursor()
            for pid in local_ids:
                rec_id = f"sp_{secrets.token_hex(6)}"
                cursor.execute("""
                INSERT OR IGNORE INTO saved_properties (id, user_id, property_id, created_at)
                VALUES (?, ?, ?, ?)
                """, (rec_id, user_id, pid, now))
            conn.commit()
        return SavedPropertiesService.get_saved(user_id)


class InquiryService:
    @staticmethod
    def check_rate_limit(ip_or_user: str, max_requests: int = 5, window_seconds: int = 900) -> bool:
        now = time.time()
        cutoff = now - window_seconds
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            DELETE FROM rate_limits WHERE timestamp < ?
            """, (cutoff,))
            cursor.execute("""
            SELECT COUNT(*) as count FROM rate_limits WHERE ip_or_user = ? AND action = 'inquiry' AND timestamp >= ?
            """, (ip_or_user, cutoff))
            count = cursor.fetchone()["count"]
            if count >= max_requests:
                return False
            cursor.execute("""
            INSERT INTO rate_limits (ip_or_user, action, timestamp) VALUES (?, 'inquiry', ?)
            """, (ip_or_user, now))
            conn.commit()
            return True

    @staticmethod
    def create_inquiry(property_id: str, property_title: str, name: str, phone: str,
                       email: str, message: str = "", preferred_bhk: Optional[str] = None,
                       user_id: Optional[str] = None, ip_address: Optional[str] = None) -> Dict[str, Any]:
        inquiry_id = f"inq_{secrets.token_hex(6)}"
        now = datetime.utcnow().isoformat()
        
        # Transparent Delivery Notice
        delivery_status = "unconfigured_gateway"
        delivery_notice = (
            "Notice: SMS/Email carrier gateway is unconfigured in current demonstration environment. "
            "Your inquiry has been securely stored in the platform database with reference ID."
        )

        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO inquiries (id, property_id, property_title, user_id, inquirer_name,
                                   inquirer_phone, inquirer_email, message, preferred_bhk,
                                   status, delivery_status, ip_address, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
            """, (inquiry_id, property_id, property_title, user_id, name.strip(),
                  phone.strip(), email.strip().lower(), message.strip(), preferred_bhk,
                  delivery_status, ip_address, now))
            conn.commit()

        return {
            "id": inquiry_id,
            "property_id": property_id,
            "property_title": property_title,
            "inquirer_name": name,
            "status": "pending",
            "status_label": "Inquiry Logged & Queued for Advisory Review",
            "delivery_notice": delivery_notice,
            "created_at": now
        }

    @staticmethod
    def get_user_inquiries(user_id: str) -> List[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT * FROM inquiries WHERE user_id = ? ORDER BY created_at DESC
            """, (user_id,))
            rows = cursor.fetchall()
            return [
                {
                    "id": r["id"],
                    "property_id": r["property_id"],
                    "property_title": r["property_title"],
                    "inquirer_name": r["inquirer_name"],
                    "inquirer_phone": r["inquirer_phone"],
                    "inquirer_email": r["inquirer_email"],
                    "message": r["message"],
                    "preferred_bhk": r["preferred_bhk"],
                    "status": r["status"],
                    "delivery_status": r["delivery_status"],
                    "created_at": r["created_at"]
                }
                for r in rows
            ]


class OwnerListingService:
    @staticmethod
    def create_or_sync_listing(user_id: str, listing_data: Dict[str, Any]) -> Dict[str, Any]:
        listing_id = listing_data.get("id") or f"prop-usr-{secrets.token_hex(4)}"
        slug = listing_data.get("slug") or f"{listing_id}-listing"
        title = listing_data.get("title", "Residential Property Listing")
        city = listing_data.get("location", {}).get("city", "Bengaluru")
        locality = listing_data.get("location", {}).get("locality", "Whitefield")
        price = int(listing_data.get("price", 0))
        listing_json = json.dumps(listing_data)
        now = datetime.utcnow().isoformat()

        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT INTO owner_listings (id, user_id, slug, title, city, locality, price, listing_json, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                city = excluded.city,
                locality = excluded.locality,
                price = excluded.price,
                listing_json = excluded.listing_json,
                updated_at = excluded.updated_at
            """, (listing_id, user_id, slug, title, city, locality, price, listing_json, now, now))
            conn.commit()

        return listing_data

    @staticmethod
    def get_user_listings(user_id: str) -> List[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            SELECT * FROM owner_listings WHERE user_id = ? ORDER BY updated_at DESC
            """, (user_id,))
            rows = cursor.fetchall()
            return [json.loads(r["listing_json"]) for r in rows]

    @staticmethod
    def delete_listing(user_id: str, listing_id: str) -> bool:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM owner_listings WHERE id = ? AND user_id = ?", (listing_id, user_id))
            conn.commit()
            return cursor.rowcount > 0
