'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, ExternalLink, MessageSquare, Check, AlertCircle, Clock, Loader2, Trash2, Upload, Wrench, ThumbsUp, ThumbsDown, Eye, Undo2, RotateCcw, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

type SessionChange = {
  id: string
  title: string
  description: string | null
  category: string | null
  filesChanged: string[] | null
  changeDetails: string[] | null
  viewUrl: string | null
  screenshotUrl: string | null
  status: 'pending' | 'approved' | 'needs_changes' | 'in_progress'
  addedBy: string | null
  deletedAt: string | null
  createdAt: string
}

type Feedback = {
  id: string
  changeId: string
  feedbackText: string | null
  screenshotUrl: string | null
  createdAt: string
}

const statusConfig = {
  pending: { label: 'Te beoordelen', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  approved: { label: 'Goedgekeurd', color: 'bg-green-100 text-green-800 border-green-200', icon: Check },
  needs_changes: { label: 'Aanpassen', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle },
  in_progress: { label: 'In ontwikkeling', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: Wrench },
}

const categories = ['Contact', 'Navigatie', 'Content', 'Design', 'Bug', 'Feature', 'Performance']

export default function WijzigingenPage() {
  const [items, setItems] = useState<SessionChange[]>([])
  const [deletedItems, setDeletedItems] = useState<SessionChange[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Detail sheet state
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedChange, setSelectedChange] = useState<SessionChange | null>(null)
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loadingFeedback, setLoadingFeedback] = useState(false)

  // Add sheet state
  const [addOpen, setAddOpen] = useState(false)
  const [addSubmitting, setAddSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    viewUrl: '',
    filesChanged: '',
    changeDetails: '',
    addedBy: 'developer',
  })
  const [addScreenshot, setAddScreenshot] = useState<File | null>(null)

  // Feedback form state
  const [newFeedback, setNewFeedback] = useState('')
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  const fetchItems = useCallback(async () => {
    try {
      if (activeTab === 'deleted') {
        const res = await fetch('/api/changes?deleted=true')
        const data = await res.json()
        setDeletedItems(data.items || [])
        setItems([])
      } else {
        const url = activeTab === 'all' ? '/api/changes' : `/api/changes?status=${activeTab}`
        const res = await fetch(url)
        const data = await res.json()
        setItems(data.items || [])
        // Also fetch deleted count
        const deletedRes = await fetch('/api/changes?deleted=true')
        const deletedData = await deletedRes.json()
        setDeletedItems(deletedData.items || [])
      }
    } catch {
      toast.error('Kon wijzigingen niet laden')
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => { fetchItems() }, [fetchItems])

  const fetchFeedback = async (changeId: string) => {
    setLoadingFeedback(true)
    try {
      const res = await fetch(`/api/changes/${changeId}/feedback`)
      const data = await res.json()
      setFeedback(data.feedback || [])
    } catch {
      toast.error('Kon feedback niet laden')
    } finally {
      setLoadingFeedback(false)
    }
  }

  const openDetail = (item: SessionChange) => {
    setSelectedChange(item)
    setDetailOpen(true)
    fetchFeedback(item.id)
  }

  // Quick status update (for card buttons)
  const quickUpdateStatus = async (e: React.MouseEvent, id: string, status: string) => {
    e.stopPropagation()
    setUpdatingId(id)
    try {
      await fetch(`/api/changes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (status === 'approved') {
        toast.success('✓ Goedgekeurd! (zie "Goedgekeurd" tab)')
      } else if (status === 'needs_changes') {
        toast.success('Gemarkeerd voor aanpassing (zie "Aanpassen" tab)')
      } else if (status === 'pending') {
        toast.success('Teruggezet naar "Te beoordelen"')
      }
      fetchItems()
    } catch {
      toast.error('Kon status niet bijwerken')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!selectedChange) return
    try {
      await fetch(`/api/changes/${selectedChange.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (status === 'approved') {
        toast.success('✓ Goedgekeurd!')
      } else if (status === 'needs_changes') {
        toast.success('Gemarkeerd voor aanpassing')
      } else if (status === 'pending') {
        toast.success('Teruggezet naar "Te beoordelen"')
      } else {
        toast.success('Status bijgewerkt')
      }
      setSelectedChange({ ...selectedChange, status: status as SessionChange['status'] })
      fetchItems()
    } catch {
      toast.error('Kon status niet bijwerken')
    }
  }

  const handleAddSubmit = async () => {
    if (!formData.title) {
      toast.error('Titel is verplicht')
      return
    }
    setAddSubmitting(true)
    try {
      const formDataObj = new FormData()
      formDataObj.append('title', formData.title)
      formDataObj.append('description', formData.description)
      formDataObj.append('category', formData.category)
      formDataObj.append('viewUrl', formData.viewUrl)
      formDataObj.append('filesChanged', formData.filesChanged)
      formDataObj.append('changeDetails', formData.changeDetails)
      formDataObj.append('addedBy', formData.addedBy)
      if (addScreenshot) {
        formDataObj.append('screenshot', addScreenshot)
      }

      const res = await fetch('/api/changes', {
        method: 'POST',
        body: formDataObj,
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Wijziging toegevoegd')
      setAddOpen(false)
      setFormData({ title: '', description: '', category: '', viewUrl: '', filesChanged: '', changeDetails: '', addedBy: 'developer' })
      setAddScreenshot(null)
      fetchItems()
    } catch {
      toast.error('Kon wijziging niet toevoegen')
    } finally {
      setAddSubmitting(false)
    }
  }

  const handleFeedbackSubmit = async () => {
    if (!selectedChange || (!newFeedback && !screenshotFile)) {
      toast.error('Voeg tekst of screenshot toe')
      return
    }
    setSubmittingFeedback(true)
    try {
      const formDataObj = new FormData()
      if (newFeedback) formDataObj.append('feedbackText', newFeedback)
      if (screenshotFile) formDataObj.append('screenshot', screenshotFile)

      const res = await fetch(`/api/changes/${selectedChange.id}/feedback`, {
        method: 'POST',
        body: formDataObj,
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Feedback toegevoegd')
      setNewFeedback('')
      setScreenshotFile(null)
      fetchFeedback(selectedChange.id)
    } catch {
      toast.error('Kon feedback niet toevoegen')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const handleDeleteFeedback = async (feedbackId: string) => {
    if (!selectedChange || !confirm('Feedback verwijderen?')) return
    try {
      await fetch(`/api/changes/${selectedChange.id}/feedback?feedbackId=${feedbackId}`, { method: 'DELETE' })
      toast.success('Feedback verwijderd')
      fetchFeedback(selectedChange.id)
    } catch {
      toast.error('Kon feedback niet verwijderen')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deze wijziging verwijderen?')) return
    try {
      await fetch(`/api/changes/${id}`, { method: 'DELETE' })
      toast.success('Verplaatst naar prullenbak')
      setDetailOpen(false)
      fetchItems()
    } catch {
      toast.error('Kon niet verwijderen')
    }
  }

  const handleRestore = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setUpdatingId(id)
    try {
      await fetch(`/api/changes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restore: true }),
      })
      toast.success('Wijziging hersteld')
      fetchItems()
    } catch {
      toast.error('Kon niet herstellen')
    } finally {
      setUpdatingId(null)
    }
  }

  const handlePermanentDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Definitief verwijderen? Dit kan niet ongedaan worden gemaakt.')) return
    setUpdatingId(id)
    try {
      await fetch(`/api/changes/${id}?permanent=true`, { method: 'DELETE' })
      toast.success('Definitief verwijderd')
      fetchItems()
    } catch {
      toast.error('Kon niet verwijderen')
    } finally {
      setUpdatingId(null)
    }
  }

  const pendingCount = items.filter(i => i.status === 'pending').length
  const displayItems = activeTab === 'deleted' ? deletedItems : items

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Wijzigingen</h1>
          <p className="text-muted-foreground">
            {activeTab === 'deleted' ? (
              <span className="text-gray-500">Verwijderde items - herstel of verwijder definitief</span>
            ) : pendingCount > 0 ? (
              <span className="text-yellow-600 font-medium">{pendingCount} wijziging{pendingCount !== 1 ? 'en' : ''} wacht{pendingCount === 1 ? '' : 'en'} op uw beoordeling</span>
            ) : (
              'Alle wijzigingen zijn beoordeeld'
            )}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} variant="outline"><Plus className="h-4 w-4 mr-2" />Nieuwe Wijziging</Button>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">Alles ({items.length})</TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-100">
            Te beoordelen {pendingCount > 0 && <Badge className="ml-2 bg-yellow-500">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="in_progress">In ontwikkeling</TabsTrigger>
          <TabsTrigger value="approved">Goedgekeurd</TabsTrigger>
          <TabsTrigger value="needs_changes">Aanpassen</TabsTrigger>
          {deletedItems.length > 0 && (
            <TabsTrigger value="deleted" className="text-muted-foreground">
              <Trash2 className="h-3 w-3 mr-1" />Verwijderd ({deletedItems.length})
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>

      {/* Changes Grid */}
      <div className="grid gap-4">
        {displayItems.map((item) => {
          const StatusIcon = statusConfig[item.status]?.icon || Clock
          const isInProgress = item.status === 'in_progress'
          const isPending = item.status === 'pending'
          const isDeleted = activeTab === 'deleted'
          const isUpdating = updatingId === item.id

          return (
            <Card
              key={item.id}
              className={`transition-all ${isInProgress ? 'opacity-50 bg-gray-50' : ''} ${isPending ? 'border-yellow-200 bg-yellow-50/30' : ''} ${isDeleted ? 'opacity-60 bg-gray-50' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 cursor-pointer" onClick={() => !isDeleted && openDetail(item)}>
                    <div className="flex items-center gap-2">
                      <CardTitle className={`text-lg ${isInProgress || isDeleted ? 'text-gray-400' : ''}`}>{item.title}</CardTitle>
                      {item.screenshotUrl && <ImageIcon className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    {item.description && <CardDescription className="mt-1">{item.description}</CardDescription>}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.category && <Badge variant="outline" className={isInProgress || isDeleted ? 'opacity-50' : ''}>{item.category}</Badge>}
                    {!isDeleted && (
                      <Badge className={statusConfig[item.status]?.color || 'bg-gray-100'}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[item.status]?.label || item.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center justify-between">
                  {/* Left side - links */}
                  <div className="flex items-center gap-3 text-sm">
                    {!isDeleted && item.viewUrl && (
                      <a
                        href={item.viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <Eye className="h-4 w-4" />
                        Bekijk live
                      </a>
                    )}
                    {!isDeleted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetail(item)}
                        className={isPending ? "border-primary text-primary hover:bg-primary/10 font-medium" : ""}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        {isPending ? "Bekijk details eerst →" : "Details & Feedback"}
                      </Button>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString('nl-NL')}
                    </span>
                  </div>

                  {/* Right side - actions */}
                  <div className="flex items-center gap-2">
                    {isDeleted ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleRestore(e, item.id)}
                          disabled={isUpdating}
                        >
                          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-1" />}
                          Herstellen
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => handlePermanentDelete(e, item.id)}
                          disabled={isUpdating}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Definitief
                        </Button>
                      </>
                    ) : (
                      <>
                        {isPending && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              onClick={(e) => quickUpdateStatus(e, item.id, 'needs_changes')}
                              disabled={isUpdating}
                            >
                              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsDown className="h-4 w-4 mr-1" />}
                              Aanpassen
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={(e) => quickUpdateStatus(e, item.id, 'approved')}
                              disabled={isUpdating}
                            >
                              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4 mr-1" />}
                              Goedkeuren
                            </Button>
                          </>
                        )}

                        {(item.status === 'approved' || item.status === 'needs_changes') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={(e) => quickUpdateStatus(e, item.id, 'pending')}
                            disabled={isUpdating}
                          >
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4 mr-1" />}
                            Ongedaan maken
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {displayItems.length === 0 && (
          <Card className="py-12">
            <CardContent className="text-center text-muted-foreground">
              {activeTab === 'deleted' ? (
                <>
                  <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Prullenbak is leeg</p>
                </>
              ) : (
                <>
                  <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-lg font-medium">Geen wijzigingen gevonden</p>
                  <p className="text-sm mt-1">Alle wijzigingen in deze categorie zijn afgehandeld</p>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          {selectedChange && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedChange.title}</SheetTitle>
              </SheetHeader>

              {/* Quick Action Bar for pending items */}
              {selectedChange.status === 'pending' && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-3 font-medium">Beoordeel deze wijziging:</p>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleStatusChange('approved')}
                    >
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Goedkeuren
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleStatusChange('needs_changes')}
                    >
                      <ThumbsDown className="h-4 w-4 mr-2" />
                      Aanpassen nodig
                    </Button>
                  </div>
                </div>
              )}

              {/* Undo bar for approved items */}
              {selectedChange.status === 'approved' && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-800">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">Goedgekeurd</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusChange('pending')}
                    className="text-green-700 hover:text-green-900 hover:bg-green-100"
                  >
                    <Undo2 className="h-4 w-4 mr-1" />
                    Ongedaan maken
                  </Button>
                </div>
              )}

              {/* Undo bar for needs_changes items */}
              {selectedChange.status === 'needs_changes' && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Aanpassen nodig</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusChange('pending')}
                    className="text-red-700 hover:text-red-900 hover:bg-red-100"
                  >
                    <Undo2 className="h-4 w-4 mr-1" />
                    Ongedaan maken
                  </Button>
                </div>
              )}

              <div className="mt-6 space-y-6">
                {/* Current Status */}
                <div>
                  <Label>Status</Label>
                  <Select value={selectedChange.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Te beoordelen</SelectItem>
                      <SelectItem value="in_progress">In ontwikkeling</SelectItem>
                      <SelectItem value="approved">Goedgekeurd</SelectItem>
                      <SelectItem value="needs_changes">Aanpassen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Screenshot */}
                {selectedChange.screenshotUrl && (
                  <div>
                    <Label>Screenshot</Label>
                    <a href={selectedChange.screenshotUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                      <img src={selectedChange.screenshotUrl} alt="Screenshot" className="max-h-48 rounded border hover:opacity-90" />
                    </a>
                  </div>
                )}

                {/* View URL - Prominent */}
                {selectedChange.viewUrl && (
                  <a
                    href={selectedChange.viewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <ExternalLink className="h-5 w-5" />
                    <span className="font-medium">Bekijk wijziging live op de website</span>
                  </a>
                )}

                {/* Description */}
                {selectedChange.description && (
                  <div>
                    <Label>Beschrijving</Label>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedChange.description}</p>
                  </div>
                )}

                {/* Details */}
                {selectedChange.changeDetails && selectedChange.changeDetails.length > 0 && (
                  <div>
                    <Label>Wat is er aangepast?</Label>
                    <ul className="mt-1 text-sm list-disc list-inside space-y-1">
                      {selectedChange.changeDetails.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                )}

                {/* Files (collapsed by default - developer info) */}
                {selectedChange.filesChanged && selectedChange.filesChanged.length > 0 && (
                  <details className="group">
                    <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                      Technische details ({selectedChange.filesChanged.length} bestanden)
                    </summary>
                    <ul className="mt-2 text-xs font-mono bg-muted p-2 rounded">
                      {selectedChange.filesChanged.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </details>
                )}

                {/* Feedback Section */}
                <div className="border-t pt-6">
                  <Label className="text-base font-semibold">Feedback ({feedback.length})</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Voeg opmerkingen of screenshots toe als u iets wilt aanpassen
                  </p>

                  {loadingFeedback ? (
                    <div className="py-4 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {feedback.map((fb) => (
                        <div key={fb.id} className="bg-muted p-3 rounded-lg relative group">
                          {fb.feedbackText && <p className="text-sm">{fb.feedbackText}</p>}
                          {fb.screenshotUrl && (
                            <a href={fb.screenshotUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block">
                              <img src={fb.screenshotUrl} alt="Screenshot" className="max-h-40 rounded border" />
                            </a>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(fb.createdAt).toLocaleString('nl-NL')}
                            </span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteFeedback(fb.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {feedback.length === 0 && <p className="text-sm text-muted-foreground py-2 italic">Nog geen feedback toegevoegd</p>}
                    </div>
                  )}

                  {/* Add Feedback Form */}
                  <div className="mt-4 space-y-3 bg-muted/50 p-4 rounded-lg border">
                    <Label>Nieuwe feedback</Label>
                    <Textarea
                      placeholder="Beschrijf wat er aangepast moet worden..."
                      value={newFeedback}
                      onChange={(e) => setNewFeedback(e.target.value)}
                      className="min-h-20"
                    />
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground border rounded-md px-3 py-2">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                        />
                        <Upload className="h-4 w-4" />
                        {screenshotFile ? screenshotFile.name : 'Screenshot toevoegen'}
                      </label>
                      {screenshotFile && (
                        <Button variant="ghost" size="sm" onClick={() => setScreenshotFile(null)}>×</Button>
                      )}
                    </div>
                    <Button onClick={handleFeedbackSubmit} disabled={submittingFeedback} className="w-full">
                      {submittingFeedback ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                      Feedback versturen
                    </Button>
                  </div>
                </div>

                {/* Delete - less prominent */}
                <details className="border-t pt-4">
                  <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                    Geavanceerde opties
                  </summary>
                  <Button variant="destructive" onClick={() => handleDelete(selectedChange.id)} className="w-full mt-3" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Wijziging verwijderen
                  </Button>
                </details>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nieuwe Wijziging</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <Label>Titel *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Bijv. Contact formulier verbeterd" />
            </div>
            <div>
              <Label>Beschrijving</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Korte beschrijving van de wijziging..." />
            </div>
            <div>
              <Label>Categorie</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                <SelectTrigger><SelectValue placeholder="Selecteer categorie" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Screenshot / Afbeelding</Label>
              <div className="mt-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground border rounded-md px-3 py-2 w-full">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setAddScreenshot(e.target.files?.[0] || null)}
                  />
                  <Upload className="h-4 w-4" />
                  {addScreenshot ? addScreenshot.name : 'Afbeelding toevoegen'}
                </label>
                {addScreenshot && (
                  <Button variant="ghost" size="sm" onClick={() => setAddScreenshot(null)} className="mt-1">Verwijderen</Button>
                )}
              </div>
            </div>
            <div>
              <Label>Link naar wijziging</Label>
              <Input value={formData.viewUrl} onChange={(e) => setFormData({...formData, viewUrl: e.target.value})} placeholder="https://goeduitje-nl-rebuild.vercel.app/..." />
            </div>
            <div>
              <Label>Aangepaste bestanden (1 per regel)</Label>
              <Textarea value={formData.filesChanged} onChange={(e) => setFormData({...formData, filesChanged: e.target.value})} placeholder="src/components/contact-form.tsx&#10;src/components/footer.tsx" className="font-mono text-sm" />
            </div>
            <div>
              <Label>Wijzigingen (1 per regel)</Label>
              <Textarea value={formData.changeDetails} onChange={(e) => setFormData({...formData, changeDetails: e.target.value})} placeholder="Mail icoon toegevoegd&#10;Footer opgeschoond" />
            </div>
            <div>
              <Label>Toegevoegd door</Label>
              <Select value={formData.addedBy} onValueChange={(v) => setFormData({...formData, addedBy: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="client">Klant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddSubmit} disabled={addSubmitting} className="w-full">
              {addSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Wijziging toevoegen
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
