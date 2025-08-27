"use client"

import { useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"

interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  details?: string
  autoClose?: boolean
  autoCloseDelay?: number
}

export function ErrorModal({
  isOpen,
  onClose,
  title,
  message,
  details,
  autoClose = true,
  autoCloseDelay = 5000,
}: ErrorModalProps) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose()
      }, autoCloseDelay)

      return () => clearTimeout(timer)
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-red-900">{title}</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-red-700 mt-2">
            {message}
          </DialogDescription>
          {details && (
            <div className="mt-3 p-3 bg-red-50 rounded-md border-l-4 border-red-200">
              <p className="text-sm text-red-600 font-mono">{details}</p>
            </div>
          )}
        </DialogHeader>

        <div className="flex justify-between items-center mt-4">
          {autoClose && (
            <p className="text-xs text-muted-foreground">
              This message will auto-close in {autoCloseDelay / 1000} seconds
            </p>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
