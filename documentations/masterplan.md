# Masterplan: Bank Statement Dashboard Pilot

## 1. Scope Recap
- Local pilot: runs on developer machine, not production.
- Input: one or more PDFs (fixed template: date, description, amount). Outgoing transactions are negative.
- Parsing: PDFs are uploaded to OpenAI Files API. Responses API (with strict json_schema) extracts transactions into structured JSON.
- Storage: local JSON file (`db.json`) with users, transactions, imports.
- Output: dashboard with daily, weekly, and monthly summaries of spend & earnings, plus spend by category.
- Timezone: Asia/Jakarta. UI Language: English.

## 2. Categories
Transactions are auto-classified into exactly one of:
- Income
- Food & Dining
- Transport & Mobility
- Bills & Utilities
- Shopping & Entertainment
- Other

If classification confidence < 0.6 and keyword rules do not apply → fallback to 'Other'.

## 3. Features
- **Upload**: drag-and-drop multiple PDFs.
- **Summaries**:
  - Daily (calendar day)
  - Weekly (ISO week starting Monday)
  - Monthly (calendar month)
- **Categories**: spending breakdown by category.
- **Recurring Detection**: detect recurring items (subscriptions, salary, transfers) based on regular intervals.
- **Dashboard UI**:
  - KPI cards: Total Income, Total Spend, Net Balance.
  - Charts: bar/line for time trends, donut for category distribution.
  - Table: transactions list with date, description, amount, category badge, recurring pill.

## 4. Backend (Python FastAPI)
- Endpoints:
  - `POST /upload` → upload PDFs, send to OpenAI, extract JSON, store in db.json.
  - `GET /transactions?start=&end=` → list filtered transactions.
  - `GET /summary/daily?start=&end=` → daily totals.
  - `GET /summary/weekly?start=&end=` → weekly totals.
  - `GET /summary/monthly?start=&end=` → monthly totals.
  - `GET /summary/category?start=&end=` → totals by category.
  - `GET /recurring?min_occurrences=3` → list recurring transactions.
- Modules:
  - **main.py**: FastAPI routes
  - **openai_utils.py**: OpenAI file upload & Responses API integration
  - **recurring.py**: recurring detection logic
  - **db.py**: load/save JSON DB
  - **models.py**: Pydantic schemas

## 5. Frontend (Next.js)
- **Framework**: Next.js 15 with App Router and TypeScript
- **Styling**: Tailwind CSS + Radix UI components
- **Charts**: Recharts for data visualization (bar, line, donut charts)
- **State Management**: TanStack Query for API state management
- **UI Components**: 
  - Shadcn/ui component library
  - Responsive design (desktop & mobile)
  - Dark/light theme support
- **Key Pages**:
  - Dashboard: KPI cards, charts, transaction table
  - Upload: Drag-and-drop PDF upload interface
- **Dependencies**:
  - React 19, Next.js 15
  - Recharts, Lucide icons
  - React Hook Form + Zod validation
  - Date-fns for date handling

## 6. File Structure
```
bank-dashboard/
├── backend/                     # Python FastAPI backend
│   ├── data/
│   │   └── db.json             # Local JSON database
│   ├── main.py                 # FastAPI routes
│   ├── models.py               # Pydantic schemas
│   ├── db.py                   # Database operations
│   ├── openai_utils.py         # OpenAI integration
│   └── recurring.py            # Recurring detection
├── frontend/                    # Next.js frontend
│   ├── app/                    # App router pages
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Dashboard page
│   │   └── transactions/       # Transaction pages
│   ├── components/             # React components
│   │   ├── dashboard/          # Dashboard components
│   │   ├── providers/          # Context providers
│   │   └── ui/                 # Reusable UI components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions
│   └── package.json            # Frontend dependencies
├── documentations/
│   └── masterplan.md           # Project documentation
├── docker-compose.yml          # Container orchestration
└── README.md                   # Project overview
```

## 7. Data Model
db.json structure:
```json
{
  "users": [{ "id": "u1", "name": "Local User", "timezone": "Asia/Jakarta" }],
  "transactions": [
    {
      "id": "t_001",
      "date": "2025-07-15",
      "description_raw": "STARBUCKS KOTA KASABLANKA",
      "amount": -65000,
      "currency": "IDR",
      "merchant_canonical": "Starbucks",
      "category": "Food & Dining",
      "category_confidence": 0.82,
      "is_recurring": false,
      "recurring_frequency": null,
      "source": { "file": "stmt_1.pdf", "openai_file_id": "file_abc" },
      "extracted_with": { "model": "gpt-4o-mini", "schema_version": "txn.v1" }
    }
  ],
  "imports": [
    {
      "id": "imp_001",
      "user_id": "u1",
      "file": "stmt_1.pdf",
      "imported_at": "2025-08-27T09:00:00+07:00",
      "num_rows": 142
    }
  ]
}
```

## 8. Processing Pipeline
1. User uploads PDFs.
2. Backend uploads to OpenAI Files API.
3. Responses API extracts transactions into JSON (strict schema).
4. Apply fallback keyword rules if needed; assign to one of the 6 categories.
5. Detect recurring transactions.
6. Save to db.json.
7. Aggregate into summaries for dashboard.

## 9. Deliverables
- Running backend (FastAPI) with OpenAI integration.
- Running frontend (Next.js) with upload & dashboard.
- JSON DB with categorized & recurring-tagged transactions.
- Charts & tables in responsive UI (desktop & mobile).
- Documentation (README, masterplan.md).
