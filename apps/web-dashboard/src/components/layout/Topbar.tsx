"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Bell, Clock, Globe, Shield, Menu } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter()
  const { toast } = useToast()
  // useAuth removed since we no longer display user info here
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour12: false, timeZone: 'Asia/Kolkata' }))
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      toast(`Searching for "${searchQuery}"...`, 'info')
      setSearchQuery('')
    }
  }

  return (
    <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 backdrop-blur-md bg-card/90">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          aria-label="Toggle navigation menu"
          className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative max-w-md w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <input 
            type="text" 
            placeholder="Search surveillance records..." 
            aria-label="Search surveillance records"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full bg-secondary/70 border border-border rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/60"
          />
        </div>
        
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono text-muted-foreground">
          <div className="flex items-center gap-2 px-3 py-1 bg-secondary/60 rounded-full border border-border/80">
            <Globe className="w-3 h-3 text-primary" aria-hidden="true" />
            <span>SYSTEM TIME (IST): {currentTime || '—'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-secondary/60 rounded-full border border-border/80">
            <Shield className="w-3 h-3 text-emerald-400" aria-hidden="true" />
            <span className="text-emerald-400 font-semibold">STATUS: SECURE</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/alerts')}
          aria-label="View live alerts"
          className="p-2 hover:bg-secondary rounded-full transition-colors relative cursor-pointer text-muted-foreground hover:text-foreground"
          title="View Live Alerts"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-card animate-pulse" aria-hidden="true"></span>
        </button>
        <button
          onClick={() => toast('Activity timeline coming soon', 'info')}
          aria-label="Activity timeline"
          className="p-2 hover:bg-secondary rounded-full transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
          title="Activity Timeline"
        >
          <Clock className="w-5 h-5" />
        </button>
        
        <div className="h-6 w-[1px] bg-border mx-1" aria-hidden="true"></div>
      </div>
    </header>
  )
}
