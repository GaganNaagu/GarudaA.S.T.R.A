"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  UserSearch, 
  ShieldAlert, 
  ShieldCheck, 
  Search, 
  FileBox, 
  User,
  Info,
  Clock
} from 'lucide-react'
import { getMissingPerson, searchPerson, getSafeEvidenceUrl, SightingEvidence, getCaseEvidence } from '@/lib/api'
import { EvidenceVaultTab } from '@/components/evidence/EvidenceVaultTab'
import { InvestigationTimelineTab } from '@/components/timeline/InvestigationTimelineTab'

export default function CaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string)

  const [person, setPerson] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'evidence' | 'timeline' | 'overview'>('evidence')
  const [evidenceList, setEvidenceList] = useState<SightingEvidence[]>([])
  const [selectedSightingId, setSelectedSightingId] = useState<string | null>(null)
  const [confirmedCount, setConfirmedCount] = useState(0)
  const [isSearching, setIsSearching] = useState(false)

  const fetchCase = async () => {
    setIsLoading(true)
    try {
      const data = await getMissingPerson(id)
      setPerson(data)

      const evidence = await getCaseEvidence(id)
      setEvidenceList(evidence)
      const confirmed = evidence.filter((s: SightingEvidence) => s.verification_status === 'Confirmed').length
      setConfirmedCount(confirmed)
    } catch (err) {
      toast('Failed to load case details', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchCase()
    }
  }, [id])

  const handleRunSearch = async () => {
    if (!person) return
    setIsSearching(true)
    toast(`Running AI Facial Similarity Search for ${person.full_name}...`, 'info')
    try {
      const res = await searchPerson(person.id)
      if (res.matches_found > 0) {
        toast(`Search complete! Found ${res.matches_found} candidate sightings. Check Evidence Vault.`, 'success')
        fetchCase()
      } else {
        toast('Search complete. No new matches found in video database.', 'info')
      }
    } catch (err: any) {
      toast(err.message || 'Search execution failed', 'error')
    } finally {
      setIsSearching(false)
    }
  }

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-mono">Loading case dossier...</p>
      </div>
    )
  }

  if (!person) {
    return (
      <div className="py-20 text-center space-y-4 max-w-md mx-auto">
        <ShieldAlert className="w-10 h-10 text-destructive mx-auto" />
        <h2 className="text-lg font-bold text-foreground">Case Not Found</h2>
        <p className="text-xs text-muted-foreground">The requested case dossier could not be retrieved from the central archive.</p>
        <Button size="sm" onClick={() => router.push('/missing')}>
          Back to Registry
        </Button>
      </div>
    )
  }

  const photoUrl = getSafeEvidenceUrl(person.photo_path || null)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => router.push('/missing')}
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Case Registry
        </Button>

        <Button
          size="sm"
          onClick={handleRunSearch}
          disabled={isSearching}
        >
          <Search className={`w-3.5 h-3.5 mr-1.5 ${isSearching ? 'animate-spin' : ''}`} />
          {isSearching ? 'Scanning CCTV Archive...' : 'Scan Video Archive'}
        </Button>
      </div>

      {/* Case Header Dossier Card */}
      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary border border-border shrink-0 flex items-center justify-center">
              {photoUrl ? (
                <img src={photoUrl} alt={person.full_name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-muted-foreground opacity-40" />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{person.full_name}</h1>
                <Badge variant="outline" className="font-mono text-xs">
                  {person.case_number}
                </Badge>
                <Badge
                  variant={
                    person.priority === 'URGENT' || person.priority === 'Critical'
                      ? 'destructive'
                      : person.priority === 'High'
                      ? 'warning'
                      : 'secondary'
                  }
                >
                  {person.priority} PRIORITY
                </Badge>

                {confirmedCount > 0 && (
                  <Badge variant="success">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    CONFIRMED SIGHTINGS ({confirmedCount})
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  Last seen: {person.last_seen_location || 'Unknown Location'}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  Reported: {new Date(person.created_at).toLocaleDateString()}
                </span>
                <span>
                  Age: <strong className="text-foreground">{person.age || '—'}</strong> · Gender: <strong className="text-foreground">{person.gender || '—'}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <Badge variant="outline" className="text-xs px-3 py-1 font-mono">
              Status: <span className="font-bold text-foreground ml-1">{person.status}</span>
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <div className="border-b border-border flex items-center gap-4" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'evidence'}
          onClick={() => {
            setSelectedSightingId(null)
            setActiveTab('evidence')
          }}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'evidence'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileBox className="w-4 h-4" />
          Evidence Vault ({confirmedCount > 0 ? `${confirmedCount} Confirmed` : 'Sightings'})
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'timeline'}
          onClick={() => setActiveTab('timeline')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'timeline'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Clock className="w-4 h-4" />
          Investigation Timeline
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Info className="w-4 h-4" />
          Case Notes & Profile
        </button>
      </div>

      {/* Active Tab View */}
      {activeTab === 'evidence' ? (
        <EvidenceVaultTab
          caseId={id}
          person={{
            id: person.id,
            case_number: person.case_number,
            full_name: person.full_name,
            photo_path: person.photo_path,
          }}
          initialEvidence={evidenceList}
          selectedSightingId={selectedSightingId}
          onEvidenceChange={(count) => setConfirmedCount(count)}
        />
      ) : activeTab === 'timeline' ? (
        <InvestigationTimelineTab
          caseId={id}
          onNavigateToEvidence={(sightingId) => {
            setSelectedSightingId(sightingId || null)
            setActiveTab('evidence')
          }}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Forensic Case Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Subject Description</h4>
              <p className="text-foreground leading-relaxed">
                {person.description || 'No physical identifying marks or clothing description recorded for this subject.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
