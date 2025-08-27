#!/usr/bin/env python3
"""
Script to fix duplicate transaction IDs in the database.
This is a one-time fix to regenerate unique IDs for all existing transactions.
"""

import json
import uuid
from pathlib import Path

# Path to the database file
DB_FILE_PATH = Path(__file__).parent / "data" / "db.json"

def generate_unique_transaction_id():
    """Generate a unique transaction ID using UUID"""
    return f"t_{str(uuid.uuid4())[:8]}"

def fix_duplicate_ids():
    """Fix duplicate transaction IDs in the database"""
    
    if not DB_FILE_PATH.exists():
        print("Database file not found!")
        return
    
    # Load the database
    with open(DB_FILE_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Check if we have transactions
    if 'transactions' not in data or not data['transactions']:
        print("No transactions found in database")
        return
    
    # Generate unique IDs for all transactions
    used_ids = set()
    fixed_count = 0
    
    for transaction in data['transactions']:
        # Generate a new unique ID
        new_id = generate_unique_transaction_id()
        while new_id in used_ids:
            new_id = generate_unique_transaction_id()
        
        used_ids.add(new_id)
        
        # Update the transaction ID
        old_id = transaction.get('id')
        transaction['id'] = new_id
        fixed_count += 1
        
        if fixed_count <= 5:  # Show first 5 changes
            print(f"Changed transaction ID: {old_id} → {new_id} ({transaction.get('description_raw', 'N/A')})")
    
    # Save the updated database
    with open(DB_FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"\nFixed {fixed_count} transactions with unique IDs")
    print("Database updated successfully!")

if __name__ == "__main__":
    fix_duplicate_ids()
