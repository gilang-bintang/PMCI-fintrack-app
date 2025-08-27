from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime
from enum import Enum

# Transaction categories as defined in masterplan
class TransactionCategory(str, Enum):
    INCOME = "Income"
    FOOD_DINING = "Food & Dining"
    TRANSPORT_MOBILITY = "Transport & Mobility"
    BILLS_UTILITIES = "Bills & Utilities"
    SHOPPING_ENTERTAINMENT = "Shopping & Entertainment"
    OTHER = "Other"

# Pydantic models
class TransactionSource(BaseModel):
    file: str

class ExtractedWith(BaseModel):
    model: str
    schema_version: str

class Transaction(BaseModel):
    id: str
    date: str  # YYYY-MM-DD format
    description_raw: str
    amount: float
    currency: str = "IDR"
    merchant_canonical: str
    category: TransactionCategory
    category_confidence: float
    is_recurring: bool = False
    recurring_frequency: Optional[str] = None
    source: TransactionSource
    extracted_with: ExtractedWith

class User(BaseModel):
    id: str
    name: str
    timezone: str = "Asia/Jakarta"

class Import(BaseModel):
    id: str
    user_id: str
    file: str
    imported_at: str  # ISO datetime string
    num_rows: int

class DatabaseModel(BaseModel):
    users: List[User]
    transactions: List[Transaction]
    imports: List[Import]

# OpenAI response models
class OpenAITransactionResponse(BaseModel):
    date: str
    description: str
    amount: float
    merchant_canonical: str
    category: str
    confidence: float

# API request/response models
class UploadResponse(BaseModel):
    success: bool
    parsed_count: int
    import_id: str
    message: str

class TransactionListResponse(BaseModel):
    transactions: List[Transaction]
    total: int
