'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Mail, Sparkles, Loader2, Eye, Send } from 'lucide-react'

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
  onSendQuote?: () => Promise<void>
}

export function QuotePreviewDialog({
  requestId,
  requestData,
  aiGeneratedEmailContent,
  quotePdfUrl,
  onSendQuote,
}: QuotePreviewDialogProps) {
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<{
    email: string
    pdfUrl?: string
    systemPrompt?: string
    apiModel?: string
    temperature?: number
    maxTokens?: number
  } | null>(null)

  const isQuoteSent = !!aiGeneratedEmailContent
  const hasPreview = !!previewData

  const generatePreview = async () => {
    setGenerating(true)
    setError(null)
    try {
      const response = await fetch(`/api/workshops/requests/${requestId}/preview-quote`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to generate preview')
      const data = await response.json()
      setPreviewData(data)
    } catch (err) {
      setError('Kon preview niet genereren. Probeer het opnieuw.')
      console.error('Failed to generate preview:', err)
    } finally {
      setGenerating(false)
    }
  }

  const handleSendQuote = async () => {
    if (!onSendQuote) return

    setSending(true)
    setError(null)
    try {
      await onSendQuote()
      // Dialog will close automatically after successful send
    } catch (err) {
      setError('Kon offerte niet versturen. Probeer het opnieuw.')
      console.error('Failed to send quote:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          {isQuoteSent ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Bekijk Offerte
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Preview Offerte
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-600" />
                Offerte Preview - Aanvraag #{requestId}
              </DialogTitle>
              <DialogDescription className="mt-2">
                <div className="flex flex-col gap-1">
                  <span>{requestData.contactName} ({requestData.email})</span>
                  <span className="text-xs">{requestData.activityType} • {requestData.participants} deelnemers</span>
                </div>
              </DialogDescription>
            </div>
            {isQuoteSent && (
              <Badge className="bg-green-100 text-green-800 border-green-300 flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3" />
                Verstuurd
              </Badge>
            )}
          </div>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Fout</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email">Email Preview</TabsTrigger>
            <TabsTrigger value="prompt">AI Prompt</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            {isQuoteSent ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-green-800 font-medium">Offerte verstuurd naar klant</p>
                      <p className="text-xs text-green-700 mt-1">
                        Email is succesvol verzonden naar {requestData.email}
                      </p>
                    </div>
                  </div>
                  {quotePdfUrl && (
                    <a
                      href={quotePdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-2 mt-3"
                    >
                      📄 Download PDF Offerte
                    </a>
                  )}
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Verstuurde Email:</h3>
                    <Badge variant="outline" className="text-xs">
                      AI-gegenereerd
                    </Badge>
                  </div>
                  <div className="bg-gray-50 p-4 rounded border">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {aiGeneratedEmailContent}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800 font-medium">Genereer een preview zonder te versturen</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Test hoe de AI-gegenereerde offerte eruit ziet voordat je deze naar de klant stuurt
                      </p>
                    </div>
                  </div>
                </div>

                {!hasPreview && (
                  <Button
                    onClick={generatePreview}
                    disabled={generating}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Preview genereren...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4" />
                        Genereer Preview
                      </>
                    )}
                  </Button>
                )}

                {hasPreview && (
                  <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Email Preview:</h3>
                        <Badge variant="outline" className="text-xs">
                          Test - Niet verstuurd
                        </Badge>
                      </div>
                      <div className="bg-gray-50 p-4 rounded border">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {previewData.email}
                        </div>
                      </div>
                    </div>

                    {/* Send Now Action */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-900">Klaar om te versturen?</p>
                          <p className="text-xs text-yellow-700 mt-1">
                            Deze email wordt verstuurd naar <strong>{requestData.email}</strong> met een PDF offerte bijlage.
                          </p>
                        </div>
                      </div>
                      {onSendQuote && (
                        <Button
                          onClick={handleSendQuote}
                          disabled={sending}
                          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                        >
                          {sending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Offerte versturen...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Verstuur Offerte Nu
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="prompt" className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Guus's Dynamische System Prompt</h3>
                <Badge variant="outline" className="text-xs">
                  Database-driven
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mb-4">
                Deze prompt wordt dynamisch gegenereerd met actuele prijzen, locaties en activiteiten uit de database.
              </p>
              <div className="whitespace-pre-wrap text-xs leading-relaxed font-mono bg-white p-4 rounded border overflow-x-auto max-h-96">
                {previewData?.systemPrompt || 'Genereer preview om de system prompt te zien...'}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="parameters" className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold mb-4">AI API Configuratie</h3>
              <dl className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-3 rounded border">
                  <dt className="text-xs font-medium text-gray-500 mb-1">Model</dt>
                  <dd className="text-sm font-mono">{previewData?.apiModel || 'claude-3-haiku-20240307'}</dd>
                </div>
                <div className="bg-white p-3 rounded border">
                  <dt className="text-xs font-medium text-gray-500 mb-1">Temperature</dt>
                  <dd className="text-sm font-mono">{previewData?.temperature || 0.7}</dd>
                </div>
                <div className="bg-white p-3 rounded border">
                  <dt className="text-xs font-medium text-gray-500 mb-1">Max Tokens</dt>
                  <dd className="text-sm font-mono">{previewData?.maxTokens || 2048}</dd>
                </div>
                <div className="bg-white p-3 rounded border">
                  <dt className="text-xs font-medium text-gray-500 mb-1">Provider</dt>
                  <dd className="text-sm font-mono">Anthropic Claude</dd>
                </div>
              </dl>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Request Data:</h4>
                <pre className="bg-white p-4 rounded border text-xs overflow-x-auto font-mono">
                  {JSON.stringify(requestData, null, 2)}
                </pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {isQuoteSent ? 'Offerte is al verstuurd' : 'Preview wordt niet opgeslagen'}
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
