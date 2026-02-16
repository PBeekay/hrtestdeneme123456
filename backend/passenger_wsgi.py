import os
import sys
from a2wsgi import ASGIMiddleware

# Increase recursion limit just in case, though a2wsgi should prevent it
sys.setrecursionlimit(2000)

# cPanel/Passenger needs to know where the app is.
sys.path.insert(0, os.path.dirname(__file__))

try:
    from main import app
except Exception as e:
    print(f"Error importing main app: {e}")
    raise e

# Wrap the ASGI app with ASGIMiddleware to make it WSGI compatible for Passenger
application = ASGIMiddleware(app)
