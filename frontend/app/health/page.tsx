"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { api } from "@/lib/api"

export default function HealthPage() {
  const [healthStatus, setHealthStatus] = useState<{ status: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkHealth = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.healthCheck()
      setHealthStatus(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
      setHealthStatus(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">API Health Check</h1>
            <p className="text-muted-foreground">
              Test the connection between the frontend and backend services
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Backend API Status
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkHealth}
                  disabled={loading}
                  className="ml-auto"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Refresh
                </Button>
              </CardTitle>
              <CardDescription>
                Checking connection to http://localhost:8000/health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center gap-3">
                  <span className="font-medium">Status:</span>
                  {loading ? (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Checking...
                      </div>
                    </Badge>
                  ) : error ? (
                    <Badge variant="destructive" className="bg-red-100 text-red-700">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Error
                    </Badge>
                  ) : healthStatus?.status === "ok" ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Healthy
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                      Unknown
                    </Badge>
                  )}
                </div>

                {/* Response Details */}
                {healthStatus && (
                  <div>
                    <span className="font-medium">Response:</span>
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <pre className="text-sm">
                        {JSON.stringify(healthStatus, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Error Details */}
                {error && (
                  <div>
                    <span className="font-medium text-red-600">Error Details:</span>
                    <div className="mt-2 p-3 bg-red-50 rounded-md border border-red-200">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                    <div className="mt-3 text-sm text-muted-foreground">
                      <p><strong>Troubleshooting:</strong></p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Make sure the backend server is running on port 8000</li>
                        <li>Run: <code className="bg-muted px-1 rounded">uvicorn main:app --reload --port 8000</code></li>
                        <li>Check that CORS is properly configured</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Integration Status */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Frontend ↔ Backend Integration:</span>
                    {healthStatus?.status === "ok" ? (
                      <span className="text-green-600 font-medium">✓ Working</span>
                    ) : (
                      <span className="text-red-600 font-medium">✗ Failed</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
