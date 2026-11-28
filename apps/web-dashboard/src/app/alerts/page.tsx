"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { 
  Clock, 
  ShieldAlert, 
  CheckCircle, 
  XCircle,
  Eye,
  Filter,
  User,
  ArrowUpDown,
  Camera,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'
import { useToast } from "@/components/ui/Toast"
import { getAlerts, updateAlertStatus, API_URL } from '@/lib/api'
import { useWebSocket } from '@/lib/websocket'

function getImageUrl(path: string | null) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = API_URL.replace(/\/api\/v1\/?$/, '');
  let cleanPath = path.replace(/\\/g, '/');
  const uploadsIdx = cleanPath.indexOf('uploads/');
  if (uploadsIdx > -1) {
    cleanPath = cleanPath.substring(uploadsIdx);
  }
  cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `${baseUrl}${cleanPath}`;
}

function mapAlert(a: any) {
  const rawScore = a.detection_event?.confidence_score
  let confText = '—'
  if (rawScore != null) {
    const num = typeof rawScore === 'number' ? rawScore : parseFloat(rawScore)
    confText = `${(num > 1 ? num : num * 100).toFixed(0)}%`
  }

  return {
    id: String(a.id),
    personName: a.missing_person?.full_name ?? 'Unknown Subject',
    caseNumber: a.missing_person?.case_number ?? '—',
    confidence: confText,
    status: a.status === 'pending' || a.status === 'Pending'
      ? 'Pending'
      : a.status === 'Verified' || a.status === 'Confirmed'
      ? 'Verified'
      : a.status === 'Rejected False Positive' || a.status === 'Rejected'
      ? 'Rejected'
      : a.status,
    rawTime: a.created_at,
    time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    camera: a.detection_event?.camera_id
      ? String(a.detection_event.camera_id).substring(0, 8)
      : 'CAM-01',
    cropImagePath: a.detection_event?.image_path ?? null,
    personImagePath: a.missing_person?.photo_path ?? null,
    assignments: a.assignments || [],
  }
}

