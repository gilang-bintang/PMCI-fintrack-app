"use client"

import type React from "react"
import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Plus,
} from "lucide-react"
import { api } from "@/lib/api"
import { formatCurrency, formatDate, getDateRangePresets, cn } from "@/lib/utils"
import { SpendingChart } from "@/components/dashboard/spending-chart"
import { CategoryChart } from "@/components/dashboard/category-chart"
import { TransactionsTable } from "@/components/dashboard/transactions-table"
import { ErrorModal } from "@/components/ui/error-modal"
import { useToast } from "@/hooks/use-toast"
import { format, startOfMonth, subMonths } from "date-fns"

type DateRange = {
  start: Date
  end: Date
  label: string
}

type ViewType = "daily" | "weekly" | "monthly"

interface UploadedFile {
  file: File
  status: "pending" | "uploading" | "success" | "error"
  error?: string
}


export default function DashboardPage() {
  const [selectedRange, setSelectedRange] = useState<DateRange>(() => {
    const presets = getDateRangePresets()
    return presets.thisMonth
  })
  const [viewType, setViewType] = useState<ViewType>("daily")
  const { toast } = useToast()

  // Upload states  
  const [uploadResult, setUploadResult] = useState<{ import_id: string; parsed_count: number } | null>(null)
  
  // Error modal state
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    details?: string
  }>({
    isOpen: false,
    title: "",
    message: "",
    details: undefined,
  })

  // Format dates for API calls
  const startDate = format(selectedRange.start, "yyyy-MM-dd")
  const endDate = format(selectedRange.end, "yyyy-MM-dd")

  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["transactions", startDate, endDate],
    queryFn: () => api.getTransactions(startDate, endDate),
  })

  const transactions = transactionsData?.transactions || []

  // Process transactions client-side for chart data
  const { data: dailySummary } = useQuery({
    queryKey: ["summary", "daily", transactions],
    queryFn: () => {
      const summary: Record<string, Record<string, number>> = {}
      transactions.forEach(t => {
        const date = t.date
        if (!summary[date]) summary[date] = {}
        const category = t.category
        if (!summary[date][category]) summary[date][category] = 0
        if (t.amount < 0) { // Only count spending, not income
          summary[date][category] += Math.abs(t.amount)
        }
      })
      return { summary }
    },
    enabled: transactions.length > 0,
  })

  const { data: weeklySummary } = useQuery({
    queryKey: ["summary", "weekly", transactions],
    queryFn: () => {
      const summary: Record<string, Record<string, number>> = {}
      transactions.forEach(t => {
        const date = new Date(t.date)
        const year = date.getFullYear()
        const week = Math.ceil((date.getDate() + new Date(year, date.getMonth(), 1).getDay()) / 7)
        const weekKey = `${year}-${date.getMonth()+1}-W${week}`
        if (!summary[weekKey]) summary[weekKey] = {}
        const category = t.category
        if (!summary[weekKey][category]) summary[weekKey][category] = 0
        if (t.amount < 0) { // Only count spending, not income
          summary[weekKey][category] += Math.abs(t.amount)
        }
      })
      return { summary }
    },
    enabled: transactions.length > 0,
  })

  const { data: monthlySummary } = useQuery({
    queryKey: ["summary", "monthly", transactions],
    queryFn: () => {
      const summary: Record<string, Record<string, number>> = {}
      transactions.forEach(t => {
        const monthKey = t.date.substring(0, 7) // YYYY-MM
        if (!summary[monthKey]) summary[monthKey] = {}
        const category = t.category
        if (!summary[monthKey][category]) summary[monthKey][category] = 0
        if (t.amount < 0) { // Only count spending, not income
          summary[monthKey][category] += Math.abs(t.amount)
        }
      })
      return { summary }
    },
    enabled: transactions.length > 0,
  })

  const { data: categorySummary } = useQuery({
    queryKey: ["summary", "category", transactions],
    queryFn: () => {
      const summary: Record<string, { income: number; spend: number; count: number }> = {}
      transactions.forEach(t => {
        const category = t.category
        if (!summary[category]) summary[category] = { income: 0, spend: 0, count: 0 }
        if (t.amount > 0) {
          summary[category].income += t.amount
        } else {
          summary[category].spend += Math.abs(t.amount)
        }
        summary[category].count += 1
      })
      return { summary }
    },
    enabled: transactions.length > 0,
  })

  // Calculate KPIs from current transactions
  const totalIncome = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
  const totalSpend = transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const netAmount = totalIncome - totalSpend

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData()
      files.forEach((file) => formData.append("files", file))
      
      const response = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Upload failed: ${response.status}`)
      }
      
      return response.json()
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: `Successfully processed ${data.parsed_count} transactions from ${data.files_processed || "your files"}.`,
      })
      setUploadResult(data)
      // Refetch transactions data
      refetchTransactions()
    },
    onError: (error) => {
      const errorDetails = getErrorDetails(error)
      setErrorModal({
        isOpen: true,
        ...errorDetails,
      })
    },
  })

  const handleRangeChange = (value: string) => {
    const presets = getDateRangePresets()
    if (value === "thisMonth") {
      setSelectedRange(presets.thisMonth)
    } else if (value === "lastMonth") {
      setSelectedRange(presets.lastMonth)
    } else if (value === "last3Months") {
      const now = new Date()
      const start = startOfMonth(subMonths(now, 2))
      setSelectedRange({ start, end: now, label: "Last 3 Months" })
    }
  }

  const getSummaryData = () => {
    switch (viewType) {
      case "daily":
        return dailySummary?.summary || {}
      case "weekly":
        return weeklySummary?.summary || {}
      case "monthly":
        return monthlySummary?.summary || {}
      default:
        return {}
    }
  }

  // Error mapping function
  const getErrorDetails = (error: any) => {
    const errorMessage = error.message || "An unknown error occurred"
    
    if (errorMessage.includes("OPENAI_API_KEY")) {
      return {
        title: "Configuration Error",
        message: "The server is missing required AI configuration. Please contact your administrator.",
        details: "Missing OpenAI API key configuration on the server",
      }
    }
    
    if (errorMessage.includes("Upload failed: 500")) {
      return {
        title: "Server Error", 
        message: "The server encountered an internal error while processing your files.",
        details: "HTTP 500 Internal Server Error",
      }
    }
    
    if (errorMessage.includes("Upload failed: 413")) {
      return {
        title: "File Too Large",
        message: "One or more files are too large. Please try with smaller PDF files.",
        details: "Request payload too large",
      }
    }
    
    if (errorMessage.includes("Upload failed: 400")) {
      return {
        title: "Invalid File Format",
        message: "Please ensure you're uploading valid PDF files only.",
        details: "Bad request - invalid file format",
      }
    }

    // Default error
    return {
      title: "Upload Failed",
      message: "Failed to process your files. Please check your files and try again.",
      details: errorMessage,
    }
  }

  // Upload handlers

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      const pdfFiles = selectedFiles.filter((file) => file.type === "application/pdf")
      
      if (pdfFiles.length === 0) {
        setErrorModal({
          isOpen: true,
          title: "Invalid File Format",
          message: "Please select PDF files only. Other file formats are not supported.",
          details: "Only PDF files can be processed for transaction extraction",
        })
        return
      }
      
      if (pdfFiles.length !== selectedFiles.length) {
        setErrorModal({
          isOpen: true,
          title: "Some Files Skipped",
          message: `${selectedFiles.length - pdfFiles.length} non-PDF files were skipped. Only PDF files will be processed.`,
          details: `Selected: ${selectedFiles.length} files, Processing: ${pdfFiles.length} PDF files`,
        })
      }
      
      // Automatically start upload
      uploadMutation.mutate(pdfFiles)
      
      // Reset the input so same files can be selected again if needed
      e.target.value = ""
    }
  }


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Spending Dashboard</h1>
              <p className="text-muted-foreground">Your spending insights and analytics</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Hidden File Input */}
              <input
                type="file"
                multiple
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="pdf-file-input"
                disabled={uploadMutation.isPending}
              />
              
              {/* Upload Button */}
              <Button 
                onClick={() => document.getElementById('pdf-file-input')?.click()} 
                className="flex items-center gap-2"
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Upload PDFs
                  </>
                )}
              </Button>

              {/* Date Range Selector */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select onValueChange={handleRangeChange} defaultValue="thisMonth">
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select date range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                    <SelectItem value="last3Months">Last 3 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>


          {/* Dashboard Content */}
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
                  <p className="text-xs text-muted-foreground">
                    {selectedRange.label} • {transactions.filter((t) => t.amount > 0).length} transactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSpend)}</div>
                  <p className="text-xs text-muted-foreground">
                    {selectedRange.label} • {transactions.filter((t) => t.amount < 0).length} transactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Amount</CardTitle>
                  <DollarSign className={`h-4 w-4 ${netAmount >= 0 ? "text-green-600" : "text-red-600"}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${netAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(Math.abs(netAmount))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {netAmount >= 0 ? "Surplus" : "Deficit"} • {transactions.length} total transactions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Spending Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>Spending Trends</CardTitle>
                  <CardDescription>Spending by category over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={viewType} onValueChange={(value) => setViewType(value as ViewType)}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="daily">Daily</TabsTrigger>
                      <TabsTrigger value="weekly">Weekly</TabsTrigger>
                      <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    </TabsList>
                    <TabsContent value={viewType} className="mt-4">
                      <SpendingChart data={getSummaryData()} viewType={viewType} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Category Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                  <CardDescription>Where your money goes</CardDescription>
                </CardHeader>
                <CardContent>
                  <CategoryChart data={categorySummary?.summary || {}} />
                </CardContent>
              </Card>
            </div>

            {/* Transactions Table */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  {transactions.length} transactions from {formatDate(startDate)} to {formatDate(endDate)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TransactionsTable transactions={transactions} isLoading={transactionsLoading} />
              </CardContent>
            </Card>
          </>
        </div>
      </div>
      
      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
        title={errorModal.title}
        message={errorModal.message}
        details={errorModal.details}
        autoClose={true}
        autoCloseDelay={5000}
      />
    </div>
  )
}
