"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { 
  UserPlus, 
  Search, 
  MapPin, 
  Calendar, 
  UserSearch, 
  ArrowRight,
  ShieldAlert,
  FolderOpen,
  Filter,
  X
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from "@/components/ui/Toast"
import { 
  getMissingPersons, 
  createMissingPerson, 
  uploadMissingPersonImage, 
  API_URL 
} from "@/lib/api"

function getSafePhotoUrl(path: string | null) {
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

export default function MissingPersonsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [persons, setPersons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CRITICAL' | 'FOUND'>('ACTIVE')
  
  // Registration Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: 'Male',
    description: '',
    last_seen_location: '',
    last_seen_at: '',
    priority: 'Normal'
  })
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchPersons = async () => {
    try {
      setLoading(true)
      const data = await getMissingPersons()
      setPersons(data.map((p: any) => ({
        id: String(p.id),
        name: p.full_name,
        caseNumber: p.case_number,
        age: p.age,
        gender: p.gender,
        lastSeen: p.last_seen_location || 'Sector Unknown',
        date: p.last_seen_at ? new Date(p.last_seen_at).toLocaleDateString() : 'Recent',
        status: p.status || 'Active',
        priority: p.priority || 'Normal',
        photoPath: p.photo_path
      })))
    } catch (err) {
      console.error(err)
      toast('Failed to load missing persons cases', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPersons()
  }, [])

  const filteredPersons = useMemo(() => {
    let result = persons
    if (statusFilter === 'CRITICAL') {
      result = result.filter(p => p.priority === 'Critical' || p.priority === 'URGENT')
    } else if (statusFilter === 'ACTIVE') {
      result = result.filter(p => p.status !== 'Found')
    } else if (statusFilter === 'FOUND') {
      result = result.filter(p => p.status === 'Found')
    }

    if (!searchQuery.trim()) return result
    const q = searchQuery.toLowerCase()
    return result.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.caseNumber.toLowerCase().includes(q) ||
      p.lastSeen.toLowerCase().includes(q)
    )
  }, [searchQuery, persons, statusFilter])

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const newPerson = await createMissingPerson({
        ...formData,
        age: parseInt(formData.age) || null,
        last_seen_at: formData.last_seen_at ? new Date(formData.last_seen_at).toISOString() : null,
        description: formData.description || null
      })
      if (file) {
        await uploadMissingPersonImage(newPerson.id, file)
      }
      toast('Case registered and biometric vector embedded', 'success')
      setIsModalOpen(false)
      setFormData({ full_name: '', age: '', gender: 'Male', description: '', last_seen_location: '', last_seen_at: '', priority: 'Normal' })
      setFile(null)
      fetchPersons()
    } catch (err) {
      toast('Failed to register case record', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Missing Persons Registry</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Central repository of active investigations, facial reference vectors, and forensic dossiers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={() => setIsModalOpen(true)} size="sm">
            <UserPlus className="w-4 h-4 mr-2" />
            Register Case
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-secondary/40 p-1 rounded-md border border-border w-fit">
          {[
            { id: 'ACTIVE', label: `Active (${persons.filter(p => p.status !== 'Found').length})` },
            { id: 'CRITICAL', label: 'Critical' },
            { id: 'FOUND', label: 'Resolved / Found' },
            { id: 'ALL', label: 'All Cases' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1 text-xs rounded font-medium transition-colors cursor-pointer ${
                statusFilter === tab.id 
                  ? 'bg-card text-foreground shadow-sm font-semibold' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-full md:w-80">
          <Input
            icon={<Search className="w-4 h-4" />}
            type="text"
            placeholder="Search by name, case #, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Case Dossier Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-20 text-muted-foreground">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredPersons.length === 0 ? (
        <div className="py-20 text-center border border-border rounded-xl bg-card">
          <UserSearch className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">No case records found</p>
          <p className="text-xs text-muted-foreground mt-1">Try modifying your filter or search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPersons.map(person => {
            const isCritical = person.priority === 'Critical' || person.priority === 'URGENT'
            const isFound = person.status === 'Found'
            const photoUrl = getSafePhotoUrl(person.photoPath)

            return (
              <Card 
                key={person.id} 
                className="flex flex-col justify-between hover:border-border transition-colors group cursor-pointer"
                onClick={() => router.push(`/missing/${person.id}`)}
              >
                <div>
                  {/* Clean Photographic Surface with Single Subtle Badge */}
                  <div className="h-44 bg-secondary/50 relative overflow-hidden flex items-center justify-center border-b border-border/40">
                    {photoUrl ? (
                      <img 
                        src={photoUrl} 
                        alt={person.name} 
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200" 
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground opacity-40">
                        <UserSearch className="w-8 h-8" />
                        <span className="text-[10px] font-mono">No Photo Uploaded</span>
                      </div>
                    )}
                    
                    <div className="absolute top-2.5 left-2.5">
                      <Badge variant={isFound ? "success" : isCritical ? "destructive" : "secondary"}>
                        {isFound ? 'RESOLVED' : `${person.priority} PRIORITY`}
                      </Badge>
                    </div>

                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-background/80 text-[10px] font-mono text-muted-foreground border border-border/60 backdrop-blur-sm">
                      {person.caseNumber}
                    </div>
                  </div>

                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors flex items-center justify-between">
                      <span>{person.name}</span>
                      <span className="text-xs text-muted-foreground font-normal font-mono">{person.age ? `${person.age} Yrs` : '—'}</span>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Last seen: {person.lastSeen}</span>
                    </CardDescription>
                  </CardHeader>
                </div>

                <CardFooter className="pt-2">
                  <div className="flex items-center justify-between w-full text-xs text-muted-foreground font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {person.date}
                    </span>
                    <span className="text-primary font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      View Dossier
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {/* Case Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <Card className="max-w-lg w-full">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Register Missing Person Case</CardTitle>
                <CardDescription>Creates an active investigation record and generates facial recognition vectors.</CardDescription>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <form onSubmit={handleAddSubmit}>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Full Legal Name</label>
                  <Input 
                    required 
                    value={formData.full_name} 
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })} 
                    placeholder="e.g. Aarav Sharma" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Age</label>
                    <Input 
                      type="number" 
                      value={formData.age} 
                      onChange={e => setFormData({ ...formData, age: e.target.value })} 
                      placeholder="e.g. 24" 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground block mb-1">Priority Level</label>
                    <select 
                      value={formData.priority}
                      onChange={e => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full h-9 rounded-md border border-border bg-secondary/40 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Last Seen Location</label>
                  <Input 
                    value={formData.last_seen_location} 
                    onChange={e => setFormData({ ...formData, last_seen_location: e.target.value })} 
                    placeholder="e.g. Sector 4 Central Bus Terminal" 
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Reference Portrait Image</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => setFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-secondary file:text-foreground hover:file:bg-secondary/80" 
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? 'Registering...' : 'Register Dossier'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
