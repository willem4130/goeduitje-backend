'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type FAQ = {
  id: string
  question: string
  answer: string
  category: string
  sortOrder: number
  isPublished: boolean
}

export default function FAQPage() {
  const [items, setItems] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<FAQ | null>(null)
  const [formData, setFormData] = useState({ question: '', answer: '', category: '', sortOrder: 0, isPublished: true })

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/content/faq')
      const data = await res.json()
      setItems(data.items || [])
    } catch {
      toast.error('Failed to load FAQ items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const handleSubmit = async () => {
    try {
      const method = editing ? 'PUT' : 'POST'
      const body = editing ? { ...formData, id: editing.id } : formData
      const res = await fetch('/api/content/faq', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed')
      toast.success(editing ? 'FAQ updated' : 'FAQ created')
      setSheetOpen(false)
      setEditing(null)
      setFormData({ question: '', answer: '', category: '', sortOrder: 0, isPublished: true })
      fetchItems()
    } catch {
      toast.error('Operation failed')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this FAQ?')) return
    try {
      await fetch(`/api/content/faq?id=${id}`, { method: 'DELETE' })
      toast.success('FAQ deleted')
      fetchItems()
    } catch {
      toast.error('Delete failed')
    }
  }

  const openEdit = (item: FAQ) => {
    setEditing(item)
    setFormData({ question: item.question, answer: item.answer, category: item.category, sortOrder: item.sortOrder, isPublished: item.isPublished })
    setSheetOpen(true)
  }

  const openNew = () => {
    setEditing(null)
    setFormData({ question: '', answer: '', category: '', sortOrder: 0, isPublished: true })
    setSheetOpen(true)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">FAQ Management</h1>
          <p className="text-muted-foreground">Manage FAQ items for the website</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add FAQ</Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium max-w-md truncate">{item.question}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.sortOrder}</TableCell>
                <TableCell>{item.isPublished ? '✓' : '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No FAQ items yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>{editing ? 'Edit FAQ' : 'New FAQ'}</SheetTitle>
            <SheetDescription>Fill in the FAQ details</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div><Label>Question</Label><Input value={formData.question} onChange={e => setFormData({...formData, question: e.target.value})} /></div>
            <div><Label>Answer</Label><Textarea value={formData.answer} onChange={e => setFormData({...formData, answer: e.target.value})} className="min-h-32" /></div>
            <div><Label>Category</Label><Input value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Algemeen, Boeken, Betaling..." /></div>
            <div><Label>Sort Order</Label><Input type="number" value={formData.sortOrder} onChange={e => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})} /></div>
            <div className="flex items-center gap-2"><Switch checked={formData.isPublished} onCheckedChange={(v: boolean) => setFormData({...formData, isPublished: v})} /><Label>Published</Label></div>
            <Button onClick={handleSubmit} className="w-full">{editing ? 'Save Changes' : 'Create FAQ'}</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
