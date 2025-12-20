'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { QuotePreviewDialog } from '@/components/QuotePreviewDialog'

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
  'informatie verstrekt': 'Informatie Verstrekt',
  'offerte gemaakt': 'Offerte Gemaakt',
  'bevestigde opdracht': 'Bevestigde Opdracht',
}

export default function WorkshopsPage() {
  const [requests, setRequests] = useState<WorkshopRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const router = useRouter()

  useEffect(() => {
    fetchRequests()
  }, [statusFilter])

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
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (requestId: number, newStatus: WorkshopRequestStatus) => {
    try {
      const response = await fetch(`/api/workshops/requests/${requestId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Status updated:', data.message)
        if (data.confirmedWorkshop) {
          console.log('Confirmed workshop created:', data.confirmedWorkshop)
        }
        fetchRequests() // Refresh list
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const handleDelete = async (requestId: number) => {
    if (!confirm('Are you sure you want to delete this workshop request?')) {
      return
    }

    try {
      const response = await fetch(`/api/workshops/requests/${requestId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchRequests() // Refresh list
      }
    } catch (error) {
      console.error('Failed to delete request:', error)
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('nl-NL')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading workshop requests...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Workshop Requests</h1>
        <p className="text-gray-600">Manage workshop inquiries and track their status</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Filter by Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-md"
          >
            <option value="all">All Statuses</option>
            <option value="leeg">Leeg</option>
            <option value="informatie verstrekt">Informatie Verstrekt</option>
            <option value="offerte gemaakt">Offerte Gemaakt</option>
            <option value="bevestigde opdracht">Bevestigde Opdracht</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preferred Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Participants
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  No workshop requests found
                </td>
              </tr>
            ) : (
              requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{request.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${statusColors[request.status]}`}>
                      {statusLabels[request.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{request.contactName || '-'}</div>
                    <div className="text-sm text-gray-500">{request.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.activityType || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(request.preferredDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {request.participants || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(request.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2 items-center">
                      {/* Quote Preview/View Button */}
                      {(request.status === 'informatie verstrekt' || request.status === 'offerte gemaakt' || request.status === 'bevestigde opdracht') && (
                        <QuotePreviewDialog
                          requestId={request.id}
                          requestData={{
                            contactName: request.contactName || '',
                            email: request.email || '',
                            organization: request.organization,
                            activityType: request.activityType || '',
                            participants: request.participants || 0,
                            preferredDate: request.preferredDate ? new Date(request.preferredDate).toISOString() : null,
                            location: request.location,
                          }}
                          aiGeneratedEmailContent={request.aiGeneratedEmailContent}
                          quotePdfUrl={request.quotePdfUrl}
                        />
                      )}

                      {/* Status workflow buttons */}
                      {request.status === 'leeg' && (
                        <button
                          onClick={() => handleStatusChange(request.id, 'informatie verstrekt')}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Info Sent
                        </button>
                      )}
                      {request.status === 'informatie verstrekt' && (
                        <button
                          onClick={() => handleStatusChange(request.id, 'offerte gemaakt')}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Send Quote
                        </button>
                      )}
                      {request.status === 'offerte gemaakt' && (
                        <button
                          onClick={() => handleStatusChange(request.id, 'bevestigde opdracht')}
                          className="text-green-600 hover:text-green-900"
                        >
                          Confirm
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(request.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
