#!/usr/bin/env python3
"""Generate a one-time D1 password reset statement without printing the password."""
import getpass
import hashlib
import re
import sys
import uuid


def quote(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def main() -> int:
    email = input('Account email: ').strip().lower()
    if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email) or len(email) > 254:
        print('Enter a valid email address.', file=sys.stderr)
        return 2
    password = getpass.getpass('New password (minimum 12 characters): ')
    confirmation = getpass.getpass('Confirm password: ')
    if password != confirmation or not 12 <= len(password) <= 200:
        print('Passwords must match and be between 12 and 200 characters.', file=sys.stderr)
        return 2
    salt = str(uuid.uuid4())
    digest = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100_000, dklen=32)
    stored = f'{salt}:{digest.hex()}'
    print('UPDATE users SET password_hash=' + quote(stored) + ', updated_at=datetime(\'now\') WHERE email=' + quote(email) + ' RETURNING id,email,role,status;')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
