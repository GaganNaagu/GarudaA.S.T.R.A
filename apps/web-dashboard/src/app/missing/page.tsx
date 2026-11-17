"use client"

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import { Button } from "@/components/ui/Button"
import { 
  UserPlus, 
  Search, 
  MapPin, 
  Calendar, 
  UserSearch,
  Filter,
  MoreVertical,
  ExternalLink,
  ShieldAlert,
  X,
  CheckCircle,
  FileBox,
  ShieldCheck
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/Toast"
import { getMissingPersons, createMissingPerson, uploadMissingPersonImage, searchPerson, massSearch, getCaseEvidence, SightingEvidence } from '@/lib/api'

export default function MissingPersonsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [persons, setPersons] = useState<any[]>([])
  
  const getSafePhotoUrl = (rawPath: string | null) => {
    if (!rawPath) return '';
    if (rawPath.startsWith('http')) return rawPath;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1').replace(/\/api\/v1\/?$/, '');
    let cleanPath = rawPath.replace(/\\/g, '/');
    const uploadsIdx = cleanPath.indexOf('uploads/');
    if (uploadsIdx > -1) {
      cleanPath = cleanPath.substring(uploadsIdx);
    }
    cleanPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `${baseUrl}${cleanPath}`;
  };
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'ACTIVE' | 'FOUND'>('ALL')
  const [formData, setFormData] = useState({
    full_name: '', age: '', gender: '', description: '', last_seen_location: '', last_seen_at: '', priority: 'Normal'
  })
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSearching, setIsSearching] = useState<string | null>(null)
  const [isMassSearching, setIsMassSearching] = useState(false)

  const fetchPersons = async () => {
    try {
      const data = await getMissingPersons()
      const mapped = data.map((p: any) => ({
        id: p.id,
        caseNumber: p.case_number,
        name: p.full_name,
        age: p.age || 'Unknown',
        lastSeen: p.last_seen_location || 'Unknown',
        date: new Date(p.created_at).toLocaleDateString(),
        status: p.status,
        priority: p.priority,
        photoPath: p.photo_path || null,
      }))
      setPersons(mapped)
    } catch (e) {
      toast('Failed to load missing persons', 'error')
    }
  }

  useEffect(() => {
    fetchPersons()
  }, [])

  const filteredPersons = useMemo(() => {
    let result = persons
    if (statusFilter === 'CRITICAL') {
      result = result.filter(p => p.priority === 'Critical' || p.priority === 'URGENT')
    } else if (statusFilter === 'HIGH') {
      result = result.filter(p => p.priority === 'High')
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
      
      toast('New missing person registered and AI embedding generated', 'success')
      setIsModalOpen(false)
      setFormData({ full_name: '', age: '', gender: '', description: '', last_seen_location: '', last_seen_at: '', priority: 'Normal' })
      setFile(null)
      fetchPersons()
    } catch (err) {
      toast('Failed to register missing person', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSearchPerson = async (id: string, name: string) => {
    setIsSearching(id)
    toast(`Initiating AI Vector Search against CCTV database for ${name}...`, 'success')
    try {
      const response = await searchPerson(id)
      if (response.matches_found > 0) {
        toast(`Search complete! Found ${response.matches_found} potential matches. Check Alerts tab.`, 'warning')
      } else {
        toast(`Search complete. No matches found for ${name} in the CCTV database.`, 'success')
      }
    } catch (e) {
      toast(`Search failed for ${name}`, 'error')
    } finally {
      setIsSearching(null)
    }
  }

  const handleMassSearch = async () => {
    setIsMassSearching(true)
    toast('Initiating Mass Vector Search for ALL missing persons...', 'success')
    try {
      const response = await massSearch()
      if (response.matches_found > 0) {
        toast(`Mass Sweep complete! Found ${response.matches_found} new matches. Check Alerts tab.`, 'warning')
      } else {
        toast('Mass Sweep complete. No new matches found.', 'success')
      }
    } catch (e) {
      toast('Mass Search failed', 'error')
    } finally {
      setIsMassSearching(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Missing Persons Registry</h1>
          <p className="text-muted-foreground">Centralized database for active search operations and AI matching.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" size="sm" onClick={handleMassSearch} disabled={isMassSearching}>
            <Search className={`w-4 h-4 mr-2 ${isMassSearching ? 'animate-spin' : ''}`} />
            {isMassSearching ? 'Sweeping DB...' : 'Mass Search All'}
          </Button>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            New Case
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by name, case ID, or last seen location..."
              aria-label="Search by name, case ID, or last seen location"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-md py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/60"
            />
          </div>
        </div>

        {/* Tactical Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1" role="group" aria-label="Filter cases by priority or status">
          <Button
            size="sm"
            variant={statusFilter === 'ALL' ? 'default' : 'secondary'}
            className="text-xs h-8 px-3 rounded-full"
            onClick={() => setStatusFilter('ALL')}
          >
            All Cases ({persons.length})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'CRITICAL' ? 'destructive' : 'secondary'}
            className="text-xs h-8 px-3 rounded-full"
            onClick={() => setStatusFilter('CRITICAL')}
          >
            Critical Priority ({persons.filter(p => p.priority === 'Critical' || p.priority === 'URGENT').length})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'HIGH' ? 'default' : 'secondary'}
            className="text-xs h-8 px-3 rounded-full"
            onClick={() => setStatusFilter('HIGH')}
          >
            High Priority ({persons.filter(p => p.priority === 'High').length})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'ACTIVE' ? 'default' : 'secondary'}
            className="text-xs h-8 px-3 rounded-full"
            onClick={() => setStatusFilter('ACTIVE')}
          >
            Active Search ({persons.filter(p => p.status !== 'Found').length})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'FOUND' ? 'default' : 'secondary'}
            className="text-xs h-8 px-3 rounded-full text-emerald-400"
            onClick={() => setStatusFilter('FOUND')}
          >
            Resolved / Found ({persons.filter(p => p.status === 'Found').length})
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPersons.length === 0 ? (
          <div className="col-span-full text-center py-16 border border-dashed border-border rounded-xl bg-card/30">
            <UserSearch className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" aria-hidden="true" />
            <p className="text-sm font-semibold text-foreground">No matching case records found</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search criteria or priority filter.</p>
          </div>
        ) : (
          filteredPersons.map((person) => {
            const isCritical = person.priority === 'Critical' || person.priority === 'URGENT'
            return (
              <Card key={person.id} className={cn(
                "group overflow-hidden transition-all duration-200 hover:shadow-xl hover:border-primary/50 relative",
                person.status === 'Found' ? "opacity-75 hover:opacity-100 border-emerald-500/30" :
                isCritical ? "border-rose-500/30 shadow-rose-500/5 hover:border-rose-500/60" : "hover:border-primary/40"
              )}>
                <div className="h-48 bg-slate-900 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 z-[1]"></div>
                   {person.photoPath ? (
                     <img
                       src={getSafePhotoUrl(person.photoPath)}
                       alt={person.name}
                       className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                       onError={(e) => {
                         e.currentTarget.onerror = null;
                         (e.currentTarget.parentElement as HTMLElement).innerHTML = '<div class="text-muted-foreground flex flex-col items-center gap-2 opacity-30"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span class="text-[10px] uppercase tracking-widest font-bold">Image unavailable</span></div>';
                       }}
                     />
                   ) : (
                     <div className="text-muted-foreground flex flex-col items-center gap-2 opacity-30">
                       <UserSearch className="w-12 h-12" aria-hidden="true" />
                       <span className="text-[10px] uppercase tracking-widest font-bold">No Photo</span>
                     </div>
                   )}
                   <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                      {person.status === 'Found' ? (
                        <Badge className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold border-none shadow-md">
                          FOUND
                        </Badge>
                      ) : (
                        <Badge variant={isCritical ? 'destructive' : person.priority === 'High' ? 'warning' : 'secondary'}>
                          {person.priority}
                        </Badge>
                      )}
                      <Badge variant="outline" className="bg-black/60 backdrop-blur-md text-white border-white/20 font-mono text-[11px]">
                        {person.caseNumber}
                      </Badge>
                   </div>
                   {isCritical && person.status !== 'Found' && (
                     <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold backdrop-blur-md">
                       <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" aria-hidden="true"></span>
                       URGENT
                     </div>
                   )}
                </div>
              <CardHeader className="pb-2 cursor-pointer" onClick={() => router.push(`/missing/${person.id}`)}>
                <div className="flex items-center justify-between">
                  <CardTitle className={cn("text-xl hover:text-primary transition-colors flex items-center gap-1.5", person.status === 'Found' ? "line-through text-muted-foreground" : "")}>
                    {person.name}
                  </CardTitle>
                  <span className="text-sm font-medium text-muted-foreground">{person.age} Years</span>
                </div>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="w-3 h-3" />
                  Last seen: {person.lastSeen}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 py-3 border-y border-border/50 my-2">
                   <div className="flex-1">
                     <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Report Date</p>
                     <p className="text-xs font-medium flex items-center gap-1 mt-0.5">
                       <Calendar className="w-3 h-3" />
                       {person.date}
                     </p>
                   </div>
                   <div className="flex-1">
                     <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Case Status</p>
                     <p className={cn("text-xs font-bold mt-0.5", person.status === 'Found' ? "text-green-500" : "")}>{person.status}</p>
                   </div>
                </div>
                <div className="flex gap-2 mt-4">
                   <Button 
                     className="flex-1 text-xs" 
                     size="sm" 
                     variant="outline"
                     onClick={() => router.push(`/missing/${person.id}`)}
                   >
                     <FileBox className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                     Evidence Vault
                   </Button>
                   <Button 
                     className="flex-1 text-xs" 
                     size="sm" 
                     variant={person.status === 'Found' ? "secondary" : "default"}
                     onClick={() => handleSearchPerson(person.id, person.name)}
                     disabled={isSearching === person.id || person.status === 'Found'}
                   >
                     {person.status === 'Found' ? (
                       <>
                         <CheckCircle className="w-3.5 h-3.5 mr-2" />
                         Closed
                       </>
                     ) : (
                       <>
                         <Search className={`w-3.5 h-3.5 mr-2 ${isSearching === person.id ? 'animate-spin' : ''}`} />
                         {isSearching === person.id ? 'Searching...' : 'AI Match'}
                       </>
                     )}
                   </Button>
                </div>
              </CardContent>
            </Card>
            )
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
              <div>
                <CardTitle>Register New Case</CardTitle>
                <CardDescription>Upload a reference photo to generate an AI facial embedding.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Full Name *</label>
                    <input required type="text" className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary"
                      value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Age</label>
                    <input type="number" className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary"
                      value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-xs font-medium text-muted-foreground">Gender</label>
                     <select className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary"
                       value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                       <option value="">Select...</option>
                       <option value="Male">Male</option>
                       <option value="Female">Female</option>
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-medium text-muted-foreground">Priority</label>
                     <select className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary"
                       value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                       <option value="Normal">Normal</option>
                       <option value="High">High</option>
                       <option value="URGENT">URGENT</option>
                     </select>
                   </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-xs font-medium text-muted-foreground">Last Seen Location</label>
                     <input type="text" className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary"
                       value={formData.last_seen_location} onChange={e => setFormData({...formData, last_seen_location: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-xs font-medium text-muted-foreground">Last Seen Date & Time</label>
                     <input type="datetime-local" className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary"
                       value={formData.last_seen_at} onChange={e => setFormData({...formData, last_seen_at: e.target.value})} />
                   </div>
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-medium text-muted-foreground">Physical Description</label>
                   <textarea rows={3} placeholder="Height, build, clothing, distinguishing features..." className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary resize-none"
                     value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-medium text-muted-foreground">Reference Photo *</label>
                   <input required type="file" accept="image/*" ref={fileInputRef} onChange={e => setFile(e.target.files?.[0] || null)}
                     className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 bg-secondary/30 rounded-md border border-border p-2" />
                 </div>
                <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing & Extracting Embedding...' : 'Register Case & Run AI Extraction'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
