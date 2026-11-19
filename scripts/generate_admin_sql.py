#!/usr/bin/env python3
"""Generate a one-time SQL insert for the first NACOS super administrator.

Run locally in Termux, then paste the generated SQL into the authenticated
Cloudflare D1 SQL Console. The password itself is never printed or written.
"""

import getpass
import hashlib
import json
import re
import sys
import uuid


def sql_string(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def main() -> int:
    email = input("Administrator email: ").strip().lower()
    full_name = input("Administrator full name: ").strip()
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email) or len(email) > 254:
        print("Enter a valid email address.", file=sys.stderr)
        return 2
    if len(full_name) < 2 or len(full_name) > 120:
        print("Enter a name between 2 and 120 characters.", file=sys.stderr)
        return 2

    password = getpass.getpass("Administrator password (minimum 12 characters): ")
    confirmation = getpass.getpass("Confirm password: ")
    if password != confirmation:
        print("Passwords do not match.", file=sys.stderr)
        return 2
    if not 12 <= len(password) <= 200:
        print("Password must be between 12 and 200 characters.", file=sys.stderr)
        return 2

    user_id = str(uuid.uuid4())
    salt = str(uuid.uuid4())
    derived = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 310_000, dklen=32)
    password_hash = f"{salt}:{derived.hex()}"
    audit_id = str(uuid.uuid4())

    # Stop if any user already exists; this insert is atomic in D1.
    print(
        "INSERT INTO users (id,email,password_hash,full_name,role,status) "
        f"SELECT {sql_string(user_id)},{sql_string(email)},{sql_string(password_hash)},"
        f"{sql_string(full_name)},'super_admin','active' "
        "WHERE NOT EXISTS (SELECT 1 FROM users);"
    )
    metadata = sql_string(json.dumps({"email": email}, separators=(",", ":")))
    print(
        "INSERT INTO audit_log (id,actor_user_id,action,target_type,target_id,metadata_json) "
        f"SELECT {sql_string(audit_id)},{sql_string(user_id)},"
        "'initial_super_admin_created','user',"
        f"{sql_string(user_id)},{metadata} "
        f"WHERE EXISTS (SELECT 1 FROM users WHERE id={sql_string(user_id)});"
    )
    print("-- Verify with: SELECT id,email,role,status FROM users WHERE id=" + sql_string(user_id) + ";")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
