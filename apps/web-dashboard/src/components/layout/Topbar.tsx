"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Bell, Globe, Shield, Menu } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter()
  const { toast } = useToast()
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
      toast(`Searching surveillance records for "${searchQuery}"...`, 'info')
      setSearchQuery('')
    }
  }

  return (
    <header className="h-16 bg-card/90 border-b border-border flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 backdrop-blur-md select-none">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Menu Toggle */}
        <button 
          onClick={onMenuClick}
          aria-label="Toggle navigation menu"
          className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Surveillance Search */}
        <div className="max-w-md w-full hidden sm:block">
          <Input
            icon={<Search className="w-4 h-4" />}
            type="text"
            placeholder="Search cases, camera sectors, suspect IDs..."
            aria-label="Search surveillance records"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
        
        {/* Tactical Telemetry Status Pills */}
        <div className="hidden lg:flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-secondary/50 rounded-full border border-border">
            <Globe className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span className="text-muted-foreground">IST: <strong className="text-foreground">{currentTime || '—'}</strong></span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1 bg-secondary/50 rounded-full border border-border">
            <Shield className="w-3.5 h-3.5 text-success" aria-hidden="true" />
            <span className="text-success font-semibold">ONLINE: SECURE</span>
          </div>
        </div>
      </div>

      {/* Right Action Icons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.push('/alerts')}
          className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors cursor-pointer"
          aria-label="View live alerts"
          title="Active Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
        </button>
      </div>
    </header>
  )
}
