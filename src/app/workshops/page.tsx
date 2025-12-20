'use client'

import { useEffect, useState } from 'react'
import { WorkshopRequestSheet } from '@/components/WorkshopRequestSheet'
import { ConfirmStatusChangeDialog } from '@/components/ConfirmStatusChangeDialog'
import { QuotePreviewDialog } from '@/components/QuotePreviewDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Eye, FileText, Mail, CheckCircle2, Trash2, Loader2, AlertCircle } from 'lucide-react'

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

const statusColors: Record<WorkshopRequestStatus, string> = {
  'leeg': 'bg-gray-100 text-gray-800 border-gray-300',
  'informatie verstrekt': 'bg-blue-100 text-blue-800 border-blue-300',
  'offerte gemaakt': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'bevestigde opdracht': 'bg-green-100 text-green-800 border-green-300',
}

const statusLabels: Record<WorkshopRequestStatus, string> = {
  'leeg': 'Leeg',
  'informatie verstrekt': 'Info Verstrekt',
  'offerte gemaakt': 'Offerte Gemaakt',
  'bevestigde opdracht': 'Bevestigd',
}

const statusIcons: Record<WorkshopRequestStatus, React.ReactNode> = {
  'leeg': <FileText className="h-3 w-3" />,
  'informatie verstrekt': <Mail className="h-3 w-3" />,
  'offerte gemaakt': <Mail className="h-3 w-3" />,
  'bevestigde opdracht': <CheckCircle2 className="h-3 w-3" />,
}

