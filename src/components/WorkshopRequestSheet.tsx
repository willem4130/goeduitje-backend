'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, User, Mail, Phone, Building2, Users, MapPin, FileText, Euro, Clock, Edit2, Save, X, AlertCircle } from 'lucide-react'

type WorkshopRequestStatus = 'leeg' | 'informatie verstrekt' | 'offerte gemaakt' | 'bevestigde opdracht'

type WorkshopRequest = {
  id: number
  status: WorkshopRequestStatus
  contactName: string | null
  email: string | null
  phone: string | null
  organization: string | null
  activityType: string | null
  preferredDate: Date | null
  alternativeDate: Date | null
  participants: number | null
  ageGroup: string | null
  location: string | null
  travelDistance: number | null
  specialRequirements: string | null
  dietaryRestrictions: string | null
  accessibilityNeeds: string | null
  quotedPrice: string | null
  finalPrice: string | null
  quoteEmailSentAt: Date | null
  quotePdfUrl: string | null
  aiGeneratedEmailContent: string | null
  createdAt: Date
  updatedAt: Date
  notes: string | null
}

interface WorkshopRequestSheetProps {
  requestId: number | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

const statusConfig: Record<WorkshopRequestStatus, { label: string; color: string; description: string }> = {
  'leeg': {
    label: 'Leeg',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    description: 'Nieuwe aanvraag, nog geen actie ondernomen'
  },
  'informatie verstrekt': {
    label: 'Informatie Verstrekt',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Eerste contact met klant is gelegd'
  },
  'offerte gemaakt': {
    label: 'Offerte Gemaakt',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    description: 'AI-gegenereerde offerte verstuurd naar klant'
  },
  'bevestigde opdracht': {
    label: 'Bevestigde Opdracht',
    color: 'bg-green-100 text-green-800 border-green-300',
    description: 'Workshop is bevestigd en ingepland'
  },
}

export function WorkshopRequestSheet({ requestId, isOpen, onClose, onUpdate }: WorkshopRequestSheetProps) {
  const [request, setRequest] = useState<WorkshopRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<WorkshopRequest>>({})

  useEffect(() => {
    if (isOpen && requestId) {
      fetchRequest()
    }
  }, [isOpen, requestId])

  const fetchRequest = async () => {
    if (!requestId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/workshops/requests/${requestId}`)
      if (!response.ok) throw new Error('Failed to fetch request')

      const data = await response.json()
      setRequest(data.request)
      setFormData(data.request)
    } catch (err) {
      setError('Kon aanvraag niet laden. Probeer het opnieuw.')
      console.error('Failed to fetch request:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!requestId) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/workshops/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to update request')

      const data = await response.json()
      setRequest(data.request)
      setEditMode(false)
      onUpdate()
    } catch (err) {
      setError('Kon aanvraag niet opslaan. Probeer het opnieuw.')
      console.error('Failed to save request:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(request || {})
    setEditMode(false)
    setError(null)
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('nl-NL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price: string | null) => {
    if (!price) return '-'
    return `€${parseFloat(price).toFixed(2)}`
  }

  if (!isOpen) return null

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-6">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-2xl">Workshop Aanvraag #{requestId}</SheetTitle>
              <SheetDescription className="mt-2">
                {request && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={`${statusConfig[request.status].color} border`}>
                      {statusConfig[request.status].label}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {statusConfig[request.status].description}
                    </span>
                  </div>
                )}
              </SheetDescription>
            </div>
            {!editMode && request && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(true)}
                className="flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Bewerken
              </Button>
            )}
          </div>
        </SheetHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-sm text-gray-500">Aanvraag laden...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Fout</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {!loading && request && (
          <div className="space-y-8">
            {/* Contact Information */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-gray-500" />
                Contactgegevens
              </h3>
              <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactName" className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <User className="h-3 w-3" />
                      Naam
                    </Label>
                    {editMode ? (
                      <Input
                        id="contactName"
                        value={formData.contactName || ''}
                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                        placeholder="Naam contactpersoon"
                      />
                    ) : (
                      <p className="text-sm font-medium">{request.contactName || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="organization" className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <Building2 className="h-3 w-3" />
                      Organisatie
                    </Label>
                    {editMode ? (
                      <Input
                        id="organization"
                        value={formData.organization || ''}
                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                        placeholder="Bedrijfsnaam (optioneel)"
                      />
                    ) : (
                      <p className="text-sm font-medium">{request.organization || '-'}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <Mail className="h-3 w-3" />
                      E-mail
                    </Label>
                    {editMode ? (
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="email@voorbeeld.nl"
                      />
                    ) : (
                      <a href={`mailto:${request.email}`} className="text-sm font-medium text-blue-600 hover:underline">
                        {request.email || '-'}
                      </a>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <Phone className="h-3 w-3" />
                      Telefoon
                    </Label>
                    {editMode ? (
                      <Input
                        id="phone"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="06 12345678"
                      />
                    ) : (
                      <a href={`tel:${request.phone}`} className="text-sm font-medium text-blue-600 hover:underline">
                        {request.phone || '-'}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Workshop Details */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-500" />
                Workshop Details
              </h3>
              <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <Label className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                    <FileText className="h-3 w-3" />
                    Activiteit
                  </Label>
                  {editMode ? (
                    <Input
                      value={formData.activityType || ''}
                      onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                      placeholder="Type workshop"
                    />
                  ) : (
                    <p className="text-sm font-medium">{request.activityType || '-'}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <Calendar className="h-3 w-3" />
                      Voorkeursdatum
                    </Label>
                    {editMode ? (
                      <Input
                        type="date"
                        value={formData.preferredDate ? new Date(formData.preferredDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value ? new Date(e.target.value) : null })}
                      />
                    ) : (
                      <p className="text-sm font-medium">{formatDate(request.preferredDate)}</p>
                    )}
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <Calendar className="h-3 w-3" />
                      Alternatieve datum
                    </Label>
                    {editMode ? (
                      <Input
                        type="date"
                        value={formData.alternativeDate ? new Date(formData.alternativeDate).toISOString().split('T')[0] : ''}
                        onChange={(e) => setFormData({ ...formData, alternativeDate: e.target.value ? new Date(e.target.value) : null })}
                      />
                    ) : (
                      <p className="text-sm font-medium">{formatDate(request.alternativeDate)}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <Users className="h-3 w-3" />
                      Aantal deelnemers
                    </Label>
                    {editMode ? (
                      <Input
                        type="number"
                        value={formData.participants || ''}
                        onChange={(e) => setFormData({ ...formData, participants: parseInt(e.target.value) || null })}
                        placeholder="0"
                      />
                    ) : (
                      <p className="text-sm font-medium">{request.participants || '-'}</p>
                    )}
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <Users className="h-3 w-3" />
                      Leeftijdsgroep
                    </Label>
                    {editMode ? (
                      <Input
                        value={formData.ageGroup || ''}
                        onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                        placeholder="Bijv. 25-35 jaar"
                      />
                    ) : (
                      <p className="text-sm font-medium">{request.ageGroup || '-'}</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Location */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                Locatie
              </h3>
              <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <Label className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                    <MapPin className="h-3 w-3" />
                    Locatie / Stad
                  </Label>
                  {editMode ? (
                    <Input
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Bijv. Utrecht, Amsterdam"
                    />
                  ) : (
                    <p className="text-sm font-medium">{request.location || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                    <MapPin className="h-3 w-3" />
                    Reisafstand (km)
                  </Label>
                  {editMode ? (
                    <Input
                      type="number"
                      value={formData.travelDistance || ''}
                      onChange={(e) => setFormData({ ...formData, travelDistance: parseInt(e.target.value) || null })}
                      placeholder="0"
                    />
                  ) : (
                    <p className="text-sm font-medium">{request.travelDistance ? `${request.travelDistance} km` : '-'}</p>
                  )}
                </div>
              </div>
            </section>

            <Separator />

            {/* Special Requirements */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                Bijzonderheden
              </h3>
              <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <Label className="text-xs text-gray-600 mb-2 block">Speciale wensen</Label>
                  {editMode ? (
                    <Textarea
                      value={formData.specialRequirements || ''}
                      onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
                      placeholder="Eventuele bijzondere verzoeken..."
                      rows={3}
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{request.specialRequirements || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-2 block">Dieetwensen</Label>
                  {editMode ? (
                    <Textarea
                      value={formData.dietaryRestrictions || ''}
                      onChange={(e) => setFormData({ ...formData, dietaryRestrictions: e.target.value })}
                      placeholder="Bijv. vegetarisch, allergieën..."
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{request.dietaryRestrictions || '-'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-gray-600 mb-2 block">Toegankelijkheid</Label>
                  {editMode ? (
                    <Textarea
                      value={formData.accessibilityNeeds || ''}
                      onChange={(e) => setFormData({ ...formData, accessibilityNeeds: e.target.value })}
                      placeholder="Bijv. rolstoeltoegankelijk..."
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{request.accessibilityNeeds || '-'}</p>
                  )}
                </div>
              </div>
            </section>

            <Separator />

            {/* Pricing */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Euro className="h-5 w-5 text-gray-500" />
                Prijzen
              </h3>
              <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-600 mb-2 block">Offerte prijs</Label>
                    {editMode ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.quotedPrice || ''}
                        onChange={(e) => setFormData({ ...formData, quotedPrice: e.target.value })}
                        placeholder="0.00"
                      />
                    ) : (
                      <p className="text-sm font-medium">{formatPrice(request.quotedPrice)}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 mb-2 block">Definitieve prijs</Label>
                    {editMode ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.finalPrice || ''}
                        onChange={(e) => setFormData({ ...formData, finalPrice: e.target.value })}
                        placeholder="0.00"
                      />
                    ) : (
                      <p className="text-sm font-medium">{formatPrice(request.finalPrice)}</p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Internal Notes */}
            <section>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                Interne notities
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-xs text-amber-700 mb-2">Alleen zichtbaar voor admins</p>
                {editMode ? (
                  <Textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Interne opmerkingen, actiepunten, etc..."
                    rows={4}
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{request.notes || 'Geen notities'}</p>
                )}
              </div>
            </section>

            <Separator />

            {/* Automation Metadata */}
            {(request.quoteEmailSentAt || request.quotePdfUrl || request.aiGeneratedEmailContent) && (
              <section>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-500" />
                  Offerte informatie
                </h3>
                <div className="space-y-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  {request.quoteEmailSentAt && (
                    <div>
                      <Label className="text-xs text-green-700 mb-1 block">Offerte verstuurd op</Label>
                      <p className="text-sm font-medium">{formatDateTime(request.quoteEmailSentAt)}</p>
                    </div>
                  )}
                  {request.quotePdfUrl && (
                    <div>
                      <Label className="text-xs text-green-700 mb-1 block">PDF Quote</Label>
                      <a
                        href={request.quotePdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-2"
                      >
                        📄 Download PDF
                      </a>
                    </div>
                  )}
                  {request.aiGeneratedEmailContent && (
                    <div>
                      <Label className="text-xs text-green-700 mb-1 block">AI-gegenereerde e-mail</Label>
                      <div className="bg-white border border-green-200 rounded p-3 max-h-64 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap font-sans">{request.aiGeneratedEmailContent}</pre>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Metadata */}
            <section className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                <div>
                  <span className="font-medium">Aangemaakt:</span> {formatDateTime(request.createdAt)}
                </div>
                <div>
                  <span className="font-medium">Laatst bijgewerkt:</span> {formatDateTime(request.updatedAt)}
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            {editMode && (
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Opslaan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Opslaan
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Annuleren
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
