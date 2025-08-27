import json
import os
from typing import List, Optional
from datetime import datetime
from models import DatabaseModel, Transaction, User, Import

DB_FILE_PATH = "data/db.json"

def ensure_data_directory():
    """Ensure the data directory exists"""
    os.makedirs(os.path.dirname(DB_FILE_PATH), exist_ok=True)

def load_database() -> DatabaseModel:
    """Load database from JSON file, create if doesn't exist"""
    ensure_data_directory()
    
    if not os.path.exists(DB_FILE_PATH):
        # Create initial database with default user
        initial_data = DatabaseModel(
            users=[User(id="u1", name="Local User", timezone="Asia/Jakarta")],
            transactions=[],
            imports=[]
        )
        save_database(initial_data)
        return initial_data
    
    try:
        with open(DB_FILE_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return DatabaseModel(**data)
    except Exception as e:
        print(f"Error loading database: {e}")
        # Return empty database if corrupted
        return DatabaseModel(users=[], transactions=[], imports=[])

def save_database(db: DatabaseModel):
    """Save database to JSON file"""
    ensure_data_directory()
    
    try:
        with open(DB_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(db.dict(), f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Error saving database: {e}")
        raise

def add_transactions(transactions: List[Transaction]):
    """Add new transactions to the database"""
    db = load_database()
    db.transactions.extend(transactions)
    save_database(db)

def add_import_record(import_record: Import):
    """Add import record to the database"""
    db = load_database()
    db.imports.append(import_record)
    save_database(db)

def get_transactions(start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Transaction]:
    """Get transactions with optional date filtering"""
    db = load_database()
    transactions = db.transactions
    
    if start_date:
        transactions = [t for t in transactions if t.date >= start_date]
    
    if end_date:
        transactions = [t for t in transactions if t.date <= end_date]
    
    # Sort by date descending
    transactions.sort(key=lambda t: t.date, reverse=True)
    
    return transactions

def get_transaction_count() -> int:
    """Get total number of transactions"""
    db = load_database()
    return len(db.transactions)

def generate_transaction_id() -> str:
    """Generate a unique transaction ID"""
    import uuid
    return f"t_{str(uuid.uuid4())[:8]}"

def generate_import_id() -> str:
    """Generate a unique import ID"""
    db = load_database()
    count = len(db.imports)
    return f"imp_{count + 1:03d}"
