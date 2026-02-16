import sys
import os
sys.path.append(os.getcwd())

from sqlalchemy import inspect
from db import engine

try:
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables found: {tables}")
    if 'users' in tables:
        print("SUCCESS: 'users' table exists.")
    else:
        print("FAILURE: 'users' table still missing.")
except Exception as e:
    print(f"ERROR: Could not connect or inspect: {e}")
