"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Upload,
  AlertCircle,
  FileIcon,
} from "lucide-react"
import { api, Transaction } from "@/lib/api"
import { cn } from "@/lib/utils"
import { format, startOfMonth, endOfMonth } from "date-fns"
import Link from "next/link"

export default function DashboardPage() {
  const [selectedRange, setSelectedRange] = useState(() => {
    const now = new Date()
    return {
      start: format(startOfMonth(now), "yyyy-MM-dd"),
      end: format(endOfMonth(now), "yyyy-MM-dd"),
      label: "This Month"
    }
  })

  // Fetch transactions with current date range
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ["transactions", selectedRange.start, selectedRange.end],
    queryFn: () => api.getTransactions(selectedRange.start, selectedRange.end),
    retry: 3,
  })

  const transactions = transactionsData?.transactions || []

  // Calculate KPIs from current transactions
  const totalIncome = transactions.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0)
  const totalSpend = transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const netAmount = totalIncome - totalSpend

  const handleRangeChange = (value: string) => {
    const now = new Date()
    if (value === "thisMonth") {
      setSelectedRange({
        start: format(startOfMonth(now), "yyyy-MM-dd"),
        end: format(endOfMonth(now), "yyyy-MM-dd"),
        label: "This Month"
      })
    } else if (value === "lastMonth") {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      setSelectedRange({
        start: format(startOfMonth(lastMonth), "yyyy-MM-dd"),
        end: format(endOfMonth(lastMonth), "yyyy-MM-dd"),
        label: "Last Month"
      })
    } else if (value === "last3Months") {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      setSelectedRange({
        start: format(startOfMonth(threeMonthsAgo), "yyyy-MM-dd"),
        end: format(endOfMonth(now), "yyyy-MM-dd"),
        label: "Last 3 Months"
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy")
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Income": return "bg-green-100 text-green-800"
      case "Food & Dining": return "bg-orange-100 text-orange-800"
      case "Transport & Mobility": return "bg-blue-100 text-blue-800"
      case "Bills & Utilities": return "bg-purple-100 text-purple-800"
      case "Shopping & Entertainment": return "bg-pink-100 text-pink-800"
      case "Other": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground">Your financial transactions and insights</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Upload Button */}
              <Link href="/upload">
                <Button className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload PDFs
                </Button>
              </Link>

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

          {/* Error State */}
          {transactionsError && (
            <Alert className="mb-8 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Failed to load transactions. Please try again.
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2" 
                  onClick={() => refetchTransactions()}
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Empty State */}
          {!transactionsLoading && !transactionsError && transactions.length === 0 && (
            <Card className="mb-8">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileIcon className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Transactions Found</h3>
                <p className="text-gray-600 text-center mb-6">
                  Upload your bank statement PDFs to get started with transaction analysis.
                </p>
                <Link href="/upload">
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload PDFs
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* KPI Cards */}
          {(transactionsLoading || transactions.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <Skeleton className="h-8 w-32 mb-2" />
                  ) : (
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</div>
                  )}
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
                  {transactionsLoading ? (
                    <Skeleton className="h-8 w-32 mb-2" />
                  ) : (
                    <div className="text-2xl font-bold text-red-600">{formatCurrency(totalSpend)}</div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {selectedRange.label} • {transactions.filter((t) => t.amount < 0).length} transactions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
                  <DollarSign className={`h-4 w-4 ${netAmount >= 0 ? "text-green-600" : "text-red-600"}`} />
                </CardHeader>
                <CardContent>
                  {transactionsLoading ? (
                    <Skeleton className="h-8 w-32 mb-2" />
                  ) : (
                    <div className={`text-2xl font-bold ${netAmount >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {formatCurrency(Math.abs(netAmount))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {netAmount >= 0 ? "Surplus" : "Deficit"} • {transactions.length} total transactions
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Transactions Table */}
          {(transactionsLoading || transactions.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>All Transactions</CardTitle>
                <CardDescription>
                  {transactionsLoading ? (
                    <Skeleton className="h-4 w-64" />
                  ) : (
                    `${transactions.length} transactions from ${selectedRange.label}`
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Recurring</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactionsLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          </TableRow>
                        ))
                      ) : transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No transactions found for the selected period.
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-medium">
                              {formatDate(transaction.date)}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{transaction.merchant_canonical}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {transaction.description_raw}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className={cn(
                                "font-semibold",
                                transaction.amount > 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {transaction.amount > 0 ? "+" : ""}{formatCurrency(transaction.amount)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Badge className={getCategoryColor(transaction.category)}>
                                {transaction.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {transaction.is_recurring ? (
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                  Recurring
                                </Badge>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
