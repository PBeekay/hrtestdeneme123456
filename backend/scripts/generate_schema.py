import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.schema import CreateTable
from db import engine, Base
import models

def generate_schema():
    with open("schema.sql", "w", encoding="utf-8") as f:
        # Sort tables by dependency (rough sort) or use metadata sorted_tables
        for table in Base.metadata.sorted_tables:
            create_table_sql = CreateTable(table).compile(engine)
            f.write(str(create_table_sql))
            f.write(";\n\n")
    print("schema.sql generated successfully.")

if __name__ == "__main__":
    generate_schema()
