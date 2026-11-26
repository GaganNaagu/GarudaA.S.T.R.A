"use client"

import React from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from "@/components/layout/Sidebar"
import { AdminSidebar } from "@/components/layout/AdminSidebar"
import { Topbar } from "@/components/layout/Topbar"
import { AuthProvider, useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useWebSocket, WebSocketProvider } from '@/lib/websocket'

export function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { role, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { lastMessage } = useWebSocket()
  
  // Audio element ref for Garuda_Detect_Webapp.wav & audio context
  const audioContextRef = useRef<AudioContext | null>(null)
  const alertAudioRef = useRef<HTMLAudioElement | null>(null)

  // Pre-warm and unlock audio on first user interaction (browser autoplay policy)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/Garuda_Detect_Webapp.wav')
      audio.preload = 'auto'
      audio.volume = 0.85
      alertAudioRef.current = audio
    }

    const unlock = () => {
      if (alertAudioRef.current) {
        alertAudioRef.current
          .play()
          .then(() => {
            alertAudioRef.current?.pause()
            if (alertAudioRef.current) alertAudioRef.current.currentTime = 0
          })
          .catch(() => {})
      }
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume()
      }
      document.removeEventListener('click', unlock)
      document.removeEventListener('touchstart', unlock)
      document.removeEventListener('keydown', unlock)
    }
    document.addEventListener('click', unlock)
    document.addEventListener('touchstart', unlock)
    document.addEventListener('keydown', unlock)
    return () => {
      document.removeEventListener('click', unlock)
      document.removeEventListener('touchstart', unlock)
      document.removeEventListener('keydown', unlock)
    }
  }, [])
  
  // Don't show sidebar/topbar on login page
  const isLoginPage = pathname === '/login'
  const isAdminRoute = pathname.startsWith('/admin')

  useEffect(() => {
    if (!isLoading && isAuthenticated && isAdminRoute && role !== 'admin') {
      router.push('/')
    }
  }, [isLoading, isAuthenticated, isAdminRoute, role, router])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Global alert sound using official Garuda_Detect_Webapp.wav from sfx/
  useEffect(() => {
    if (lastMessage && lastMessage.event === 'possible_match_detected') {
      try {
        if (alertAudioRef.current) {
          alertAudioRef.current.currentTime = 0
          alertAudioRef.current.play().catch((err) => {
            console.warn('Pre-warmed audio play blocked, attempting fallback:', err)
            const fallbackAudio = new Audio('/sounds/Garuda_Detect_Webapp.wav')
            fallbackAudio.volume = 0.85
            fallbackAudio.play().catch((e) => console.error('Failed to play Garuda_Detect_Webapp.wav', e))
          })
        } else {
          const fallbackAudio = new Audio('/sounds/Garuda_Detect_Webapp.wav')
          fallbackAudio.volume = 0.85
          fallbackAudio.play().catch((e) => console.error('Failed to play Garuda_Detect_Webapp.wav', e))
        }
      } catch (e) {
        console.error('Failed to play alert sound', e)
      }
    }
  }, [lastMessage])

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (isAdminRoute && role !== 'admin') {
    return null // Return nothing while redirecting
  }

  return (
    <div className="flex min-h-screen bg-background overflow-hidden">
      {/* Mobile Overlay */}
      {mobileMenuOpen && !isLoginPage && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden" 
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar */}
      {!isLoginPage && (
        <div className={cn(
          "fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 md:flex",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
          {isAdminRoute ? <AdminSidebar /> : <Sidebar />}
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {!isLoginPage && <Topbar onMenuClick={() => setMobileMenuOpen(true)} />}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ClientLayoutBridge>{children}</ClientLayoutBridge>
    </AuthProvider>
  )
}

/** Bridge component that reads auth context and passes it to WebSocketProvider */
function ClientLayoutBridge({ children }: { children: React.ReactNode }) {
  const { token, logout } = useAuth()
  return (
    <WebSocketProvider token={token} onAuthExpired={logout}>
      <ClientLayoutContent>{children}</ClientLayoutContent>
    </WebSocketProvider>
  )
}
