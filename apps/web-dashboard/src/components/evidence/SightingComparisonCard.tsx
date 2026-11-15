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
}

export function SightingComparisonCard({
  sighting,
  caseNumber,
  referencePhotoUrl,
  personName,
  onStatusUpdated,
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
    similarity >= 75 ? 'text-green-400' : similarity >= 50 ? 'text-amber-400' : 'text-slate-400'
  const similarityBg =
    similarity >= 75 ? 'bg-green-500/10 border-green-500/30' : similarity >= 50 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-800 border-slate-700'

  const statusBadgeColor =
    sighting.verification_status === 'Confirmed'
      ? 'bg-green-500/15 text-green-400 border-green-500/40'
      : sighting.verification_status === 'Rejected'
      ? 'bg-red-500/15 text-red-400 border-red-500/40'
      : 'bg-amber-500/15 text-amber-400 border-amber-500/40'

  return (
    <>
      <Card className="bg-slate-900/90 border-slate-800 hover:border-slate-700 transition-all shadow-md overflow-hidden text-slate-100">
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/70 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs bg-slate-800 text-slate-200 border-slate-700">
              Sighting #{sighting.id.slice(0, 8)}
            </Badge>
            <Badge className={`text-xs uppercase font-bold border ${statusBadgeColor}`}>
              {sighting.verification_status}
            </Badge>
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              {new Date(sighting.created_at).toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`font-mono text-xs font-bold border ${similarityBg} ${similarityColor}`}>
              AI Similarity: {similarity.toFixed(1)}%
            </Badge>
            <Badge variant="outline" className="font-mono text-xs bg-slate-800 text-slate-300 border-slate-700">
              Quality: {sighting.quality_score.toFixed(1)}
            </Badge>
            <Badge variant="outline" className="font-mono text-[10px] text-slate-500 border-slate-800">
              {sighting.model_version}
            </Badge>
          </div>
        </div>

        <CardContent className="p-4 space-y-4">
          {/* Side-by-Side 3-Pane Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Pane 1: Reference Photo */}
            <div className="flex flex-col rounded-lg border border-slate-800 bg-slate-950/50 overflow-hidden">
              <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                <span>Reference Photo</span>
                <span className="text-slate-500 font-mono">Registry</span>
              </div>
              <div
                className="relative h-44 bg-slate-950 flex items-center justify-center cursor-pointer group overflow-hidden"
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
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ZoomIn className="w-6 h-6 text-white drop-shadow" />
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-500 font-mono">No Reference Image</div>
                )}
              </div>
            </div>

            {/* Pane 2: CCTV Face Crop */}
            <div className="flex flex-col rounded-lg border border-slate-800 bg-slate-950/50 overflow-hidden">
              <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                <span>CCTV Face Crop</span>
                <span className="text-blue-400 font-mono">{similarity.toFixed(1)}% Match</span>
              </div>
              <div
                className="relative h-44 bg-slate-950 flex items-center justify-center cursor-pointer group overflow-hidden"
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
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ZoomIn className="w-6 h-6 text-white drop-shadow" />
                    </div>
                    {sighting.bounding_box && (
                      <div className="absolute bottom-1 right-2 px-1.5 py-0.5 bg-black/60 rounded text-[9px] font-mono text-slate-400">
                        Box: [{sighting.bounding_box.x}, {sighting.bounding_box.y}]
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-slate-500 font-mono">No Crop File</div>
                )}
              </div>
            </div>

            {/* Pane 3: Full Context Frame */}
            <div className="flex flex-col rounded-lg border border-slate-800 bg-slate-950/50 overflow-hidden">
              <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                <span>CCTV Context Frame</span>
                <span className="text-slate-500 font-mono flex items-center gap-1">
                  <Camera className="w-3 h-3" /> Full Scene
                </span>
              </div>
              <div
                className="relative h-44 bg-slate-950 flex items-center justify-center cursor-pointer group overflow-hidden"
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
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ZoomIn className="w-6 h-6 text-white drop-shadow" />
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-500 font-mono">No Scene Frame</div>
                )}
              </div>
            </div>
          </div>

          {/* Audit Notes Banner (If already reviewed) */}
          {sighting.review_notes && (
            <div className="p-3 bg-slate-950/80 rounded-md border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider">
                  Investigator Review Note:
                </p>
                <p className="italic text-slate-300">"{sighting.review_notes}"</p>
                {sighting.reviewed_at && (
                  <p className="text-[10px] text-slate-500 font-mono">
                    Audited at: {new Date(sighting.reviewed_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Card Actions Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="text-xs text-slate-400">
              Review Status:{' '}
              <strong className={similarityColor}>{sighting.verification_status}</strong>
            </span>

            <Button
              size="sm"
              variant={sighting.verification_status === 'Confirmed' ? 'secondary' : 'default'}
              className="h-8 px-3 text-xs flex items-center gap-1.5"
              onClick={() => setIsVerifyModalOpen(true)}
            >
              <UserCheck className="w-3.5 h-3.5" />
              {sighting.verification_status === 'Unreviewed' ? 'Review & Verify' : 'Change Verdict'}
            </Button>
          </div>
        </CardContent>
      </Card>

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
