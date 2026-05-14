"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Bell, 
  Upload, 
  History, 
  UserSearch, 
  ShieldAlert, 
  CheckCircle2, 
  Cpu, 
  Users, 
  Settings,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Live Alerts', href: '/alerts', icon: Bell },
  { name: 'Surveillance Uploads', href: '/uploads', icon: Upload },
  { name: 'Detection Logs', href: '/logs', icon: History },
  { name: 'Missing Persons', href: '/missing', icon: UserSearch },
  { name: 'Patrol Units', href: '/patrol', icon: ShieldAlert },
  { name: 'Response Status', href: '/status', icon: CheckCircle2 },
]

const systemNavigation = [
  { name: 'AI Services', href: '/system/services', icon: Cpu },
  { name: 'Users', href: '/system/users', icon: Users },
  { name: 'Settings', href: '/system/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-card border-r border-border h-screen sticky top-0 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-wider">
          <ShieldAlert className="w-8 h-8" />
          <span>GARUDA ASTRA</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-8">
        <div>
          <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            OPERATIONS
          </h3>
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-4 py-2 text-sm font-medium rounded-md transition-all",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        <div>
          <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            SYSTEM
          </h3>
          <ul className="space-y-1">
            {systemNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-4 py-2 text-sm font-medium rounded-md transition-all",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      {item.name}
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary font-bold">
            JD
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium">John Doe</span>
            <span className="text-xs text-muted-foreground">Admin</span>
          </div>
        </div>
      </div>
    </div>
  )
}
