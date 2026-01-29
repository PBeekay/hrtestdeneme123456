import os
import sys

# Proje dizinini python path'ine ekle
sys.path.insert(0, os.path.dirname(__file__))

# FastAPI uygulamasını 'application' olarak import et
# cPanel Passenger genellikle 'application' nesnesini arar.
from main import app as application
