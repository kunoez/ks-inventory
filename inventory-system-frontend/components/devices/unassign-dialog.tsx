"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Device } from "@/lib/types"

interface UnassignDialogProps {
  device: Device | null
  employeeName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: { notes: string; condition: Device["condition"] }) => void
}

export function UnassignDialog({ device, employeeName, open, onOpenChange, onConfirm }: UnassignDialogProps) {
  const [notes, setNotes] = useState("")
  const [condition, setCondition] = useState<Device["condition"]>(device?.condition || "good")

  const handleConfirm = () => {
    onConfirm({ notes, condition })
    // Reset form
    setNotes("")
    setCondition(device?.condition || "good")
    onOpenChange(false)
  }

  const handleCancel = () => {
    // Reset form
    setNotes("")
    setCondition(device?.condition || "good")
    onOpenChange(false)
  }

  if (!device) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Unassign Device</DialogTitle>
          <DialogDescription>
            You are about to unassign <strong>{device.name}</strong>
            {employeeName && <> from <strong>{employeeName}</strong></>}.
            Please provide any relevant notes and update the device condition if needed.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="condition">Device Condition</Label>
            <Select value={condition} onValueChange={(value) => setCondition(value as Device["condition"])}>
              <SelectTrigger id="condition">
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Excellent
                  </div>
                </SelectItem>
                <SelectItem value="good">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    Good
                  </div>
                </SelectItem>
                <SelectItem value="fair">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    Fair
                  </div>
                </SelectItem>
                <SelectItem value="poor">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    Poor
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Current condition: <strong className="capitalize">{device.condition}</strong>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Return Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about the device return, condition changes, or issues..."
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Confirm Unassignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}