# Personal Finance Dashboard

A local pilot application for analyzing personal bank statements with AI-powered transaction categorization and financial insights.

## Overview

This dashboard allows you to upload PDF bank statements and automatically extract, categorize, and visualize your financial transactions. Built for local development with OpenAI integration for intelligent transaction processing.

## Features

- **PDF Upload**: Drag-and-drop multiple bank statement PDFs
- **AI Categorization**: Automatic transaction categorization using OpenAI
- **Financial Summaries**: Daily, weekly, and monthly spending analysis
- **Category Breakdown**: Spending insights across 6 main categories
- **Recurring Detection**: Identify subscriptions and recurring payments
- **Responsive UI**: Modern dashboard with charts and transaction tables

## Tech Stack

### Backend
- **Python FastAPI** - REST API server
- **OpenAI API** - Transaction extraction and categorization
- **JSON Storage** - Local file-based database

### Frontend  
- **Next.js 15** with App Router and TypeScript
- **Tailwind CSS** + Radix UI components
- **Recharts** for data visualization
- **TanStack Query** for API state management

## Transaction Categories

Transactions are automatically classified into:
- **Income** - Salary, transfers, deposits
- **Food & Dining** - Restaurants, groceries, food delivery
- **Transport & Mobility** - Gas, public transport, ride-sharing
- **Bills & Utilities** - Electricity, internet, phone bills
- **Shopping & Entertainment** - Retail, subscriptions, leisure
- **Other** - Unclassified transactions

## API Endpoints

- `POST /upload` - Upload and process PDF statements
- `GET /transactions` - Retrieve filtered transactions
- `GET /summary/daily` - Daily spending totals
- `GET /summary/weekly` - Weekly spending totals  
- `GET /summary/monthly` - Monthly spending totals
- `GET /summary/category` - Spending by category
- `GET /recurring` - Recurring transaction detection

## Project Structure

```
personal-finance-dashboard/
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
│   ├── components/             # React components
│   ├── hooks/                  # Custom React hooks
│   └── lib/                    # Utility functions
├── documentations/
│   └── masterplan.md           # Project documentation
└── docker-compose.yml          # Container orchestration
```

## Getting Started

### Prerequisites
- Python 3.13+
- Node.js 18+
- OpenAI API key

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend Setup
```bash
cd frontend
npm install
```

### Environment Configuration
Create `.env` files with your OpenAI API key:

**Backend (.env)**:
```
OPENAI_API_KEY=your_openai_api_key_here
```

**Frontend (.env.local)**:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Running the Application

**Start Backend** (from `backend/`):
```bash
uvicorn main:app --reload --port 8000
```

**Start Frontend** (from `frontend/`):
```bash
npm run dev
```

Access the dashboard at `http://localhost:3000`

## Data & Privacy

- **Local Storage**: All data is stored locally in JSON files
- **No Cloud Database**: No external database dependencies
- **OpenAI Integration**: PDFs are temporarily uploaded to OpenAI for processing
- **Timezone**: Configured for Asia/Jakarta timezone

## License

This project is for personal use and development purposes.
