from fastapi import FastAPI, File, UploadFile, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import tempfile
import os
from datetime import datetime
import uuid
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from models import (
    UploadResponse, TransactionListResponse, Transaction, 
    TransactionSource, ExtractedWith, Import
)
from db import (
    add_transactions, add_import_record, get_transactions,
    generate_transaction_id, generate_import_id
)
from openai_utils import (
    extract_text_from_pdf, extract_transactions_from_pdf_text,
    apply_fallback_rules, cleanup_openai_file
)

app = FastAPI(title="Bank Dashboard API", version="1.0.0")

# Configure CORS to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint to verify the API is running"""
    return {"status": "ok"}

@app.post("/upload", response_model=UploadResponse)
async def upload_pdfs(files: List[UploadFile] = File(...)):
    """Upload and parse PDF bank statements"""
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files provided")
        
        # Validate file types
        for file in files:
            if not file.filename.lower().endswith('.pdf'):
                raise HTTPException(status_code=400, detail=f"File {file.filename} is not a PDF")
        
        # Generate import ID
        import_id = generate_import_id()
        total_parsed = 0
        all_transactions = []
        
        for file in files:
            # Save file temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
                content = await file.read()
                temp_file.write(content)
                temp_file_path = temp_file.name
            
            try:
                # Extract text from PDF locally
                pdf_text = extract_text_from_pdf(temp_file_path)
                
                # Extract transactions using OpenAI with extracted text
                openai_transactions = extract_transactions_from_pdf_text(
                    pdf_text, file.filename
                )
                
                # Convert to our Transaction model
                for idx, openai_txn in enumerate(openai_transactions):
                    # Apply fallback rules if confidence < 0.6
                    final_category = apply_fallback_rules(openai_txn)
                    
                    transaction = Transaction(
                        id=generate_transaction_id(),
                        date=openai_txn.date,
                        description_raw=openai_txn.description,
                        amount=openai_txn.amount,
                        currency="IDR",
                        merchant_canonical=openai_txn.merchant_canonical,
                        category=final_category,
                        category_confidence=openai_txn.confidence,
                        is_recurring=False,  # Will be updated in later task
                        recurring_frequency=None,
                        source=TransactionSource(
                            file=file.filename
                        ),
                        extracted_with=ExtractedWith(
                            model="gpt-4o-mini",
                            schema_version="txn.v1"
                        )
                    )
                    all_transactions.append(transaction)
                
                total_parsed += len(openai_transactions)
                
                # Clean up OpenAI file (optional, to manage storage costs)
                # cleanup_openai_file(openai_file_id)
                
            finally:
                # Clean up temporary file
                os.unlink(temp_file_path)
        
        # Save all transactions to database
        if all_transactions:
            add_transactions(all_transactions)
        
        # Create import record
        import_record = Import(
            id=import_id,
            user_id="u1",  # Default user from masterplan
            file=", ".join([f.filename for f in files]),
            imported_at=datetime.now().isoformat(),
            num_rows=total_parsed
        )
        add_import_record(import_record)
        
        return UploadResponse(
            success=True,
            parsed_count=total_parsed,
            import_id=import_id,
            message=f"Successfully processed {len(files)} file(s) and extracted {total_parsed} transactions"
        )
        
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing files: {str(e)}")

@app.get("/transactions", response_model=TransactionListResponse)
async def get_transactions_endpoint(
    start: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Get transactions with optional date filtering"""
    try:
        transactions = get_transactions(start_date=start, end_date=end)
        
        return TransactionListResponse(
            transactions=transactions,
            total=len(transactions)
        )
        
    except Exception as e:
        print(f"Get transactions error: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving transactions: {str(e)}")
