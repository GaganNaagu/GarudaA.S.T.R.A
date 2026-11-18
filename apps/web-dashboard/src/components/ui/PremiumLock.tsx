import React from 'react'

interface PremiumLockProps {
  children: React.ReactNode
  title?: string
  description?: string
  version?: string
}

/**
 * PremiumLock is permanently bypassed as per project policy:
 * All features are fully available with zero locks or gates.
 */
export function PremiumLock({ children }: PremiumLockProps) {
  return <>{children}</>
}
