#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Test login functionality
"""
from database import authenticate_user, get_db_connection
import pymysql

print("="*50)
print("LOGIN TEST")
print("="*50)

# Test 1: Database connection
print("\n1. Testing database connection...")
conn = get_db_connection()
if conn:
    print("✅ Database connected!")
    conn.close()
else:
    print("❌ Database connection failed!")
    exit(1)

# Test 2: Check if user exists
print("\n2. Checking if user 'ikadmin' exists...")
conn = get_db_connection()
cursor = conn.cursor(pymysql.cursors.DictCursor)
cursor.execute("SELECT username, email, password_hash FROM users WHERE username = 'ikadmin'")
user = cursor.fetchone()

if user:
    print(f"✅ User found: {user['username']}")
    print(f"   Email: {user['email']}")
    print(f"   Hash: {user['password_hash'][:20]}...")
    print(f"   Hash length: {len(user['password_hash'])}")
else:
    print("❌ User not found!")
    conn.close()
    exit(1)

cursor.close()
conn.close()

# Test 3: Test authentication
print("\n3. Testing authentication with 'admin123'...")
result = authenticate_user('ikadmin', 'admin123')

if result:
    print("✅ Authentication SUCCESSFUL!")
    print(f"   User: {result['username']}")
    print(f"   Email: {result['email']}")
else:
    print("❌ Authentication FAILED!")
    print("   Trying to hash 'admin123' to see what we get...")
    from database import hash_password
    new_hash = hash_password('admin123')
    print(f"   New hash: {new_hash}")

print("\n" + "="*50)
print("TEST COMPLETE")
print("="*50)

