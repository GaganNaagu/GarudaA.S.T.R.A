"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import {
  Clock,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Camera,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  BellRing,
  Navigation,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  ChevronRight,
  ClipboardList,
  AlertTriangle,
  Info
} from 'lucide-react'
import { 
  getCaseTimeline, 
  TimelineEvent, 
  CaseTimelineResponse,
  getSafeEvidenceUrl 
} from '@/lib/api'

interface InvestigationTimelineTabProps {
  caseId: string
  onNavigateToEvidence?: (sightingId?: string) => void
}

type TimelineCategory = 'all' | 'case' | 'detection' | 'verification' | 'alert' | 'dispatch' | 'audit'

const CATEGORY_TABS: { label: string; value: TimelineCategory; icon: React.ElementType }[] = [
  { label: 'All Events', value: 'all', icon: Clock },
  { label: 'Case Dossier', value: 'case', icon: FileText },
  { label: 'AI Detections', value: 'detection', icon: Camera },
  { label: 'Verifications', value: 'verification', icon: ShieldCheck },
  { label: 'Alerts', value: 'alert', icon: BellRing },
  { label: 'Patrol Dispatch', value: 'dispatch', icon: Navigation },
  { label: 'Audit Log', value: 'audit', icon: ClipboardList },
]

export function InvestigationTimelineTab({
  caseId,
  onNavigateToEvidence
}: InvestigationTimelineTabProps) {
  const { toast } = useToast()
  const [timeline, setTimeline] = useState<CaseTimelineResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [category, setCategory] = useState<TimelineCategory>('all')
  const [order, setOrder] = useState<'asc' | 'desc'>('asc')

  const fetchTimeline = async () => {
    setIsLoading(true)
    try {
      const data = await getCaseTimeline(caseId, category, order)
      setTimeline(data)
    } catch (err: any) {
      toast(err.message || 'Failed to load timeline events', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (caseId) {
      fetchTimeline()
    }
  }, [caseId, category, order])

  const toggleSortOrder = () => {
    setOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))
  }

  const getEventIcon = (event: TimelineEvent) => {
    switch (event.event_type) {
      case 'CASE_CREATED':
        return <FileText className="w-4 h-4 text-primary" />
      case 'LAST_SEEN':
        return <MapPin className="w-4 h-4 text-amber-500" />
      case 'PHOTO_UPLOADED':
        return <ImageIcon className="w-4 h-4 text-cyan-400" />
      case 'SIGHTING_DETECTED':
        return <Camera className="w-4 h-4 text-blue-400" />
      case 'SIGHTING_VERIFIED_CONFIRMED':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />
      case 'SIGHTING_VERIFIED_REJECTED':
        return <ShieldX className="w-4 h-4 text-rose-400" />
      case 'ALERT_GENERATED':
        return <BellRing className="w-4 h-4 text-amber-400 animate-pulse" />
      case 'PATROL_DISPATCHED':
        return <Navigation className="w-4 h-4 text-purple-400" />
      case 'PATROL_COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />
      case 'SYSTEM_AUDIT':
        return <ClipboardList className="w-4 h-4 text-muted-foreground" />
      default:
        return <Info className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'detection':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'verification':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'alert':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'dispatch':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      case 'audit':
        return 'bg-zinc-800 text-zinc-300 border-zinc-700'
      case 'case':
      default:
        return 'bg-primary/10 text-primary border-primary/20'
    }
  }

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts)
      return {
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
        time: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        relative: getRelativeTimeString(d)
      }
    } catch {
      return { date: ts, time: '', relative: '' }
    }
  }

  const getRelativeTimeString = (date: Date) => {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  return (
    <div className="space-y-6">
      {/* Control Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card/60 backdrop-blur-sm border border-border/80 rounded-xl p-4 shadow-sm">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {CATEGORY_TABS.map(tab => {
            const Icon = tab.icon
            const isSelected = category === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => setCategory(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Sort & Action Controls */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSortOrder}
            className="text-xs h-8 gap-1.5 border-border/80"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{order === 'asc' ? 'Chronological (Oldest First)' : 'Reverse (Newest First)'}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchTimeline}
            disabled={isLoading}
            className="h-8 w-8 p-0"
            title="Refresh Timeline"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-24 text-center text-muted-foreground">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-mono tracking-wider">AGGREGATING LIFECYCLE INVESTIGATION EVENTS...</p>
        </div>
      ) : !timeline || timeline.events.length === 0 ? (
        <Card className="border-border/60 bg-card/40">
          <CardContent className="py-16 text-center space-y-3">
            <Clock className="w-10 h-10 text-muted-foreground/40 mx-auto" />
            <h3 className="text-sm font-semibold text-foreground">No Timeline Events Recorded</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No investigation lifecycle events match the selected filter category ({category}). New detections, surveillance sightings, and alerts will automatically appear here.
            </p>
            {category !== 'all' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCategory('all')}
                className="mt-2 text-xs"
              >
                Reset to All Events
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="relative pl-6 md:pl-8 before:absolute before:left-[17px] md:before:left-[21px] before:top-3 before:bottom-3 before:w-[2px] before:bg-border/60">
          <div className="space-y-6">
            {timeline.events.map((event, idx) => {
              const formattedTime = formatTimestamp(event.timestamp)
              const link = event.link
              const cropUrl = link?.crop_image_path ? getSafeEvidenceUrl(link.crop_image_path) : null

              return (
                <div key={event.id || idx} className="relative group">
                  {/* Timeline Node Point */}
                  <div className="absolute -left-[27px] md:-left-[31px] top-1.5 w-6 h-6 rounded-full bg-card border-2 border-border/80 flex items-center justify-center shadow-sm group-hover:border-primary group-hover:scale-110 transition-all z-10">
                    {getEventIcon(event)}
                  </div>

                  {/* Event Card Container */}
                  <div className="bg-card/70 hover:bg-card border border-border/70 hover:border-border rounded-xl p-4 transition-all shadow-sm">
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {event.title}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] uppercase font-mono tracking-wider ${getCategoryBadgeClass(event.category)}`}
                        >
                          {event.category}
                        </Badge>
                        {event.confidence !== null && event.confidence !== undefined && (
                          <Badge variant="outline" className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border-blue-500/20">
                            {event.confidence.toFixed(1)}% Match
                          </Badge>
                        )}
                        {event.severity && (
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-mono ${
                              event.severity.toLowerCase() === 'high' || event.severity.toLowerCase() === 'critical'
                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                : event.severity.toLowerCase() === 'medium'
                                ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {event.severity}
                          </Badge>
                        )}
                      </div>

                      {/* Timestamp & Relative Label */}
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono text-foreground/90 font-medium">
                          {formattedTime.date} {formattedTime.time}
                        </div>
                        {formattedTime.relative && (
                          <div className="text-[11px] text-muted-foreground">
                            {formattedTime.relative}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {event.description}
                    </p>

                    {/* Metadata Strip or Location */}
                    {event.actor && (
                      <div className="mt-2 text-[11px] text-muted-foreground/80 flex items-center gap-1 font-mono">
                        <span>Logged By:</span>
                        <span className="text-foreground/80 font-medium">{event.actor}</span>
                      </div>
                    )}

                    {/* Attachment / Crop Preview & Deep Link Actions */}
                    {(cropUrl || link) && (
                      <div className="mt-3.5 pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-3">
                        {cropUrl ? (
                          <div
                            className="flex items-center gap-3 cursor-pointer group/crop hover:opacity-90 transition-opacity"
                            onClick={() => {
                              if (link?.sighting_id && onNavigateToEvidence) {
                                onNavigateToEvidence(link.sighting_id)
                              }
                            }}
                            title="Click to inspect this crop in Evidence Vault"
                          >
                            <div className="w-12 h-12 rounded-lg border border-border/80 overflow-hidden bg-muted/40 shrink-0 group-hover/crop:border-primary transition-colors">
                              <img
                                src={cropUrl}
                                alt="Detection Evidence Crop"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  ;(e.target as HTMLElement).style.display = 'none'
                                }}
                              />
                            </div>
                            <div className="text-xs space-y-0.5">
                              <div className="font-medium text-foreground group-hover/crop:text-primary transition-colors flex items-center gap-1.5">
                                <span>Facial Crop Snapshot</span>
                                <ChevronRight className="w-3 h-3 text-muted-foreground group-hover/crop:translate-x-0.5 transition-transform" />
                              </div>
                              <div className="text-[11px] text-muted-foreground font-mono">
                                {link?.camera_name || 'Surveillance Node'}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground font-mono">
                            {link?.location_name && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-primary" />
                                {link.location_name}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Interactive Deep-Link Buttons */}
                        <div className="flex items-center gap-2 ml-auto">
                          {link?.type === 'evidence' && link.sighting_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                              onClick={() => {
                                if (onNavigateToEvidence) {
                                  onNavigateToEvidence(link.sighting_id!)
                                }
                              }}
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>View in Vault</span>
                            </Button>
                          )}

                          {link?.type === 'map' && link.latitude && link.longitude && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 gap-1.5 border-border/80 hover:bg-muted"
                              onClick={() => {
                                window.open(
                                  `/map?lat=${link.latitude}&lng=${link.longitude}&label=${encodeURIComponent(link.camera_name || 'Sighting Location')}`,
                                  '_blank'
                                )
                              }}
                            >
                              <MapPin className="w-3 h-3 text-amber-500" />
                              <span>Patrol Map</span>
                              <ExternalLink className="w-2.5 h-2.5 text-muted-foreground" />
                            </Button>
                          )}

                          {link?.type === 'alert' && link.alert_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 gap-1.5 border-border/80 hover:bg-muted"
                              onClick={() => {
                                window.open(`/alerts?id=${link.alert_id}`, '_blank')
                              }}
                            >
                              <BellRing className="w-3 h-3 text-amber-400" />
                              <span>Alert Center</span>
                              <ExternalLink className="w-2.5 h-2.5 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