export default function WorkshopsPage() {
  const [requests, setRequests] = useState<WorkshopRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    requestId: number
    currentStatus: WorkshopRequestStatus
    newStatus: WorkshopRequestStatus
    requestData?: {
      contactName?: string | null
      email?: string | null
      activityType?: string | null
    }
  } | null>(null)

  const [processingRequests, setProcessingRequests] = useState<Set<number>>(new Set())
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [statusFilter])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const url = statusFilter === 'all'
        ? '/api/workshops/requests'
        : `/api/workshops/requests?status=${statusFilter}`

      const response = await fetch(url)
      const data = await response.json()
      setRequests(data.requests || [])
    } catch (error) {
      console.error('Failed to fetch requests:', error)
      showToast('Kon aanvragen niet laden', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
  }

  const handleViewDetails = (requestId: number) => {
    setSelectedRequestId(requestId)
    setSheetOpen(true)
  }

  const handleCloseSheet = () => {
    setSheetOpen(false)
    setTimeout(() => setSelectedRequestId(null), 300) // Wait for animation
  }

  const openStatusChangeDialog = (
    requestId: number,
    currentStatus: WorkshopRequestStatus,
    newStatus: WorkshopRequestStatus,
    requestData?: {
      contactName?: string | null
      email?: string | null
      activityType?: string | null
    }
  ) => {
    setPendingStatusChange({ requestId, currentStatus, newStatus, requestData })
    setConfirmDialogOpen(true)
  }

  const handleConfirmStatusChange = async () => {
    if (!pendingStatusChange) return

    const { requestId, newStatus } = pendingStatusChange

    setProcessingRequests(prev => new Set(prev).add(requestId))
    setConfirmDialogOpen(false)

    try {
      const response = await fetch(`/api/workshops/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) throw new Error('Failed to update status')

      const data = await response.json()

      // Show appropriate success message
      if (newStatus === 'offerte gemaakt') {
        showToast('✅ Offerte verstuurd naar klant', 'success')
      } else if (newStatus === 'bevestigde opdracht') {
        showToast('✅ Workshop bevestigd en aangemaakt', 'success')
      } else {
        showToast('✅ Status bijgewerkt', 'success')
      }

      if (data.confirmedWorkshop) {
        console.log('Confirmed workshop created:', data.confirmedWorkshop)
      }

      await fetchRequests()
    } catch (error) {
      console.error('Failed to update status:', error)
      showToast('❌ Kon status niet bijwerken', 'error')
    } finally {
      setProcessingRequests(prev => {
        const next = new Set(prev)
        next.delete(requestId)
        return next
      })
      setPendingStatusChange(null)
    }
  }

  const handleDelete = async (requestId: number, contactName: string | null) => {
    if (!confirm(`Weet je zeker dat je deze aanvraag wilt verwijderen?\n\nKlant: ${contactName || 'Onbekend'}`)) {
      return
    }

    setProcessingRequests(prev => new Set(prev).add(requestId))

    try {
      const response = await fetch(`/api/workshops/requests/${requestId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete')

      showToast('🗑️ Aanvraag verwijderd', 'success')
      await fetchRequests()
    } catch (error) {
      console.error('Failed to delete request:', error)
      showToast('❌ Kon aanvraag niet verwijderen', 'error')
    } finally {
      setProcessingRequests(prev => {
        const next = new Set(prev)
        next.delete(requestId)
        return next
      })
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getNextStatusButton = (request: WorkshopRequest) => {
    const isProcessing = processingRequests.has(request.id)

    switch (request.status) {
      case 'leeg':
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openStatusChangeDialog(
              request.id,
              request.status,
              'informatie verstrekt',
              {
                contactName: request.contactName,
                email: request.email,
                activityType: request.activityType,
              }
            )}
            disabled={isProcessing}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Info Verstrekken
          </Button>
        )

      case 'informatie verstrekt':
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openStatusChangeDialog(
              request.id,
              request.status,
              'offerte gemaakt',
              {
                contactName: request.contactName,
                email: request.email,
                activityType: request.activityType,
              }
            )}
            disabled={isProcessing}
            className="flex items-center gap-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Offerte Versturen
          </Button>
        )

      case 'offerte gemaakt':
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => openStatusChangeDialog(
              request.id,
              request.status,
              'bevestigde opdracht',
              {
                contactName: request.contactName,
                email: request.email,
                activityType: request.activityType,
              }
            )}
            disabled={isProcessing}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Bevestigen
          </Button>
        )

      case 'bevestigde opdracht':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-300 flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3" />
            Voltooid
          </Badge>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-4" />
          <p className="text-lg text-gray-600">Workshop aanvragen laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 max-w-md rounded-lg shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-top-5 ${
            toast.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          )}
          <p className={`text-sm font-medium ${
            toast.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {toast.message}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Workshop Aanvragen</h1>
        <p className="text-gray-600">Beheer workshop aanvragen en track hun status</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Filter op status:</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Statussen ({requests.length})</SelectItem>
              <SelectItem value="leeg">Leeg</SelectItem>
              <SelectItem value="informatie verstrekt">Info Verstrekt</SelectItem>
              <SelectItem value="offerte gemaakt">Offerte Gemaakt</SelectItem>
              <SelectItem value="bevestigde opdracht">Bevestigd</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold">ID</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Activiteit</TableHead>
              <TableHead className="font-semibold">Datum</TableHead>
              <TableHead className="font-semibold">Deelnemers</TableHead>
              <TableHead className="font-semibold">Aangemaakt</TableHead>
              <TableHead className="font-semibold text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">Geen aanvragen gevonden</p>
                  <p className="text-sm mt-1">Probeer een ander filter</p>
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => {
                const isProcessing = processingRequests.has(request.id)

                return (
                  <TableRow
                    key={request.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      isProcessing ? 'opacity-60' : ''
                    }`}
                  >
                    <TableCell className="font-medium">
                      #{request.id}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[request.status]} border flex items-center gap-2 w-fit`}>
                        {statusIcons[request.status]}
                        {statusLabels[request.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">
                          {request.contactName || '-'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.email || '-'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-900">
                      {request.activityType || '-'}
                    </TableCell>
                    <TableCell className="text-gray-900">
                      {formatDate(request.preferredDate)}
                    </TableCell>
                    <TableCell className="text-gray-900">
                      {request.participants || '-'}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {formatDate(request.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        {/* View Details */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(request.id)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Details
                        </Button>

                        {/* Quote Preview (only if status >= informatie verstrekt) */}
                        {(request.status === 'informatie verstrekt' ||
                          request.status === 'offerte gemaakt' ||
                          request.status === 'bevestigde opdracht') && (
                          <QuotePreviewDialog
                            requestId={request.id}
                            requestData={{
                              contactName: request.contactName || '',
                              email: request.email || '',
                              organization: request.organization,
                              activityType: request.activityType || '',
                              participants: request.participants || 0,
                              preferredDate: request.preferredDate
                                ? new Date(request.preferredDate).toISOString()
                                : null,
                              location: request.location,
                            }}
                            aiGeneratedEmailContent={request.aiGeneratedEmailContent}
                            quotePdfUrl={request.quotePdfUrl}
                            onSendQuote={
                              request.status === 'informatie verstrekt'
                                ? async () => {
                                    await handleConfirmStatusChange()
                                  }
                                : undefined
                            }
                          />
                        )}

                        {/* Next Status Action */}
                        {getNextStatusButton(request)}

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(request.id, request.contactName)}
                          disabled={isProcessing}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Sheet */}
      <WorkshopRequestSheet
        requestId={selectedRequestId}
        isOpen={sheetOpen}
        onClose={handleCloseSheet}
        onUpdate={fetchRequests}
      />

      {/* Status Change Confirmation Dialog */}
      {pendingStatusChange && (
        <ConfirmStatusChangeDialog
          isOpen={confirmDialogOpen}
          onClose={() => {
            setConfirmDialogOpen(false)
            setPendingStatusChange(null)
          }}
          currentStatus={pendingStatusChange.currentStatus}
          newStatus={pendingStatusChange.newStatus}
          onConfirm={handleConfirmStatusChange}
          requestData={pendingStatusChange.requestData}
        />
      )}
    </div>
  )
}
