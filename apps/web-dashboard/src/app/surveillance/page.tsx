"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { getUploads, deleteUpload, bulkDeleteUploads } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/Toast"
import { CheckCircle2, AlertCircle, Video, Search, Clock, MapPin, Loader2, Trash2, CheckSquare, Square } from 'lucide-react'

export default function SurveillanceHistoryPage() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const { toast } = useToast()
  const [uploads, setUploads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<{ mode: 'single'; id: string; filename: string } | { mode: 'bulk' } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const toggleSelectId = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredUploads.map(u => u.id)
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.has(id))
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredIds))
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      if (deleteTarget.mode === 'single') {
        await deleteUpload(deleteTarget.id)
        toast(`Deleted footage '${deleteTarget.filename}' and related data`, 'success')
        setSelectedIds(prev => {
          const next = new Set(prev)
          next.delete(deleteTarget.id)
          return next
        })
      } else {
        const ids = Array.from(selectedIds)
        await bulkDeleteUploads(ids)
        toast(`Deleted ${ids.length} stored footage(s) and related data`, 'success')
        setSelectedIds(new Set())
      }
      setDeleteTarget(null)
      await fetchUploads()
    } catch (err: any) {
      toast(err?.message || 'Failed to delete stored footage', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Processed Recordings</CardTitle>
              <CardDescription>All footages that have been analyzed by the Face Extraction Engine.</CardDescription>
            </div>
            {isAdmin && selectedIds.size > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-destructive/30 bg-destructive/5">
                <span className="text-xs font-semibold text-foreground">
                  {selectedIds.size} selected
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteTarget({ mode: 'bulk' })}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete Selected ({selectedIds.size})
                </Button>
              </div>
            )}
          </div>
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
                    {isAdmin && (
                      <th className="px-4 py-3 w-10">
                        <button
                          type="button"
                          aria-label="Select all filtered recordings"
                          onClick={toggleSelectAllFiltered}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {filteredUploads.length > 0 && filteredUploads.every(u => selectedIds.has(u.id))
                            ? <CheckSquare className="w-4 h-4 text-primary" />
                            : <Square className="w-4 h-4" />}
                        </button>
                      </th>
                    )}
                    <th className="px-4 py-3">Filename</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Camera / Sector</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Uploaded At</th>
                    {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUploads.map((video) => {
                    const isSelected = selectedIds.has(video.id)
                    return (
                    <tr key={video.id} className={`hover:bg-secondary/20 transition-colors duration-150 ${isSelected ? 'bg-destructive/5' : ''}`}>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            aria-label={`Select ${video.filename}`}
                            onClick={() => toggleSelectId(video.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {isSelected
                              ? <CheckSquare className="w-4 h-4 text-destructive" />
                              : <Square className="w-4 h-4" />}
                          </button>
                        </td>
                      )}
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
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label={`Delete ${video.filename}`}
                            onClick={() => setDeleteTarget({ mode: 'single', id: video.id, filename: video.filename })}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Delete Confirmation Modal */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="footage-delete-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
        >
          <Card className="max-w-md w-full border-destructive/40">
            <CardHeader className="pb-3">
              <CardTitle id="footage-delete-title" className="text-lg flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                {deleteTarget.mode === 'single'
                  ? 'Delete Stored Footage?'
                  : `Delete ${selectedIds.size} Stored Footage(s)?`}
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed pt-1">
                {deleteTarget.mode === 'single'
                  ? `This will permanently delete "${deleteTarget.filename}" along with all extracted face crops, video frames, and linked sighting evidence.`
                  : `This will permanently delete ${selectedIds.size} selected recording(s) along with all extracted face crops, video frames, and linked sighting evidence.`}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
              >
                {isDeleting
                  ? 'Deleting...'
                  : deleteTarget.mode === 'single'
                    ? 'Permanently Delete'
                    : `Permanently Delete (${selectedIds.size})`}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
