# Task 002 – Upload, Parse, Persist & Dashboard Table

## Goal
Enable end-to-end flow: upload PDFs → parse with OpenAI → persist into db.json → view all transactions in dashboard table.

## Steps
1. **Backend**
   - Add endpoint `POST /upload`:
     - Accept one or more PDFs via multipart.
     - Extract text content from PDFs locally using pdfplumber.
     - Send extracted text to OpenAI Chat Completions API with structured output enforcing:
       - `date`, `description`, `amount`, `merchant_canonical`, `category`, `confidence`.
       - Category enum: [Income, Food & Dining, Transport & Mobility, Bills & Utilities, Shopping & Entertainment, Other].
     - Apply fallback keyword rules if `confidence < 0.6`.
     - Persist parsed transactions to `data/db.json` with metadata (file name, import_id, imported_at).
   - Add endpoint `GET /transactions?start=&end=`:
     - Read from `db.json`.
     - Filter by date range (inclusive).
     - Return all matching rows.

2. **Frontend**
   - Create `/upload` page:
     - Add drag-and-drop component (`UploadDropzone.tsx`).
     - Call backend `/upload` when files dropped.
     - After successful upload, show summary (`parsed_count`).
     - Redirect to `/dashboard`.
   - Create `/dashboard` page:
     - Fetch `/transactions` for current month by default.
     - Render full transaction table with columns:
       - Date (DD/MM/YYYY)
       - Description
       - Amount (with color formatting: green for income, red for spend)
       - Category (badge)
       - Recurring pill (placeholder, to be filled in later task).
     - Use TanStack Query for data fetching, with loading and error states.

3. **Testing**
   - Use provided mock PDFs with 30–50 rows.
   - Upload file via `/upload`.
   - Confirm preview count matches rows.
   - Navigate to `/dashboard`, see transactions rendered from db.json.
   - Refresh page → data persists.

## Acceptance Criteria
- Uploading a PDF parses via OpenAI and stores transactions in db.json.
- After upload, dashboard shows transactions in a table.
- Refreshing page still shows the same transactions (persistence works).
- Table includes all specified columns with proper formatting.