export default function AlertsPage() {
  const { toast } = useToast()
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pending' | 'Verified' | 'Rejected'>('ALL')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const { lastMessage } = useWebSocket()

  const fetchAlerts = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      const data = await getAlerts()
      setAlerts(prev => {
        const fetched = data.map(mapAlert)
        const fetchedIds = new Set(fetched.map((a: any) => a.id))
        // Preserve any recent optimistic/live alert not yet in backend response
        const uncommitted = prev.filter(a => !fetchedIds.has(a.id))
        return [...uncommitted, ...fetched]
      })
    } catch (err) {
      console.error('Failed to fetch alerts', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts(false)
  }, [fetchAlerts])

  useEffect(() => {
    if (lastMessage && lastMessage.event === 'possible_match_detected') {
      const d = lastMessage.data || (lastMessage.alert_id ? lastMessage : null)
      if (!d || !d.alert_id) {
        setTimeout(() => fetchAlerts(true), 300)
        return
      }
      const rawConf = typeof d.confidence === 'number' ? d.confidence : parseFloat(d.confidence || '0')
      const confPercent = rawConf > 1 ? Math.round(rawConf) : Math.round(rawConf * 100)
      const optimistic = {
        id: String(d.alert_id),
        personName: d.person_name || 'Possible Target Match',
        caseNumber: d.case_number || 'AUTO',
        confidence: `${confPercent}%`,
        status: 'Pending',
        rawTime: new Date().toISOString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        camera: d.camera_id ? String(d.camera_id).substring(0, 16) : 'CAM-LIVE-SECTOR',
        cropImagePath: d.crop_image_path ?? null,
        personImagePath: d.image_path ?? null,
        assignments: [],
      }
      setAlerts(prev => [optimistic, ...prev.filter(a => a.id !== optimistic.id)])
      setTimeout(() => fetchAlerts(true), 1500)
    } else if (lastMessage && lastMessage.event === 'alert_status_updated') {
      const updatedAlert = mapAlert(lastMessage.data)
      setAlerts(prev => prev.map(a => a.id === updatedAlert.id ? updatedAlert : a))
    }
  }, [lastMessage, fetchAlerts])

  const handleConfirm = async (id: string) => {
    try {
      await updateAlertStatus(id, 'Verified')
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'Verified' } : a))
      toast(`Alert confirmed as verified sighting lead`, 'success')
    } catch (err) {
      toast('Failed to confirm alert status', 'error')
    }
  }

  const handleDismiss = async (id: string) => {
    try {
      await updateAlertStatus(id, 'Rejected False Positive')
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'Rejected' } : a))
      toast(`Alert flagged as false positive`, 'warning')
    } catch (err) {
      toast('Failed to dismiss alert', 'error')
    }
  }

  const filteredAlerts = useMemo(() => {
    let result = alerts
    if (statusFilter !== 'ALL') {
      result = result.filter(a => a.status === statusFilter)
    }
    return result.sort((a, b) => {
      const ta = new Date(a.rawTime).getTime()
      const tb = new Date(b.rawTime).getTime()
      return sortDir === 'desc' ? tb - ta : ta - tb
    })
  }, [alerts, statusFilter, sortDir])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Triage Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Active Alert Center</h1>
          <p className="text-xs text-muted-foreground mt-1">
            High-confidence facial similarity matches awaiting verification and response dispatch.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-md border border-border">
            {(['ALL', 'Pending', 'Verified', 'Rejected'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                  statusFilter === tab 
                    ? 'bg-card text-foreground shadow-sm font-semibold' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}
            title="Toggle sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
            {sortDir === 'desc' ? 'Newest' : 'Oldest'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchAlerts(false)}
            aria-label="Refresh alerts"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="py-20 text-center border border-border rounded-xl bg-card">
          <ShieldAlert className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">No alerts match the selected criteria</p>
          <p className="text-xs text-muted-foreground mt-1">All surveillance sectors are operating nominally.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAlerts.map(alert => (
            <Card key={alert.id} className="flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <Badge variant={
                      alert.status === 'Verified' ? 'success' :
                      alert.status === 'Pending' ? 'warning' : 'secondary'
                    }>
                      {alert.status}
                    </Badge>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      #{alert.id.substring(0, 8)}
                    </span>
                  </div>
                  <CardTitle className="text-base text-foreground font-semibold">
                    {alert.personName}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-0.5 font-mono text-[11px]">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    {alert.time} · Camera {alert.camera} · Case {alert.caseNumber}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Clean Side-by-Side Sighting Comparison */}
                  <div className="grid grid-cols-2 gap-2 aspect-[16/9] rounded-lg overflow-hidden bg-secondary/40 border border-border">
                    {/* CCTV Detected Crop */}
                    <div className="relative bg-black/40 flex items-center justify-center overflow-hidden">
                      {alert.cropImagePath ? (
                        <img 
                          src={getImageUrl(alert.cropImagePath)} 
                          alt="CCTV Crop" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <Camera className="w-6 h-6 text-muted-foreground opacity-40" />
                      )}
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-background/80 text-[9px] font-mono font-bold text-muted-foreground uppercase border border-border">
                        Live Sighting
                      </span>
                    </div>

                    {/* Database Photo */}
                    <div className="relative bg-black/40 flex items-center justify-center overflow-hidden">
                      {alert.personImagePath ? (
                        <img 
                          src={getImageUrl(alert.personImagePath)} 
                          alt="Dossier Reference" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <User className="w-6 h-6 text-muted-foreground opacity-40" />
                      )}
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-background/80 text-[9px] font-mono font-bold text-primary uppercase border border-border">
                        {alert.confidence} Match
                      </span>
                    </div>
                  </div>
                </CardContent>
              </div>

              {/* Action Bar (60-30-10 Rule) */}
              <CardFooter className="pt-3">
                {alert.status === 'Pending' ? (
                  <div className="flex items-center gap-2 w-full">
                    <Button 
                      size="sm" 
                      className="flex-1 text-xs" 
                      onClick={() => handleConfirm(alert.id)}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      Confirm Lead
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs" 
                      onClick={() => handleDismiss(alert.id)}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                      Dismiss
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full text-xs text-muted-foreground font-mono">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" />
                      {alert.status === 'Verified' ? 'Lead Confirmed & Dispatched' : 'Flagged False Positive'}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      RESOLVED
                    </Badge>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
