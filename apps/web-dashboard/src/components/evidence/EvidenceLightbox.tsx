"use client"

import React, { useEffect, useState } from 'react'
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface EvidenceLightboxProps {
  isOpen: boolean
  imageUrl: string
  title: string
  subtitle?: string
  onClose: () => void
}

export function EvidenceLightbox({
  isOpen,
  imageUrl,
  title,
  subtitle,
  onClose,
}: EvidenceLightboxProps) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'auto'
      setScale(1)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-black/95 backdrop-blur-md animate-fade-in select-none"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        className="w-full flex items-center justify-between px-6 py-4 bg-slate-900/80 border-b border-slate-800 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <h3 id="lightbox-title" className="text-sm font-semibold text-white tracking-wide">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-400 font-mono mt-0.5">{subtitle}</p>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            aria-label="Zoom out"
            className="h-8 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer"
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" aria-hidden="true" />
          </Button>
          <span className="text-xs font-mono text-slate-300 w-12 text-center" aria-live="polite">
            {Math.round(scale * 100)}%
          </span>
          <Button
            size="sm"
            variant="secondary"
            aria-label="Zoom in"
            className="h-8 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer"
            onClick={() => setScale((s) => Math.min(3, s + 0.25))}
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            aria-label="Reset zoom to 100%"
            className="h-8 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer"
            onClick={() => setScale(1)}
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          </Button>
          <a
            href={imageUrl}
            download
            target="_blank"
            rel="noreferrer"
            aria-label="Download image"
            className="inline-flex items-center justify-center h-8 px-2.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Download Image"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
          <Button
            size="sm"
            variant="ghost"
            aria-label="Close image lightbox"
            className="h-8 px-2.5 text-slate-400 hover:text-white hover:bg-slate-800 ml-2 cursor-pointer"
            onClick={onClose}
            title="Close (ESC)"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Main Viewport */}
      <div
        className="flex-1 w-full flex items-center justify-center p-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="transition-transform duration-150 ease-out flex items-center justify-center max-w-full max-h-full"
          style={{ transform: `scale(${scale})` }}
        >
          <img
            src={imageUrl}
            alt={title}
            className="max-w-[90vw] max-h-[80vh] object-contain rounded shadow-2xl border border-slate-800"
          />
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="w-full text-center py-2 bg-slate-950/80 border-t border-slate-900 text-[11px] text-slate-500 font-mono">
        Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">ESC</kbd> or click outside to dismiss · Forensic View
      </div>
    </div>
  )
}
