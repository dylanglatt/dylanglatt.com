import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-change-in-production')
    OPS_USERNAME = os.environ.get('OPS_USERNAME', '')
    OPS_PASSWORD_HASH = os.environ.get('OPS_PASSWORD_HASH', '')
    DEBUG = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
