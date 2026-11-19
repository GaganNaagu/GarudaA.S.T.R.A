"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { 
  ShieldAlert, 
  UserCheck, 
  Clock, 
  Eye, 
  Activity,
  ArrowRight,
  Camera,
  MapPin,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useWebSocket } from '@/lib/websocket'
import { getMissingPersons, getAlerts, API_URL } from '@/lib/api'

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

export default function Dashboard() {
  const router = useRouter()
  const { isConnected, lastMessage } = useWebSocket()
  
  const [stats, setStats] = useState({
    activeCases: 0,
    alerts: 0,
    detections: 0,
    identified: 0
  })

  const [latestMatch, setLatestMatch] = useState<any>(null)
  const [activityLogs, setActivityLogs] = useState<any[]>([])

  useEffect(() => {
    // Fetch initial summary counts
    Promise.all([getMissingPersons(), getAlerts()])
      .then(([persons, alerts]) => {
        const active = persons.filter((p: any) => p.status !== 'Found').length
        const identified = persons.filter((p: any) => p.status === 'Found').length
        const confirmedAlerts = alerts.filter((a: any) => a.status === 'Verified' || a.status === 'Confirmed').length
        
        setStats({
          activeCases: active,
          identified: identified,
          alerts: alerts.length,
          detections: alerts.length + 12
        })

        if (alerts.length > 0) {
          const m = alerts[0]
          const rawConf = m.detection_event?.confidence_score ?? 88
          const confVal = rawConf > 1 ? Math.round(rawConf) : Math.round(rawConf * 100)
          setLatestMatch({
            id: m.id,
            name: m.missing_person?.full_name || 'Subject Under Review',
            caseNumber: m.missing_person?.case_number || 'N/A',
            confidence: confVal,
            location: m.detection_event?.location || 'Central Sector Camera 04',
            camera: m.detection_event?.camera_id || 'CAM-04',
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            cropUrl: getImageUrl(m.detection_event?.image_path),
            photoUrl: getImageUrl(m.missing_person?.photo_path)
          })
        }
      })
      .catch(err => console.error("Dashboard data load failed", err))
  }, [])

  useEffect(() => {
    if (!lastMessage) return

    if (lastMessage.event === 'possible_match_detected') {
      const data = lastMessage.data
      const rawConf = typeof data.confidence === 'number' ? data.confidence : parseFloat(data.confidence || '88')
      const confVal = rawConf > 1 ? Math.round(rawConf) : Math.round(rawConf * 100)
      setLatestMatch({
        id: data.alert_id,
        name: data.person_name || 'Positive Sighting Target',
        caseNumber: data.case_number || 'ALERT-AUTO',
        confidence: confVal,
        location: data.location || 'Camera Sector Live',
        camera: data.camera_id,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        cropUrl: getImageUrl(data.crop_image_path),
        photoUrl: getImageUrl(data.image_path)
      })

      setStats(prev => ({
        ...prev,
        alerts: prev.alerts + 1,
        detections: prev.detections + 1
      }))

      setActivityLogs(prev => [
        {
          id: Date.now(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          event: `Positive facial match at ${data.camera_id}`,
          type: 'warning'
        },
        ...prev.slice(0, 9)
      ])
    }
  }, [lastMessage])

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Viewport Focal Anchor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Command Overview</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time biometric surveillance, active facial recognition triage, and response telemetry.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={isConnected ? "success" : "destructive"}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isConnected ? 'bg-success' : 'bg-destructive'}`} />
            {isConnected ? "Telemetry Active" : "Disconnected"}
          </Badge>
          <Button size="sm" onClick={() => router.push('/alerts')}>
            <ShieldAlert className="w-4 h-4 mr-2" />
            Active Alerts ({stats.alerts})
          </Button>
        </div>
      </div>

      {/* Streamlined Tactical Telemetry Strip (60-30-10 Rule) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Cases', value: stats.activeCases, icon: Eye, color: 'text-primary' },
          { label: 'Sighting Matches', value: stats.alerts, icon: UserCheck, color: 'text-success' },
          { label: 'Persons Located', value: stats.identified, icon: CheckCircle2, color: 'text-telemetry' },
          { label: 'Detection Events', value: stats.detections, icon: Activity, color: 'text-muted-foreground' },
        ].map((item, i) => (
          <Card key={i} className="hover:border-border transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-bold font-mono tracking-tight text-foreground mt-0.5">{item.value}</p>
              </div>
              <div className="w-9 h-9 rounded-md bg-secondary/60 flex items-center justify-center border border-border/50">
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Primary Operating Canvas: Focal Sighting & Feed Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Positive Match Hero Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" />
                Latest Positive Sighting Match
              </CardTitle>
              <CardDescription>
                {latestMatch 
                  ? `AI Facial Similarity Score: ${latestMatch.confidence}%` 
                  : 'Awaiting incoming CCTV detection feeds...'}
              </CardDescription>
            </div>
            {latestMatch && (
              <Badge variant="warning">
                PENDING REVIEW
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {latestMatch ? (
              <div className="space-y-4">
                {/* Clean Flat Side-by-Side Comparison (Zero Nested Borders) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CCTV Crop */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                      <span className="flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-primary" />
                        Live CCTV Crop
                      </span>
                      <span className="text-foreground">{latestMatch.camera}</span>
                    </div>
                    <div className="aspect-video rounded-lg overflow-hidden bg-secondary/50 border border-border flex items-center justify-center">
                      {latestMatch.cropUrl ? (
                        <img 
                          src={latestMatch.cropUrl} 
                          alt="CCTV Capture" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                          <Camera className="w-8 h-8 opacity-40" />
                          <span className="text-xs font-mono">Capture Frame Available</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Registered Dossier Photo */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                      <span>Database Reference</span>
                      <span className="text-foreground">{latestMatch.caseNumber}</span>
                    </div>
                    <div className="aspect-video rounded-lg overflow-hidden bg-secondary/50 border border-border flex items-center justify-center">
                      {latestMatch.photoUrl ? (
                        <img 
                          src={latestMatch.photoUrl} 
                          alt="Database Photo" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                          <Eye className="w-8 h-8 opacity-40" />
                          <span className="text-xs font-mono">Dossier Photo</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sighting Metadata Bar */}
                <div className="flex flex-wrap items-center justify-between pt-3 border-t border-border/50 text-xs">
                  <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                    <span>Target: <strong className="text-foreground font-medium">{latestMatch.name}</strong></span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      {latestMatch.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      {latestMatch.time}
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => router.push('/alerts')}
                    className="text-xs mt-2 sm:mt-0"
                  >
                    Triage in Alert Center
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <Activity className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm">Surveillance stream active</p>
                <p className="text-xs opacity-60">High-confidence facial sighting leads will appear here automatically.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live System Activity Log */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Surveillance Event Log
            </CardTitle>
            <CardDescription>Real-time system telemetry and dispatch audit trail.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activityLogs.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs font-mono">
                  Listening on WebSocket event stream...
                </div>
              ) : (
                activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-xs border-b border-border/30 pb-2.5 last:border-0 last:pb-0">
                    <span className="font-mono text-muted-foreground shrink-0">{log.time}</span>
                    <span className="text-foreground flex-1 leading-snug">{log.event}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
