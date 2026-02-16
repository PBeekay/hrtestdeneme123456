import sys
import os
sys.path.append(os.getcwd())

from sqlalchemy import inspect, text
from db import engine

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT count(*) FROM users"))
        count = result.scalar()
        print(f"User count: {count}")
except Exception as e:
    print(f"ERROR: {e}")
