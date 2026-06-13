"use client"

import React from 'react'
import { Lock, Sparkles } from 'lucide-react'

interface PremiumLockProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export function PremiumLock({
  children,
  title = 'Enterprise Feature',
  description = 'This module requires an Enterprise license to unlock. Contact your system administrator for access.'
}: PremiumLockProps) {
  return (
    <div className="relative min-h-[60vh]">
      {/* Blurred background content */}
      <div className="pointer-events-none select-none" style={{ filter: 'blur(6px)', opacity: 0.35 }}>
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 max-w-md text-center px-6">
          {/* Glowing lock icon */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 flex items-center justify-center backdrop-blur-sm">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>

          {/* Badge */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">{title}</span>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>

          {/* CTA Button */}
          <button className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-primary/80 to-primary text-primary-foreground text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary/25 hover:scale-105 active:scale-95 cursor-not-allowed opacity-80">
            Request Access
          </button>
        </div>
      </div>
    </div>
  )
}
