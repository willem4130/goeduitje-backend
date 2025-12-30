'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Plus, Pencil, Trash2, Loader2, Star } from 'lucide-react'
import { toast } from 'sonner'

type Testimonial = {
  id: string
  quote: string
  author: string
  role: string | null
  company: string | null
  rating: number
  isFeatured: boolean
  isPublished: boolean
}

export default function TestimonialsPage() {
  const [items, setItems] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Testimonial | null>(null)
  const [formData, setFormData] = useState({ quote: '', author: '', role: '', company: '', rating: 5, isFeatured: false, isPublished: true })

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/content/testimonials')
      const data = await res.json()
      setItems(data.items || [])
    } catch {
      toast.error('Failed to load testimonials')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const handleSubmit = async () => {
    try {
      const method = editing ? 'PUT' : 'POST'
      const body = editing ? { ...formData, id: editing.id } : formData
      const res = await fetch('/api/content/testimonials', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed')
      toast.success(editing ? 'Testimonial updated' : 'Testimonial created')
      setSheetOpen(false)
      setEditing(null)
      setFormData({ quote: '', author: '', role: '', company: '', rating: 5, isFeatured: false, isPublished: true })
      fetchItems()
    } catch {
      toast.error('Operation failed')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this testimonial?')) return
    try {
      await fetch(`/api/content/testimonials?id=${id}`, { method: 'DELETE' })
      toast.success('Testimonial deleted')
      fetchItems()
    } catch {
      toast.error('Delete failed')
    }
  }

  const openEdit = (item: Testimonial) => {
    setEditing(item)
    setFormData({ quote: item.quote, author: item.author, role: item.role || '', company: item.company || '', rating: item.rating, isFeatured: item.isFeatured, isPublished: item.isPublished })
    setSheetOpen(true)
  }

  const openNew = () => {
    setEditing(null)
    setFormData({ quote: '', author: '', role: '', company: '', rating: 5, isFeatured: false, isPublished: true })
    setSheetOpen(true)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Testimonials</h1>
          <p className="text-muted-foreground">Manage customer testimonials</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add Testimonial</Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="max-w-xs truncate">{item.quote}</TableCell>
                <TableCell>{item.author}</TableCell>
                <TableCell>{item.company || '—'}</TableCell>
                <TableCell><div className="flex">{Array(item.rating).fill(0).map((_, i) => <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />)}</div></TableCell>
                <TableCell>{item.isFeatured ? '★' : '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No testimonials yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>{editing ? 'Edit Testimonial' : 'New Testimonial'}</SheetTitle>
            <SheetDescription>Fill in the testimonial details</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div><Label>Quote</Label><Textarea value={formData.quote} onChange={e => setFormData({...formData, quote: e.target.value})} className="min-h-24" /></div>
            <div><Label>Author Name</Label><Input value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} /></div>
            <div><Label>Role</Label><Input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="HR Manager" /></div>
            <div><Label>Company</Label><Input value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} /></div>
            <div><Label>Rating (1-5)</Label><Input type="number" min={1} max={5} value={formData.rating} onChange={e => setFormData({...formData, rating: parseInt(e.target.value) || 5})} /></div>
            <div className="flex items-center gap-2"><Switch checked={formData.isFeatured} onCheckedChange={(v: boolean) => setFormData({...formData, isFeatured: v})} /><Label>Featured</Label></div>
            <div className="flex items-center gap-2"><Switch checked={formData.isPublished} onCheckedChange={(v: boolean) => setFormData({...formData, isPublished: v})} /><Label>Published</Label></div>
            <Button onClick={handleSubmit} className="w-full">{editing ? 'Save Changes' : 'Create Testimonial'}</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
