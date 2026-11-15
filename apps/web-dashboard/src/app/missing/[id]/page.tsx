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
  Info
} from 'lucide-react'
import { getMissingPerson, searchPerson, getSafeEvidenceUrl, SightingEvidence, getCaseEvidence } from '@/lib/api'
import { EvidenceVaultTab } from '@/components/evidence/EvidenceVaultTab'

export default function CaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const id = Array.isArray(params.id) ? params.id[0] : (params.id as string)

  const [person, setPerson] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'evidence' | 'overview'>('evidence')
  const [confirmedCount, setConfirmedCount] = useState(0)
  const [isSearching, setIsSearching] = useState(false)

  const fetchCase = async () => {
    setIsLoading(true)
    try {
      const data = await getMissingPerson(id)
      setPerson(data)

      // Check confirmed sightings count
      const evidence = await getCaseEvidence(id)
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
        toast('Search complete. No new matches found.', 'info')
      }
    } catch (err: any) {
      toast(err.message || 'Search execution failed', 'error')
    } finally {
      setIsSearching(false)
    }
  }

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading case dossier...</p>
      </div>
    )
  }

  if (!person) {
    return (
      <div className="py-20 text-center space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Case Not Found</h2>
        <p className="text-xs text-slate-400">The requested missing person case could not be retrieved.</p>
        <Button size="sm" onClick={() => router.push('/missing')}>
          Back to Registry
        </Button>
      </div>
    )
  }

  const photoUrl = getSafeEvidenceUrl(person.photo_path || null)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-slate-400 hover:text-white"
          onClick={() => router.push('/missing')}
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Cases Registry
        </Button>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="text-xs bg-blue-600 hover:bg-blue-500"
            onClick={handleRunSearch}
            disabled={isSearching}
          >
            <Search className={`w-3.5 h-3.5 mr-1.5 ${isSearching ? 'animate-spin' : ''}`} />
            {isSearching ? 'Scanning CCTV Database...' : 'Run AI Match Search'}
          </Button>
        </div>
      </div>

      {/* Case Header Hero Banner */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-800 border-2 border-slate-700 shrink-0">
            {photoUrl ? (
              <img src={photoUrl} alt={person.full_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                <User className="w-8 h-8" />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">{person.full_name}</h1>
              <Badge variant="outline" className="font-mono bg-slate-800 text-slate-200 border-slate-700 text-xs">
                {person.case_number}
              </Badge>
              <Badge
                variant={
                  person.priority === 'URGENT'
                    ? 'destructive'
                    : person.priority === 'High'
                    ? 'warning'
                    : 'secondary'
                }
              >
                {person.priority} PRIORITY
              </Badge>

              {/* Lead Indicator (EVID-03) */}
              {confirmedCount > 0 && (
                <Badge className="bg-green-600 hover:bg-green-500 text-white font-bold flex items-center gap-1.5 shadow-md shadow-green-600/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  CONFIRMED SIGHTING LEAD ({confirmedCount})
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                Last seen: {person.last_seen_location || 'Unknown Location'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Reported: {new Date(person.created_at).toLocaleDateString()}
              </span>
              <span>
                Age: <strong className="text-slate-200">{person.age || 'Unknown'}</strong> · Gender: <strong className="text-slate-200">{person.gender || 'Unknown'}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <Badge variant="outline" className="text-xs bg-slate-950 text-slate-300 border-slate-800 px-3 py-1">
            Status: <span className="font-bold text-white ml-1">{person.status}</span>
          </Badge>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-800 flex items-center gap-4">
        <button
          onClick={() => setActiveTab('evidence')}
          className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'evidence'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileBox className="w-4 h-4" />
          Evidence Vault
          {confirmedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-green-500/20 text-green-400 font-mono">
              {confirmedCount} confirmed
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-2 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Info className="w-4 h-4" />
          Case Overview
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'evidence' ? (
        <EvidenceVaultTab
          caseId={person.id}
          person={person}
          onEvidenceChange={(count) => setConfirmedCount(count)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-900 border-slate-800 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base text-white">Physical & Incident Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-slate-300">
              <p className="leading-relaxed bg-slate-950/60 p-4 rounded-md border border-slate-800">
                {person.description || 'No physical description recorded for this subject.'}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Last Known Location
                  </span>
                  <p className="text-sm font-medium text-slate-200 mt-1">{person.last_seen_location || 'Not reported'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Last Seen Date & Time
                  </span>
                  <p className="text-sm font-medium text-slate-200 mt-1">
                    {person.last_seen_at ? new Date(person.last_seen_at).toLocaleString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-base text-white">Reference Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden bg-slate-950 border border-slate-800 h-64 flex items-center justify-center">
                {photoUrl ? (
                  <img src={photoUrl} alt={person.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-500 text-xs">No Photo Available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
