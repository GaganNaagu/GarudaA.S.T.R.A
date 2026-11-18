"use client"

import React, { useState } from 'react'
import { X, CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { updateSightingStatus, SightingEvidence } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'

interface VerificationModalProps {
  isOpen: boolean
  sighting: SightingEvidence
  caseNumber: string
  onClose: () => void
  onSuccess: (updated: SightingEvidence) => void
}

export function VerificationModal({
  isOpen,
  sighting,
  caseNumber,
  onClose,
  onSuccess,
}: VerificationModalProps) {
  const { toast } = useToast()
  const [selectedStatus, setSelectedStatus] = useState<'Confirmed' | 'Rejected'>(
    sighting.verification_status === 'Confirmed' ? 'Confirmed' : 'Confirmed'
  )
  const [notes, setNotes] = useState(sighting.review_notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const updated = await updateSightingStatus(sighting.id, selectedStatus, notes)
      toast(
        `Sighting marked as ${selectedStatus} for Case ${caseNumber}`,
        selectedStatus === 'Confirmed' ? 'success' : 'info'
      )
      onSuccess(updated)
      onClose()
    } catch (err: any) {
      toast(err.message || 'Failed to update sighting verification status', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-accent" />
              <CardTitle className="text-lg font-bold">Investigator Sighting Verification</CardTitle>
            </div>
            <CardDescription className="text-xs mt-1">
              Case <span className="font-mono font-semibold text-foreground">{caseNumber}</span> · Sighting ID: {sighting.id.slice(0, 8)}...
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </Button>
        </CardHeader>

        <CardContent className="pt-5 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Action Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Verification Verdict
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedStatus('Confirmed')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                    selectedStatus === 'Confirmed'
                      ? 'bg-status-active/20 border-status-active text-status-active shadow-sm'
                      : 'bg-secondary/40 border-border text-muted-foreground hover:border-border/80'
                  }`}
                >
                  <CheckCircle2 className="w-6 h-6 mb-1.5 text-status-active" />
                  <span>Confirm Match</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Verified subject sighting lead</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus('Rejected')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                    selectedStatus === 'Rejected'
                      ? 'bg-status-critical/20 border-status-critical text-status-critical shadow-sm'
                      : 'bg-secondary/40 border-border text-muted-foreground hover:border-border/80'
                  }`}
                >
                  <XCircle className="w-6 h-6 mb-1.5 text-status-critical" />
                  <span>Reject Match</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Discard false positive</span>
                </button>
              </div>
            </div>

            {/* Metric Snapshot */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-secondary/30 rounded-md border border-border text-center font-mono">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">AI Similarity</p>
                <p className="text-sm font-bold text-accent">{sighting.similarity_score.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Quality (Blur)</p>
                <p className="text-sm font-bold text-foreground">{sighting.quality_score.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Current Status</p>
                <Badge
                  className={`text-[10px] uppercase font-bold mt-0.5 border ${
                    sighting.verification_status === 'Confirmed'
                      ? 'bg-status-active/20 text-status-active border-status-active/30'
                      : sighting.verification_status === 'Rejected'
                      ? 'bg-status-critical/20 text-status-critical border-status-critical/30'
                      : 'bg-status-warning/20 text-status-warning border-status-warning/30'
                  }`}
                >
                  {sighting.verification_status}
                </Badge>
              </div>
            </div>

            {/* Review Notes Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center justify-between">
                <span>Investigator Notes</span>
                <span className="text-[10px] text-muted-foreground lowercase">Audited in ActivityLog</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="State basis for confirmation (e.g. 'Matching facial scar and navy blue hoodie from case report')..."
                className="w-full bg-secondary/30 border border-border rounded-md px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none font-sans"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className={`font-medium active:scale-[0.98] transition-all cursor-pointer ${
                  selectedStatus === 'Confirmed'
                    ? 'bg-status-active hover:bg-status-active/90 text-white'
                    : 'bg-status-critical hover:bg-status-critical/90 text-white'
                }`}
              >
                {isSubmitting ? 'Recording Verification...' : `Submit as ${selectedStatus}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
