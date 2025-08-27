import json
import openai
import os
import pdfplumber
from dotenv import load_dotenv
from typing import List, Dict, Any
from models import OpenAITransactionResponse, TransactionCategory
import json
import tempfile
import re

# Initialize OpenAI client
def get_openai_client():
    """Get OpenAI client with API key from environment"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable is required")
    return openai.OpenAI(api_key=api_key)

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text content from PDF file using pdfplumber"""
    text_content = ""
    
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_content += page_text + "\n"
    
    return text_content.strip()

def extract_transactions_from_pdf_text(pdf_text: str, original_filename: str, client=None) -> List[OpenAITransactionResponse]:
    """Extract transactions from PDF text using OpenAI Chat Completions API with structured output"""
    if client is None:
        client = get_openai_client()
    
    # Define JSON schema for transaction extraction
    schema = {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "transactions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "date": {"type": "string", "description": "Transaction date in YYYY-MM-DD format"},
                        "description": {"type": "string", "description": "Transaction description as it appears in statement"},
                        "amount": {"type": "number", "description": "Transaction amount (negative for expenses, positive for income)"},
                        "merchant_canonical": {"type": "string", "description": "Standardized merchant name"},
                        "category": {
                            "type": "string", 
                            "enum": ["Income", "Food & Dining", "Transport & Mobility", "Bills & Utilities", "Shopping & Entertainment", "Other"],
                            "description": "Transaction category"
                        },
                        "confidence": {"type": "number", "description": "Confidence score for categorization (0.0 to 1.0)"}
                    },
                    "required": ["date", "description", "amount", "merchant_canonical", "category", "confidence"]
                }
            }
        },
        "required": ["transactions"]
    }
    
    # System prompt for transaction extraction
    system_prompt = """You are an expert at extracting financial transactions from bank statement PDFs. 

Extract ALL transactions from the document, ensuring:
1. Date format: YYYY-MM-DD
2. Amount: negative for expenses/outgoing, positive for income/incoming
3. Description: exact text from statement
4. Merchant canonical: standardized merchant name (e.g., "STARBUCKS KOTA KASABLANKA" → "Starbucks")
5. Category: classify into one of the 6 predefined categories
6. Confidence: your confidence in the categorization (0.0-1.0)

Categories:
- Income: salary, transfers in, refunds, cashback
- Food & Dining: restaurants, cafes, food delivery, groceries
- Transport & Mobility: fuel, parking, ride-sharing, public transport
- Bills & Utilities: electricity, water, phone, internet, insurance
- Shopping & Entertainment: retail, online shopping, movies, subscriptions
- Other: everything else, ATM withdrawals, bank fees

Be thorough and extract every single transaction visible in the document."""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user", 
                    "content": f"Please extract all transactions from this bank statement text from file '{original_filename}':\n\n{pdf_text}"
                }
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "transaction_extraction",
                    "strict": True,
                    "schema": schema
                }
            }
        )
        
        # Parse the JSON response
        result = json.loads(response.choices[0].message.content)
        transactions_data = result.get("transactions", [])
        
        # Convert to Pydantic models
        transactions = []
        for txn_data in transactions_data:
            transactions.append(OpenAITransactionResponse(**txn_data))
        
        return transactions
        
    except Exception as e:
        print(f"Error extracting transactions: {e}")
        raise

def apply_fallback_rules(transaction: OpenAITransactionResponse) -> str:
    """Apply fallback keyword rules if confidence < 0.6"""
    if transaction.confidence >= 0.6:
        return transaction.category
    
    description_lower = transaction.description.lower()
    merchant_lower = transaction.merchant_canonical.lower()
    
    # Income keywords
    income_keywords = ['salary', 'gaji', 'transfer masuk', 'refund', 'cashback', 'interest']
    if any(keyword in description_lower or keyword in merchant_lower for keyword in income_keywords):
        return TransactionCategory.INCOME.value
    
    # Food & Dining keywords
    food_keywords = ['restaurant', 'cafe', 'starbucks', 'mcdonald', 'kfc', 'pizza', 'food', 'gofood', 'grabfood', 'supermarket']
    if any(keyword in description_lower or keyword in merchant_lower for keyword in food_keywords):
        return TransactionCategory.FOOD_DINING.value
    
    # Transport keywords
    transport_keywords = ['fuel', 'bensin', 'pertamina', 'shell', 'gojek', 'grab', 'taxi', 'parking', 'toll', 'tol']
    if any(keyword in description_lower or keyword in merchant_lower for keyword in transport_keywords):
        return TransactionCategory.TRANSPORT_MOBILITY.value
    
    # Bills keywords
    bills_keywords = ['pln', 'listrik', 'telkom', 'indihome', 'insurance', 'asuransi', 'water', 'air', 'phone', 'telp']
    if any(keyword in description_lower or keyword in merchant_lower for keyword in bills_keywords):
        return TransactionCategory.BILLS_UTILITIES.value
    
    # Shopping keywords
    shopping_keywords = ['shop', 'mall', 'store', 'tokopedia', 'shopee', 'lazada', 'netflix', 'spotify', 'subscription']
    if any(keyword in description_lower or keyword in merchant_lower for keyword in shopping_keywords):
        return TransactionCategory.SHOPPING_ENTERTAINMENT.value
    
    # Default to Other
    return TransactionCategory.OTHER.value

def cleanup_openai_file(file_id: str, client=None):
    """Delete file from OpenAI storage"""
    if client is None:
        client = get_openai_client()
    
    try:
        client.files.delete(file_id)
    except Exception as e:
        print(f"Warning: Could not delete OpenAI file {file_id}: {e}")
