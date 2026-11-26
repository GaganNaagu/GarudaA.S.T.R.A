"use client"

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  ZoomIn, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Camera, 
  FileText,
  UserCheck
} from 'lucide-react'
import { SightingEvidence, getSafeEvidenceUrl } from '@/lib/api'
import { EvidenceLightbox } from './EvidenceLightbox'
import { VerificationModal } from './VerificationModal'

interface SightingComparisonCardProps {
  sighting: SightingEvidence
  caseNumber: string
  referencePhotoUrl: string | null
  personName: string
  onStatusUpdated: (updated: SightingEvidence) => void
  isHighlighted?: boolean
}

export function SightingComparisonCard({
  sighting,
  caseNumber,
  referencePhotoUrl,
  personName,
  onStatusUpdated,
  isHighlighted = false,
}: SightingComparisonCardProps) {
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean
    imageUrl: string
    title: string
    subtitle: string
  }>({
    isOpen: false,
    imageUrl: '',
    title: '',
    subtitle: '',
  })

  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false)

  const openLightbox = (url: string, title: string, subtitle: string) => {
    setLightboxState({
      isOpen: true,
      imageUrl: url,
      title,
      subtitle,
    })
  }

  const cropUrl = getSafeEvidenceUrl(sighting.crop_image_path)
  const fullFrameUrl = getSafeEvidenceUrl(sighting.full_frame_path)

  const similarity = sighting.similarity_score
  const similarityColor =
    similarity >= 75 ? 'text-status-active' : similarity >= 50 ? 'text-status-warning' : 'text-muted-foreground'
  const similarityBg =
    similarity >= 75 ? 'bg-status-active/10 border-status-active/30' : similarity >= 50 ? 'bg-status-warning/10 border-status-warning/30' : 'bg-secondary border-border'

  const statusBadgeColor =
    sighting.verification_status === 'Confirmed'
      ? 'bg-status-active/15 text-status-active border-status-active/40'
      : sighting.verification_status === 'Rejected'
      ? 'bg-status-critical/15 text-status-critical border-status-critical/40'
      : 'bg-status-warning/15 text-status-warning border-status-warning/40'

  return (
    <>
      <div id={`sighting-card-${sighting.id}`} className="scroll-mt-24 transition-all duration-300">
        <Card className={`transition-all shadow-sm overflow-hidden ${
          isHighlighted
            ? 'border-primary ring-2 ring-primary/60 shadow-lg shadow-primary/10'
            : 'hover:border-border/80'
        }`}>
          {isHighlighted && (
            <div className="bg-primary/15 border-b border-primary/30 px-4 py-2 flex items-center justify-between text-xs text-primary font-medium">
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span><strong>Timeline Sighting Target:</strong> #{sighting.id.slice(0, 8)}</span>
              </span>
              <Badge variant="outline" className="text-[10px] font-mono border-primary/40 bg-primary/20 text-primary uppercase tracking-wider">
                Focused Crop
              </Badge>
            </div>
          )}
          {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-secondary/40 border-b border-border">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              Sighting #{sighting.id.slice(0, 8)}
            </Badge>
            <Badge className={`text-xs uppercase font-bold border ${statusBadgeColor}`}>
              {sighting.verification_status}
            </Badge>
            <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground/70" />
              {new Date(sighting.created_at).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`font-mono text-xs font-bold border ${similarityBg} ${similarityColor}`}>
              AI Similarity: {similarity.toFixed(1)}%
            </Badge>
            <Badge variant="outline" className="font-mono text-xs">
              Quality: {sighting.quality_score.toFixed(1)}
            </Badge>
            <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground border-border">
              {sighting.model_version}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Side-by-Side 3-Pane Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Pane 1: Reference Photo */}
            <div className="flex flex-col rounded-lg border border-border bg-card/60 overflow-hidden">
              <div className="px-3 py-1.5 bg-secondary/50 border-b border-border flex items-center justify-between text-[11px] font-semibold text-foreground uppercase tracking-wider">
                <span>Reference Photo</span>
                <span className="text-muted-foreground font-mono">Registry</span>
              </div>
              <div
                className="relative h-44 bg-canvas flex items-center justify-center cursor-pointer group overflow-hidden"
                onClick={() =>
                  referencePhotoUrl &&
                  openLightbox(referencePhotoUrl, `${personName} (Reference Photo)`, `Case: ${caseNumber}`)
                }
              >
                {referencePhotoUrl ? (
                  <>
                    <img
                      src={referencePhotoUrl}
                      alt="Reference"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ease-out"
                    />
                    <div className="absolute inset-0 bg-canvas/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-150">
                      <ZoomIn className="w-6 h-6 text-foreground drop-shadow" />
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground font-mono">No Reference Image</div>
                )}
              </div>
            </div>

            {/* Pane 2: CCTV Face Crop */}
            <div className="flex flex-col rounded-lg border border-border bg-card/60 overflow-hidden">
              <div className="px-3 py-1.5 bg-secondary/50 border-b border-border flex items-center justify-between text-[11px] font-semibold text-foreground uppercase tracking-wider">
                <span>CCTV Face Crop</span>
                <span className="text-accent font-mono">{similarity.toFixed(1)}% Match</span>
              </div>
              <div
                className="relative h-44 bg-canvas flex items-center justify-center cursor-pointer group overflow-hidden"
                onClick={() =>
                  cropUrl &&
                  openLightbox(cropUrl, `CCTV Extracted Face Crop`, `Case: ${caseNumber} · Similarity: ${similarity.toFixed(1)}%`)
                }
              >
                {cropUrl ? (
                  <>
                    <img
                      src={cropUrl}
                      alt="CCTV Crop"
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200 ease-out"
                    />
                    <div className="absolute inset-0 bg-canvas/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-150">
                      <ZoomIn className="w-6 h-6 text-foreground drop-shadow" />
                    </div>
                    {sighting.bounding_box && (
                      <div className="absolute bottom-1 right-2 px-1.5 py-0.5 bg-canvas/80 rounded text-[9px] font-mono text-muted-foreground border border-border">
                        Box: [{sighting.bounding_box.x}, {sighting.bounding_box.y}]
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground font-mono">No Crop File</div>
                )}
              </div>
            </div>

            {/* Pane 3: Full Context Frame */}
            <div className="flex flex-col rounded-lg border border-border bg-card/60 overflow-hidden">
              <div className="px-3 py-1.5 bg-secondary/50 border-b border-border flex items-center justify-between text-[11px] font-semibold text-foreground uppercase tracking-wider">
                <span>CCTV Context Frame</span>
                <span className="text-muted-foreground font-mono flex items-center gap-1">
                  <Camera className="w-3 h-3" /> Full Scene
                </span>
              </div>
              <div
                className="relative h-44 bg-canvas flex items-center justify-center cursor-pointer group overflow-hidden"
                onClick={() =>
                  fullFrameUrl &&
                  openLightbox(fullFrameUrl, `CCTV Full Context Scene`, `Case: ${caseNumber}`)
                }
              >
                {fullFrameUrl ? (
                  <>
                    <img
                      src={fullFrameUrl}
                      alt="Full Context Frame"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ease-out"
                    />
                    <div className="absolute inset-0 bg-canvas/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-150">
                      <ZoomIn className="w-6 h-6 text-foreground drop-shadow" />
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted-foreground font-mono">No Scene Frame</div>
                )}
              </div>
            </div>
          </div>

          {/* Audit Notes Banner (If already reviewed) */}
          {sighting.review_notes && (
            <div className="p-3 bg-secondary/30 rounded-md border border-border text-xs text-muted-foreground flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                  Investigator Review Note:
                </p>
                <p className="italic text-foreground">"{sighting.review_notes}"</p>
                {sighting.reviewed_at && (
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Audited at: {new Date(sighting.reviewed_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Card Actions Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Review Status:{' '}
              <strong className={similarityColor}>{sighting.verification_status}</strong>
            </span>

            <Button
              size="sm"
              variant={sighting.verification_status === 'Confirmed' ? 'secondary' : 'default'}
              className="h-8 px-3 text-xs flex items-center gap-1.5 active:scale-[0.98] transition-all duration-150"
              onClick={() => setIsVerifyModalOpen(true)}
            >
              <UserCheck className="w-3.5 h-3.5" />
              {sighting.verification_status === 'Unreviewed' ? 'Review & Verify' : 'Change Verdict'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

      {/* Lightbox Modal */}
      <EvidenceLightbox
        isOpen={lightboxState.isOpen}
        imageUrl={lightboxState.imageUrl}
        title={lightboxState.title}
        subtitle={lightboxState.subtitle}
        onClose={() => setLightboxState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Verification Review Modal */}
      <VerificationModal
        isOpen={isVerifyModalOpen}
        sighting={sighting}
        caseNumber={caseNumber}
        onClose={() => setIsVerifyModalOpen(false)}
        onSuccess={onStatusUpdated}
      />
    </>
  )
}
