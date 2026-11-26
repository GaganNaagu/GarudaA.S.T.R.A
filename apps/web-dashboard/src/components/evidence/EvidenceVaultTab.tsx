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
  initialEvidence?: SightingEvidence[]
  selectedSightingId?: string | null
  onEvidenceChange?: (confirmedCount: number) => void
}

export function EvidenceVaultTab({
  caseId,
  person,
  initialEvidence,
  selectedSightingId,
  onEvidenceChange,
}: EvidenceVaultTabProps) {
  const [sightings, setSightings] = useState<SightingEvidence[]>(initialEvidence || [])
  const [isLoading, setIsLoading] = useState(!initialEvidence || initialEvidence.length === 0)
  const [filter, setFilter] = useState<'ALL' | 'Unreviewed' | 'Confirmed' | 'Rejected'>('ALL')

  const fetchEvidence = async (showSpinner: boolean = true) => {
    if (showSpinner) setIsLoading(true)
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
    if (initialEvidence && initialEvidence.length > 0) {
      setSightings(initialEvidence)
      setIsLoading(false)
      fetchEvidence(false)
    } else {
      fetchEvidence(true)
    }
  }, [caseId])

  useEffect(() => {
    if (initialEvidence && initialEvidence.length > 0) {
      setSightings(initialEvidence)
      setIsLoading(false)
    }
  }, [initialEvidence])

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

  // Automatically adjust filter if selected sighting belongs to another category
  useEffect(() => {
    if (!selectedSightingId || sightings.length === 0) return
    const target = sightings.find((s) => s.id === selectedSightingId)
    if (target && filter !== 'ALL' && target.verification_status !== filter) {
      setFilter('ALL')
    }
  }, [selectedSightingId, sightings, filter])

  // Smooth scroll and focus target card
  useEffect(() => {
    if (!selectedSightingId || isLoading) return
    const timer = setTimeout(() => {
      const element = document.getElementById(`sighting-card-${selectedSightingId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 150)
    return () => clearTimeout(timer)
  }, [selectedSightingId, isLoading, filteredSightings])

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-lg bg-card border border-border">
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
            className="text-xs h-8 text-status-warning"
            onClick={() => setFilter('Unreviewed')}
          >
            <Clock className="w-3.5 h-3.5 mr-1" />
            Unreviewed ({counts.unreviewed})
          </Button>

          <Button
            size="sm"
            variant={filter === 'Confirmed' ? 'default' : 'secondary'}
            className="text-xs h-8 text-status-active"
            onClick={() => setFilter('Confirmed')}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Confirmed ({counts.confirmed})
          </Button>

          <Button
            size="sm"
            variant={filter === 'Rejected' ? 'default' : 'secondary'}
            className="text-xs h-8 text-status-critical"
            onClick={() => setFilter('Rejected')}
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Rejected ({counts.rejected})
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => fetchEvidence(true)}
          disabled={isLoading}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Vault
        </Button>
      </div>

      {/* Sighting Cards List */}
      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading Evidence Vault artifacts...</p>
        </div>
      ) : filteredSightings.length === 0 ? (
        <div className="py-16 px-6 text-center rounded-lg border border-dashed border-border bg-card/30">
          <ShieldAlert className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h4 className="text-base font-semibold text-foreground">
            {filter === 'ALL' ? 'No Forensic Evidence Recorded' : `No ${filter} Sightings`}
          </h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
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
              isHighlighted={sighting.id === selectedSightingId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
