'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Trash2, Loader2, CheckCircle2, Clock, Euro, Star } from 'lucide-react'
import { toast } from 'sonner'

type Workshop = {
  id: number
  requestId: number
  confirmedDate: string
  startTime: string | null
  endTime: string | null
  actualParticipants: number | null
  locationName: string | null
  locationCity: string | null
  leadInstructor: string | null
  workshopNotes: string | null
  customerSatisfaction: number | null
  paymentStatus: 'pending' | 'partial' | 'paid'
  completedAt: string | null
  contactName: string | null
  email: string | null
  organization: string | null
  activityType: string | null
  participants: number | null
  finalPrice: string | null
}

const paymentColors = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  partial: 'bg-blue-100 text-blue-800 border-blue-300',
  paid: 'bg-green-100 text-green-800 border-green-300',
}

const paymentLabels = {
  pending: 'Openstaand',
  partial: 'Deels betaald',
  paid: 'Betaald',
}

export default function ConfirmedWorkshopsPage() {
  const [items, setItems] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Workshop | null>(null)
  const [formData, setFormData] = useState({
    confirmedDate: '',
    startTime: '',
    endTime: '',
    actualParticipants: 0,
    locationName: '',
    locationCity: '',
    leadInstructor: 'Guus van den Elzen',
    workshopNotes: '',
    customerSatisfaction: 0,
    paymentStatus: 'pending' as 'pending' | 'partial' | 'paid',
  })

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/workshops/confirmed')
      const data = await res.json()
      setItems(data.workshops || [])
    } catch {
      toast.error('Failed to load workshops')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const handleSubmit = async () => {
    if (!editing) return
    try {
      const res = await fetch('/api/workshops/confirmed', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: editing.id })
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Workshop updated')
      setSheetOpen(false)
      setEditing(null)
      fetchItems()
    } catch {
      toast.error('Update failed')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this workshop?')) return
    try {
      await fetch(`/api/workshops/confirmed?id=${id}`, { method: 'DELETE' })
      toast.success('Workshop deleted')
      fetchItems()
    } catch {
      toast.error('Delete failed')
    }
  }

  const markComplete = async (workshop: Workshop) => {
    try {
      await fetch('/api/workshops/confirmed', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: workshop.id, completedAt: new Date().toISOString() })
      })
      toast.success('Workshop marked as completed')
      fetchItems()
    } catch {
      toast.error('Update failed')
    }
  }

  const openEdit = (item: Workshop) => {
    setEditing(item)
    setFormData({
      confirmedDate: item.confirmedDate || '',
      startTime: item.startTime || '',
      endTime: item.endTime || '',
      actualParticipants: item.actualParticipants || item.participants || 0,
      locationName: item.locationName || '',
      locationCity: item.locationCity || '',
      leadInstructor: item.leadInstructor || 'Guus van den Elzen',
      workshopNotes: item.workshopNotes || '',
      customerSatisfaction: item.customerSatisfaction || 0,
      paymentStatus: item.paymentStatus || 'pending',
    })
    setSheetOpen(true)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '—'
    return new Date(date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const upcomingCount = items.filter(w => !w.completedAt && new Date(w.confirmedDate) >= new Date()).length
  const pendingPayment = items.filter(w => w.paymentStatus === 'pending').length

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Bevestigde Workshops</h1>
          <p className="text-muted-foreground">
            {items.length} workshops • {upcomingCount} aankomend • {pendingPayment} openstaand
          </p>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Klant</TableHead>
              <TableHead>Activiteit</TableHead>
              <TableHead>Locatie</TableHead>
              <TableHead>Deelnemers</TableHead>
              <TableHead>Betaling</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className={item.completedAt ? 'bg-gray-50' : ''}>
                <TableCell className="font-medium">
                  {formatDate(item.confirmedDate)}
                  {item.startTime && <span className="block text-sm text-muted-foreground">{item.startTime}{item.endTime && ` - ${item.endTime}`}</span>}
                </TableCell>
                <TableCell>
                  {item.contactName}
                  {item.organization && <span className="block text-sm text-muted-foreground">{item.organization}</span>}
                </TableCell>
                <TableCell>{item.activityType}</TableCell>
                <TableCell>
                  {item.locationName || item.locationCity || '—'}
                  {item.locationName && item.locationCity && <span className="block text-sm text-muted-foreground">{item.locationCity}</span>}
                </TableCell>
                <TableCell>{item.actualParticipants || item.participants || '—'}</TableCell>
                <TableCell>
                  <Badge className={`${paymentColors[item.paymentStatus]} border`}>
                    <Euro className="h-3 w-3 mr-1" />
                    {paymentLabels[item.paymentStatus]}
                  </Badge>
                  {item.finalPrice && <span className="block text-sm text-muted-foreground mt-1">€{item.finalPrice}</span>}
                </TableCell>
                <TableCell>
                  {item.completedAt ? (
                    <Badge className="bg-green-100 text-green-800 border-green-300 border">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Voltooid
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-300 border">
                      <Clock className="h-3 w-3 mr-1" />
                      Gepland
                    </Badge>
                  )}
                  {item.customerSatisfaction && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm">{item.customerSatisfaction}/5</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    {!item.completedAt && (
                      <Button variant="ghost" size="icon" onClick={() => markComplete(item)}><CheckCircle2 className="h-4 w-4" /></Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Geen bevestigde workshops</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Workshop Bewerken</SheetTitle>
            <SheetDescription>{editing?.contactName} - {editing?.activityType}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Datum</Label><Input type="date" value={formData.confirmedDate} onChange={e => setFormData({...formData, confirmedDate: e.target.value})} /></div>
              <div><Label>Deelnemers</Label><Input type="number" value={formData.actualParticipants} onChange={e => setFormData({...formData, actualParticipants: parseInt(e.target.value) || 0})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Start tijd</Label><Input type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} /></div>
              <div><Label>Eind tijd</Label><Input type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} /></div>
            </div>
            <div><Label>Locatie</Label><Input value={formData.locationName} onChange={e => setFormData({...formData, locationName: e.target.value})} /></div>
            <div><Label>Stad</Label><Input value={formData.locationCity} onChange={e => setFormData({...formData, locationCity: e.target.value})} /></div>
            <div><Label>Instructeur</Label><Input value={formData.leadInstructor} onChange={e => setFormData({...formData, leadInstructor: e.target.value})} /></div>
            <div>
              <Label>Betaalstatus</Label>
              <Select value={formData.paymentStatus} onValueChange={(v: 'pending' | 'partial' | 'paid') => setFormData({...formData, paymentStatus: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Openstaand</SelectItem>
                  <SelectItem value="partial">Deels betaald</SelectItem>
                  <SelectItem value="paid">Betaald</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Klanttevredenheid (1-5)</Label>
              <Input type="number" min="1" max="5" value={formData.customerSatisfaction || ''} onChange={e => setFormData({...formData, customerSatisfaction: parseInt(e.target.value) || 0})} />
            </div>
            <div><Label>Notities</Label><Textarea value={formData.workshopNotes} onChange={e => setFormData({...formData, workshopNotes: e.target.value})} className="min-h-24" /></div>
            <Button onClick={handleSubmit} className="w-full">Opslaan</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
