"use client"

import React, { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from "@/components/ui/Table"
import { 
  Search, 
  Download, 
  RefreshCw,
  Eye,
  Camera,
  MapPin,
  Clock
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/Toast"

interface DetectionLog {
  id: string
  person: string
  confidence: number
  camera: string
  location: string
  time: string
  status: 'Verified Match' | 'Flagged' | 'Investigating' | 'Low Confidence'
  notes?: string
}

const initialDetections: DetectionLog[] = [
  { id: 'DET-10292', person: 'Aarav Mehta', confidence: 94.2, camera: 'CAM-012', location: 'Marine Drive Promenade', time: '2026-11-18 17:42:01', status: 'Verified Match', notes: 'Positive CCTV face crop identification' },
  { id: 'DET-10291', person: 'Vikram Singh', confidence: 98.8, camera: 'CAM-088', location: 'CST Station Platform 4', time: '2026-11-18 17:35:45', status: 'Verified Match', notes: 'Subject matches red bulletin lead' },
  { id: 'DET-10290', person: 'Priya Sharma', confidence: 78.5, camera: 'CAM-003', location: 'Bandra Station West Gate', time: '2026-11-18 17:28:12', status: 'Investigating', notes: 'Field officer dispatched for verification' },
  { id: 'DET-10289', person: 'Ravi Verma', confidence: 88.1, camera: 'CAM-045', location: 'Colaba Causeway Crossroad', time: '2026-11-18 17:15:50', status: 'Flagged', notes: 'High resemblance in crowd footage' },
  { id: 'DET-10288', person: 'Ananya Roy', confidence: 89.9, camera: 'CAM-201', location: 'Andheri Metro Concourse', time: '2026-11-18 16:50:12', status: 'Verified Match', notes: 'Sighting confirmed by Patrol Unit-042' },
  { id: 'DET-10287', person: 'Unknown Subject', confidence: 42.1, camera: 'CAM-015', location: 'Churchgate Terminal Exit', time: '2026-11-18 16:30:00', status: 'Low Confidence', notes: 'Motion blur below verification threshold' },
]

export default function LogsPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<DetectionLog[]>(initialDetections)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.person.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.camera.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [logs, searchQuery, statusFilter])

  const handleExportCSV = () => {
    const headerStr = 'Event ID,Target Person,Confidence %,Camera,Location,Timestamp,Status\n'
    const rows = filteredLogs.map(
      (l) => `${l.id},"${l.person}",${l.confidence},${l.camera},"${l.location}","${l.time}",${l.status}`
    )
    const blob = new Blob([headerStr + rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `garuda-detection-logs-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast('Detection log CSV exported successfully', 'success')
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AI Detection & Audit Logs</h1>
          <p className="text-sm text-muted-foreground">Comprehensive real-time forensic audit trail of all biometric surveillance events.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs active:scale-[0.98]">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toast('Refreshed audit log feed', 'info')} className="text-xs active:scale-[0.98]">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="pb-4 border-b border-border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="w-full sm:w-80">
              <Input
                placeholder="Search by ID, person, location, or camera..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search logs"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {['ALL', 'Verified Match', 'Investigating', 'Flagged', 'Low Confidence'].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={statusFilter === s ? 'default' : 'secondary'}
                  className="h-8 text-xs active:scale-[0.98]"
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="bg-secondary/80 sticky top-0 backdrop-blur-sm z-10 border-b border-border">
                <TableRow>
                  <TableHead className="w-[120px]">Event ID</TableHead>
                  <TableHead>Target Identity</TableHead>
                  <TableHead>AI Confidence</TableHead>
                  <TableHead>Camera / Location</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                      No detection events found matching your filter criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((det) => (
                    <TableRow key={det.id} className="hover:bg-secondary/20 transition-colors">
                      <TableCell className="font-mono text-xs text-muted-foreground">{det.id}</TableCell>
                      <TableCell className="font-semibold text-sm text-foreground">{det.person}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all",
                                det.confidence >= 90 ? "bg-status-active" : det.confidence >= 70 ? "bg-status-warning" : "bg-status-critical"
                              )} 
                              style={{ width: `${det.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-foreground font-semibold">{det.confidence}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            {det.location}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                            <Camera className="w-3 h-3" />
                            {det.camera}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono tabular-nums">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {det.time}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            det.status === 'Verified Match'
                              ? 'default'
                              : det.status === 'Investigating'
                              ? 'secondary'
                              : det.status === 'Flagged'
                              ? 'outline'
                              : 'destructive'
                          }
                          className="text-[11px]"
                        >
                          {det.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => toast(`Evidence dossier for ${det.person} (${det.id}) opened`, 'info')}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
