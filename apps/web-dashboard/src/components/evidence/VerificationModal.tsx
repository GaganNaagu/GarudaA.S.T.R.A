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
        className="w-full max-w-lg bg-slate-900 border-slate-700 shadow-2xl text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <CardTitle className="text-lg font-bold">Investigator Sighting Verification</CardTitle>
            </div>
            <CardDescription className="text-slate-400 text-xs mt-1">
              Case <span className="font-mono font-semibold text-slate-200">{caseNumber}</span> · Sighting ID: {sighting.id.slice(0, 8)}...
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="pt-5 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Action Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Verification Verdict
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedStatus('Confirmed')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all ${
                    selectedStatus === 'Confirmed'
                      ? 'bg-green-500/20 border-green-500 text-green-300 shadow-lg shadow-green-500/10'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <CheckCircle2 className="w-6 h-6 mb-1.5 text-green-400" />
                  <span>Confirm Match</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Verified subject sighting lead</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStatus('Rejected')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all ${
                    selectedStatus === 'Rejected'
                      ? 'bg-red-500/20 border-red-500 text-red-300 shadow-lg shadow-red-500/10'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <XCircle className="w-6 h-6 mb-1.5 text-red-400" />
                  <span>Reject Match</span>
                  <span className="text-[10px] text-slate-400 mt-0.5">Discard false positive</span>
                </button>
              </div>
            </div>

            {/* Metric Snapshot */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/60 rounded-md border border-slate-800 text-center font-mono">
              <div>
                <p className="text-[10px] text-slate-500 uppercase">AI Similarity</p>
                <p className="text-sm font-bold text-blue-400">{sighting.similarity_score.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Quality (Blur)</p>
                <p className="text-sm font-bold text-slate-200">{sighting.quality_score.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase">Current Status</p>
                <Badge
                  className={`text-[10px] uppercase font-bold mt-0.5 border ${
                    sighting.verification_status === 'Confirmed'
                      ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : sighting.verification_status === 'Rejected'
                      ? 'bg-red-500/20 text-red-400 border-red-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {sighting.verification_status}
                </Badge>
              </div>
            </div>

            {/* Review Notes Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Investigator Notes</span>
                <span className="text-[10px] text-slate-500 lowercase">Audited in ActivityLog</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="State basis for confirmation (e.g. 'Matching facial scar and navy blue hoodie from case report')..."
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-sans"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className={
                  selectedStatus === 'Confirmed'
                    ? 'bg-green-600 hover:bg-green-500 text-white font-medium'
                    : 'bg-red-600 hover:bg-red-500 text-white font-medium'
                }
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
