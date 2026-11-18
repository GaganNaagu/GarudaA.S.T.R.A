"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Input } from "@/components/ui/Input"
import { getUploads } from "@/lib/api"
import { CheckCircle2, AlertCircle, Video, Search, Clock, MapPin, Loader2 } from 'lucide-react'

export default function SurveillanceHistoryPage() {
  const [uploads, setUploads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchUploads()
  }, [])

  const fetchUploads = async () => {
    try {
      setLoading(true)
      const data = await getUploads()
      setUploads(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filteredUploads = uploads.filter(u => 
    u.filename.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.camera_id && u.camera_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.sector && u.sector.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Footage Archive</h1>
          <p className="text-sm text-muted-foreground">Browse and review all historically processed CCTV videos.</p>
        </div>
        
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search by name, camera, sector..."
            aria-label="Search recordings by name, camera, or sector"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle>Processed Recordings</CardTitle>
          <CardDescription>All footages that have been analyzed by the Face Extraction Engine.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" aria-label="Loading recordings" />
            </div>
          ) : filteredUploads.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Video className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No video records found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-secondary/80 sticky top-0 backdrop-blur-sm z-10 border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Filename</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Camera / Sector</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Uploaded At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUploads.map((video) => (
                    <tr key={video.id} className="hover:bg-secondary/20 transition-colors duration-150">
                      <td className="px-4 py-3 font-medium flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                          <Video className="w-4 h-4 text-primary" />
                        </div>
                        <span className="truncate max-w-[200px] font-mono text-xs text-foreground">{video.filename}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={video.status === 'COMPLETED' ? 'default' : video.status === 'ERROR' ? 'destructive' : 'secondary'}>
                          {video.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
                          {video.status === 'ERROR' && <AlertCircle className="w-3 h-3 mr-1 inline" />}
                          {video.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-foreground">{video.camera_id || 'Unknown Camera'}</span>
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {video.sector || 'Unassigned Sector'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={video.priority === 'URGENT' ? 'border-status-critical/40 text-status-critical bg-status-critical/10' : ''}>
                          {video.priority}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs tabular-nums">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {new Date(video.uploaded_at).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
