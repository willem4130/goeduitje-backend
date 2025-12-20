'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface QuotePreviewDialogProps {
  requestId: number
  requestData: {
    contactName: string
    email: string
    organization?: string | null
    activityType: string
    participants: number
    preferredDate?: string | null
    location?: string | null
  }
  aiGeneratedEmailContent?: string | null
  quotePdfUrl?: string | null
}

export function QuotePreviewDialog({
  requestId,
  requestData,
  aiGeneratedEmailContent,
  quotePdfUrl,
}: QuotePreviewDialogProps) {
  const [generating, setGenerating] = useState(false)
  const [previewData, setPreviewData] = useState<{
    email: string
    pdfUrl?: string
    systemPrompt?: string
    apiModel?: string
    temperature?: number
    maxTokens?: number
  } | null>(null)

  const generatePreview = async () => {
    setGenerating(true)
    try {
      const response = await fetch(`/api/workshops/requests/${requestId}/preview-quote`, {
        method: 'POST',
      })
      const data = await response.json()
      setPreviewData(data)
    } catch (error) {
      console.error('Failed to generate preview:', error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {aiGeneratedEmailContent ? 'View Quote' : 'Preview Quote'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quote Preview - Request #{requestId}</DialogTitle>
          <DialogDescription>
            {requestData.contactName} - {requestData.activityType} - {requestData.participants} participants
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email">Generated Email</TabsTrigger>
            <TabsTrigger value="prompt">System Prompt</TabsTrigger>
            <TabsTrigger value="parameters">API Parameters</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            {aiGeneratedEmailContent ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-medium">✅ Quote email sent</p>
                  {quotePdfUrl && (
                    <a
                      href={quotePdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline block mt-2"
                    >
                      📄 View PDF Quote
                    </a>
                  )}
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold mb-4">Email Content:</h3>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {aiGeneratedEmailContent}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    Generate a preview of the quote email using AI before sending.
                  </p>
                </div>
                <Button onClick={generatePreview} disabled={generating}>
                  {generating ? 'Generating...' : 'Generate Preview'}
                </Button>
                {previewData && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold mb-4">Email Preview:</h3>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {previewData.email}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="prompt" className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold mb-4">Guus's System Prompt:</h3>
              <div className="whitespace-pre-wrap text-xs leading-relaxed font-mono bg-white p-4 rounded border overflow-x-auto">
                {previewData?.systemPrompt || 'Generate preview to view system prompt...'}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="parameters" className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold mb-4">AI API Configuration:</h3>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Model</dt>
                  <dd className="text-sm mt-1">{previewData?.apiModel || 'claude-3-haiku-20240307'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Temperature</dt>
                  <dd className="text-sm mt-1">{previewData?.temperature || 0.7}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Max Tokens</dt>
                  <dd className="text-sm mt-1">{previewData?.maxTokens || 2048}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Provider</dt>
                  <dd className="text-sm mt-1">Anthropic Claude API</dd>
                </div>
              </dl>
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Request Data Sent to AI:</h4>
                <pre className="bg-white p-4 rounded border text-xs overflow-x-auto">
                  {JSON.stringify(requestData, null, 2)}
                </pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
