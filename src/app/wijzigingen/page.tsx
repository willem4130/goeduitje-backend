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
import { Plus, ExternalLink, MessageSquare, Check, AlertCircle, Clock, Loader2, Image as ImageIcon, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'

type SessionChange = {
  id: string
  title: string
  description: string | null
  category: string | null
  filesChanged: string[] | null
  changeDetails: string[] | null
  viewUrl: string | null
  status: 'pending' | 'approved' | 'needs_changes'
  addedBy: string | null
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
  pending: { label: 'Te beoordelen', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Goedgekeurd', color: 'bg-green-100 text-green-800', icon: Check },
  needs_changes: { label: 'Aanpassen', color: 'bg-red-100 text-red-800', icon: AlertCircle },
}

const categories = ['Contact', 'Navigatie', 'Content', 'Design', 'Bug', 'Feature', 'Performance']

export default function WijzigingenPage() {
  const [items, setItems] = useState<SessionChange[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  // Detail sheet state
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedChange, setSelectedChange] = useState<SessionChange | null>(null)
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loadingFeedback, setLoadingFeedback] = useState(false)

  // Add sheet state
  const [addOpen, setAddOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    viewUrl: '',
    filesChanged: '',
    changeDetails: '',
    addedBy: 'developer',
  })

  // Feedback form state
  const [newFeedback, setNewFeedback] = useState('')
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null)
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  const fetchItems = useCallback(async () => {
    try {
      const url = activeTab === 'all' ? '/api/changes' : `/api/changes?status=${activeTab}`
      const res = await fetch(url)
      const data = await res.json()
      setItems(data.items || [])
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

  const handleStatusChange = async (status: string) => {
    if (!selectedChange) return
    try {
      await fetch(`/api/changes/${selectedChange.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      toast.success('Status bijgewerkt')
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
    try {
      const body = {
        ...formData,
        filesChanged: formData.filesChanged.split('\n').filter(Boolean),
        changeDetails: formData.changeDetails.split('\n').filter(Boolean),
      }
      const res = await fetch('/api/changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Wijziging toegevoegd')
      setAddOpen(false)
      setFormData({ title: '', description: '', category: '', viewUrl: '', filesChanged: '', changeDetails: '', addedBy: 'developer' })
      fetchItems()
    } catch {
      toast.error('Kon wijziging niet toevoegen')
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
      toast.success('Wijziging verwijderd')
      setDetailOpen(false)
      fetchItems()
    } catch {
      toast.error('Kon niet verwijderen')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Wijzigingen</h1>
          <p className="text-muted-foreground">Bekijk en valideer ontwikkelingswijzigingen</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-2" />Nieuwe Wijziging</Button>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">Alles ({items.length})</TabsTrigger>
          <TabsTrigger value="pending">Te beoordelen</TabsTrigger>
          <TabsTrigger value="approved">Goedgekeurd</TabsTrigger>
          <TabsTrigger value="needs_changes">Aanpassen</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Changes Grid */}
      <div className="grid gap-4">
        {items.map((item) => {
          const StatusIcon = statusConfig[item.status].icon
          return (
            <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(item)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    {item.description && <CardDescription className="mt-1">{item.description}</CardDescription>}
                  </div>
                  <div className="flex gap-2 ml-4">
                    {item.category && <Badge variant="outline">{item.category}</Badge>}
                    <Badge className={statusConfig[item.status].color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig[item.status].label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {item.viewUrl && (
                    <span className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      Bekijk live
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Feedback
                  </span>
                  <span className="ml-auto text-xs">
                    {new Date(item.createdAt).toLocaleDateString('nl-NL')}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {items.length === 0 && (
          <Card className="py-12">
            <CardContent className="text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Geen wijzigingen gevonden</p>
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
              <div className="mt-6 space-y-6">
                {/* Status Select */}
                <div>
                  <Label>Status</Label>
                  <Select value={selectedChange.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Te beoordelen</SelectItem>
                      <SelectItem value="approved">Goedgekeurd</SelectItem>
                      <SelectItem value="needs_changes">Aanpassen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description */}
                {selectedChange.description && (
                  <div>
                    <Label>Beschrijving</Label>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedChange.description}</p>
                  </div>
                )}

                {/* Files */}
                {selectedChange.filesChanged && selectedChange.filesChanged.length > 0 && (
                  <div>
                    <Label>Aangepaste bestanden</Label>
                    <ul className="mt-1 text-sm font-mono bg-muted p-2 rounded">
                      {selectedChange.filesChanged.map((f, i) => <li key={i}>{f}</li>)}
                    </ul>
                  </div>
                )}

                {/* Details */}
                {selectedChange.changeDetails && selectedChange.changeDetails.length > 0 && (
                  <div>
                    <Label>Wijzigingen</Label>
                    <ul className="mt-1 text-sm list-disc list-inside">
                      {selectedChange.changeDetails.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </div>
                )}

                {/* View URL */}
                {selectedChange.viewUrl && (
                  <div>
                    <a href={selectedChange.viewUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                      <ExternalLink className="h-4 w-4" />
                      Bekijk live
                    </a>
                  </div>
                )}

                {/* Feedback Section */}
                <div className="border-t pt-6">
                  <Label className="text-base font-semibold">Feedback ({feedback.length})</Label>

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
                      {feedback.length === 0 && <p className="text-sm text-muted-foreground py-2">Nog geen feedback</p>}
                    </div>
                  )}

                  {/* Add Feedback Form */}
                  <div className="mt-4 space-y-3 bg-muted/50 p-4 rounded-lg">
                    <Textarea
                      placeholder="Schrijf feedback..."
                      value={newFeedback}
                      onChange={(e) => setNewFeedback(e.target.value)}
                      className="min-h-20"
                    />
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                        />
                        <Upload className="h-4 w-4" />
                        {screenshotFile ? screenshotFile.name : 'Screenshot uploaden'}
                      </label>
                      {screenshotFile && (
                        <Button variant="ghost" size="sm" onClick={() => setScreenshotFile(null)}>Verwijder</Button>
                      )}
                    </div>
                    <Button onClick={handleFeedbackSubmit} disabled={submittingFeedback} className="w-full">
                      {submittingFeedback ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                      Feedback versturen
                    </Button>
                  </div>
                </div>

                {/* Delete */}
                <div className="border-t pt-4">
                  <Button variant="destructive" onClick={() => handleDelete(selectedChange.id)} className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Wijziging verwijderen
                  </Button>
                </div>
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
            <Button onClick={handleAddSubmit} className="w-full">Wijziging toevoegen</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
