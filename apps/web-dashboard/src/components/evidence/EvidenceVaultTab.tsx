"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { SightingEvidence, getCaseEvidence, getSafeEvidenceUrl } from '@/lib/api'
import { SightingComparisonCard } from './SightingComparisonCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ShieldAlert, RefreshCw, Filter, CheckCircle2, XCircle, Clock } from 'lucide-react'

interface EvidenceVaultTabProps {
  caseId: string
  person: {
    id: string
    case_number: string
    full_name: string
    photo_path?: string | null
  }
  onEvidenceChange?: (confirmedCount: number) => void
}

export function EvidenceVaultTab({
  caseId,
  person,
  onEvidenceChange,
}: EvidenceVaultTabProps) {
  const [sightings, setSightings] = useState<SightingEvidence[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'Unreviewed' | 'Confirmed' | 'Rejected'>('ALL')

  const fetchEvidence = async () => {
    setIsLoading(true)
    try {
      const data = await getCaseEvidence(caseId)
      setSightings(data)
      const confirmed = data.filter((s) => s.verification_status === 'Confirmed').length
      onEvidenceChange?.(confirmed)
    } catch (err) {
      console.error('Failed to load case evidence:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEvidence()
  }, [caseId])

  const handleStatusUpdated = (updated: SightingEvidence) => {
    setSightings((prev) => {
      const next = prev.map((item) => (item.id === updated.id ? updated : item))
      const confirmed = next.filter((s) => s.verification_status === 'Confirmed').length
      onEvidenceChange?.(confirmed)
      return next
    })
  }

  const filteredSightings = useMemo(() => {
    if (filter === 'ALL') return sightings
    return sightings.filter((s) => s.verification_status === filter)
  }, [sightings, filter])

  const counts = useMemo(() => {
    return {
      total: sightings.length,
      unreviewed: sightings.filter((s) => s.verification_status === 'Unreviewed').length,
      confirmed: sightings.filter((s) => s.verification_status === 'Confirmed').length,
      rejected: sightings.filter((s) => s.verification_status === 'Rejected').length,
    }
  }, [sightings])

  const referencePhotoUrl = getSafeEvidenceUrl(person.photo_path || null)

  return (
    <div className="space-y-6">
      {/* Top Filter and Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-slate-900 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={filter === 'ALL' ? 'default' : 'secondary'}
            className="text-xs h-8"
            onClick={() => setFilter('ALL')}
          >
            All Sightings ({counts.total})
          </Button>

          <Button
            size="sm"
            variant={filter === 'Unreviewed' ? 'default' : 'secondary'}
            className="text-xs h-8 text-amber-300"
            onClick={() => setFilter('Unreviewed')}
          >
            <Clock className="w-3.5 h-3.5 mr-1" />
            Unreviewed ({counts.unreviewed})
          </Button>

          <Button
            size="sm"
            variant={filter === 'Confirmed' ? 'default' : 'secondary'}
            className="text-xs h-8 text-green-300"
            onClick={() => setFilter('Confirmed')}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Confirmed ({counts.confirmed})
          </Button>

          <Button
            size="sm"
            variant={filter === 'Rejected' ? 'default' : 'secondary'}
            className="text-xs h-8 text-red-300"
            onClick={() => setFilter('Rejected')}
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Rejected ({counts.rejected})
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={fetchEvidence}
          disabled={isLoading}
          className="text-xs text-slate-400 hover:text-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Vault
        </Button>
      </div>

      {/* Sighting Cards List */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm font-medium">Loading Evidence Vault artifacts...</p>
        </div>
      ) : filteredSightings.length === 0 ? (
        <div className="py-16 px-6 text-center rounded-lg border border-dashed border-slate-800 bg-slate-900/40">
          <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-slate-200">
            {filter === 'ALL' ? 'No Forensic Evidence Recorded' : `No ${filter} Sightings`}
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            {filter === 'ALL'
              ? 'Run an AI Vector Search or upload CCTV footage to identify potential sightings for this case.'
              : `There are currently no sightings matching the filter "${filter}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSightings.map((sighting) => (
            <SightingComparisonCard
              key={sighting.id}
              sighting={sighting}
              caseNumber={person.case_number}
              personName={person.full_name}
              referencePhotoUrl={referencePhotoUrl}
              onStatusUpdated={handleStatusUpdated}
            />
          ))}
        </div>
      )}
    </div>
  )
}
