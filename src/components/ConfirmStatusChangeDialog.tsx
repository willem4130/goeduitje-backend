'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Mail, FileText, CheckCircle2, Sparkles, Loader2 } from 'lucide-react'

type WorkshopRequestStatus = 'leeg' | 'informatie verstrekt' | 'offerte gemaakt' | 'bevestigde opdracht'

interface ConfirmStatusChangeDialogProps {
  isOpen: boolean
  onClose: () => void
  currentStatus: WorkshopRequestStatus
  newStatus: WorkshopRequestStatus
  onConfirm: () => Promise<void>
  requestData?: {
    contactName?: string | null
    email?: string | null
    activityType?: string | null
  }
}

const statusConfig: Record<WorkshopRequestStatus, {
  label: string
  color: string
  icon: React.ReactNode
}> = {
  'leeg': {
    label: 'Leeg',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: <FileText className="h-4 w-4" />
  },
  'informatie verstrekt': {
    label: 'Informatie Verstrekt',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: <Mail className="h-4 w-4" />
  },
  'offerte gemaakt': {
    label: 'Offerte Gemaakt',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: <Sparkles className="h-4 w-4" />
  },
  'bevestigde opdracht': {
    label: 'Bevestigde Opdracht',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: <CheckCircle2 className="h-4 w-4" />
  },
}

const statusActionDetails: Record<WorkshopRequestStatus, {
  title: string
  description: string
  actions: string[]
  warning?: string
  estimatedTime?: string
  requiresReview?: boolean
}> = {
  'leeg': {
    title: 'Status: Leeg',
    description: 'Nieuwe aanvraag zonder verdere actie',
    actions: [],
  },
  'informatie verstrekt': {
    title: 'Informatie Verstrekt',
    description: 'Markeer dat eerste contact is gelegd met de klant',
    actions: [
      '✅ Status wordt aangepast naar "Informatie Verstrekt"',
      '📝 Noteer interne opmerkingen indien nodig',
    ],
  },
  'offerte gemaakt': {
    title: 'Offerte Genereren & Versturen',
    description: 'Volledig geautomatiseerde offerte workflow',
    actions: [
      '🤖 AI genereert gepersonaliseerde offerte-email (Claude)',
      '📄 Automatisch PDF quote wordt aangemaakt (Puppeteer)',
      '☁️ PDF wordt geüpload naar Vercel Blob Storage',
      '📧 Email met offerte wordt verstuurd via Resend',
      '💾 Database wordt bijgewerkt met verzendgegevens',
    ],
    warning: 'Deze actie verstuurt direct een email naar de klant!',
    estimatedTime: '10-30 seconden',
    requiresReview: true,
  },
  'bevestigde opdracht': {
    title: 'Workshop Bevestigen',
    description: 'Maak bevestigde workshop aan voor uitvoering',
    actions: [
      '✅ Status wordt aangepast naar "Bevestigde Opdracht"',
      '📅 Automatisch nieuwe "Confirmed Workshop" record aanmaken',
      '🔗 Koppel aanvraag aan uitvoerings-tracking',
      '📊 Workshop verschijnt in planning/kalender',
    ],
  },
}

export function ConfirmStatusChangeDialog({
  isOpen,
  onClose,
  currentStatus,
  newStatus,
  onConfirm,
  requestData,
}: ConfirmStatusChangeDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false)

  const actionDetails = statusActionDetails[newStatus]
  const currentConfig = statusConfig[currentStatus]
  const newConfig = statusConfig[newStatus]
  const isQuoteGeneration = newStatus === 'offerte gemaakt'

  const handleConfirm = async () => {
    setIsConfirming(true)
    try {
      await onConfirm()
      onClose()
    } catch (error) {
      console.error('Status change failed:', error)
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {newConfig.icon}
            {actionDetails.title}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {actionDetails.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Transition Visual */}
          <div className="flex items-center justify-center gap-4 bg-gray-50 rounded-lg p-4">
            <Badge className={`${currentConfig.color} border flex items-center gap-2 px-3 py-1.5`}>
              {currentConfig.icon}
              {currentConfig.label}
            </Badge>
            <span className="text-gray-400 text-2xl">→</span>
            <Badge className={`${newConfig.color} border flex items-center gap-2 px-3 py-1.5`}>
              {newConfig.icon}
              {newConfig.label}
            </Badge>
          </div>

          {/* Customer Info (for quote generation) */}
          {isQuoteGeneration && requestData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Klantgegevens</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><span className="font-medium">Naam:</span> {requestData.contactName || 'Niet opgegeven'}</p>
                <p><span className="font-medium">Email:</span> {requestData.email || 'Niet opgegeven'}</p>
                <p><span className="font-medium">Workshop:</span> {requestData.activityType || 'Niet opgegeven'}</p>
              </div>
            </div>
          )}

          {/* Actions List */}
          {actionDetails.actions.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                {isQuoteGeneration ? 'Automatische Acties (in volgorde):' : 'Wat gebeurt er:'}
              </h4>
              <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                {actionDetails.actions.map((action, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="text-gray-400 font-mono text-sm mt-0.5">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <p className="text-sm text-gray-700">{action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estimated Time */}
          {actionDetails.estimatedTime && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-amber-600 animate-spin" />
              <div>
                <p className="text-sm font-medium text-amber-900">Geschatte verwerkingstijd</p>
                <p className="text-xs text-amber-700">{actionDetails.estimatedTime}</p>
              </div>
            </div>
          )}

          {/* Warning */}
          {actionDetails.warning && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-900 mb-1">Belangrijk!</h4>
                <p className="text-sm text-red-700">{actionDetails.warning}</p>
                {isQuoteGeneration && (
                  <p className="text-xs text-red-600 mt-2">
                    Controleer de klantgegevens voordat je doorgaat. Deze actie kan niet ongedaan gemaakt worden.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Review Requirement */}
          {actionDetails.requiresReview && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-purple-900 mb-2">💡 Tip: Preview Eerst</h4>
              <p className="text-sm text-purple-700">
                Je kunt de offerte eerst bekijken zonder te versturen via de "Preview Quote" knop in de tabel.
                Dit genereert een testversie zonder email te versturen.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isConfirming}
          >
            Annuleren
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirming}
            className={isQuoteGeneration ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
          >
            {isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isQuoteGeneration ? 'Offerte versturen...' : 'Verwerken...'}
              </>
            ) : (
              <>
                {newConfig.icon}
                <span className="ml-2">
                  {isQuoteGeneration ? 'Ja, Verstuur Offerte' : 'Ja, Bevestigen'}
                </span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
