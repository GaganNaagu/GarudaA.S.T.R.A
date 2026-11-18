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
  LogOut,
  Radio
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

const operationsNavigation = [
  { name: 'Command Overview', href: '/', icon: LayoutDashboard },
  { name: 'Live Alerts', href: '/alerts', icon: Bell },
  { name: 'Missing Persons', href: '/missing', icon: UserSearch },
  { name: 'Surveillance Feeds', href: '/uploads', icon: Upload },
  { name: 'Footage Archive', href: '/surveillance', icon: History },
  { name: 'Patrol & Telemetry', href: '/patrol', icon: ShieldAlert },
  { name: 'Response Board', href: '/status', icon: CheckCircle2 },
]

const systemNavigation = [
  { name: 'Detection Logs', href: '/logs', icon: Radio, roles: ['admin', 'dispatcher', 'officer', 'patrol'] },
  { name: 'Personnel & Users', href: '/system/users', icon: Users, roles: ['admin'] },
  { name: 'System Settings', href: '/system/settings', icon: Settings, roles: ['admin'] },
]

export function Sidebar() {
  const pathname = usePathname()
  const { fullName, role, logout } = useAuth()

  return (
    <aside className="flex flex-col w-64 bg-card border-r border-border h-full select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-border/60 flex items-center gap-3 bg-card shrink-0">
        <img
          src="/GarudASTRAtransparent.png"
          alt="Garuda A.S.T.R.A"
          className="h-9 w-auto object-contain"
        />
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-foreground">
            GARUDA A.S.T.R.A
          </span>
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
            Command Center
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        <div>
          <h3 className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            Tactical Operations
          </h3>
          <ul className="space-y-0.5">
            {operationsNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-all relative",
                      isActive
                        ? "bg-secondary text-foreground font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-r before:bg-primary text-primary"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        <div>
          <h3 className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
            System & Governance
          </h3>
          <ul className="space-y-0.5">
            {systemNavigation
              .filter((item) => !item.roles || item.roles.includes(role?.toLowerCase() || 'officer'))
              .map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-all relative",
                      isActive
                        ? "bg-secondary text-foreground font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-r before:bg-primary text-primary"
                        : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* Operator Session Info Footer */}
      <div className="p-3 border-t border-border/60 bg-secondary/20 shrink-0">
        <div className="flex items-center justify-between px-2 py-1.5">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-xs font-semibold text-foreground truncate">
              {fullName || 'Duty Officer'}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground uppercase truncate">
              {role ? `Role: ${role}` : 'Sector Command'}
            </span>
          </div>
          <button
            onClick={() => logout?.()}
            title="Sign Out"
            aria-label="Sign Out"
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
