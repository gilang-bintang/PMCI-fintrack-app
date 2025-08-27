"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { api, UploadResponse } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { UploadIcon, FileIcon, CheckIcon, LoaderIcon, XIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => api.uploadPDFs(files),
    onSuccess: (data: UploadResponse) => {
      setUploadResult(data)
      toast({
        title: "Upload Successful",
        description: `Successfully processed ${data.parsed_count} transactions from ${selectedFiles.length} file(s).`,
      })
      // Auto-redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push("/dashboard")
      }, 3000)
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      })
    },
  })

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files)
      const pdfFiles = files.filter(file => file.type === "application/pdf")
      
      if (pdfFiles.length === 0) {
        toast({
          title: "Invalid Files",
          description: "Please select only PDF files.",
          variant: "destructive",
        })
        return
      }
      
      setSelectedFiles(pdfFiles)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      const pdfFiles = files.filter(file => file.type === "application/pdf")
      
      if (pdfFiles.length === 0) {
        toast({
          title: "Invalid Files",
          description: "Please select only PDF files.",
          variant: "destructive",
        })
        return
      }
      
      setSelectedFiles(pdfFiles)
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index))
  }

  const handleUpload = () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files",
        description: "Please select at least one PDF file to upload.",
        variant: "destructive",
      })
      return
    }
    uploadMutation.mutate(selectedFiles)
  }

  const resetUpload = () => {
    setSelectedFiles([])
    setUploadResult(null)
  }

  if (uploadResult) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckIcon className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Upload Complete!</CardTitle>
            <CardDescription>
              Successfully processed your bank statement(s)
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-lg font-semibold">{uploadResult.parsed_count} transactions</p>
              <p className="text-sm text-gray-600">extracted from {selectedFiles.length} file(s)</p>
            </div>
            <p className="text-sm text-gray-600">{uploadResult.message}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.push("/dashboard")}>
                View Dashboard
              </Button>
              <Button variant="outline" onClick={resetUpload}>
                Upload More Files
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Redirecting to dashboard in 3 seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Upload Bank Statements</CardTitle>
          <CardDescription>
            Drop your PDF bank statements here or click to browse. We'll automatically extract and categorize your transactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drop Zone */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300",
              uploadMutation.isPending && "opacity-50 pointer-events-none"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
              disabled={uploadMutation.isPending}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <UploadIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">
                Drop PDF files here or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports multiple PDF files
              </p>
            </label>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Selected Files ({selectedFiles.length})</h3>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <FileIcon className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={uploadMutation.isPending}
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || uploadMutation.isPending}
              className="min-w-32"
            >
              {uploadMutation.isPending ? (
                <>
                  <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Only PDF files are supported</p>
            <p>• Files are processed using OpenAI to extract transaction data</p>
            <p>• All transactions will be automatically categorized</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
