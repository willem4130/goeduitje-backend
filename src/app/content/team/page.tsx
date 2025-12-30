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

type TeamMember = {
  id: string
  name: string
  role: string
  origin: string | null
  bio: string
  quote: string | null
  image: string | null
  sortOrder: number
  isPublished: boolean
}

export default function TeamPage() {
  const [items, setItems] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<TeamMember | null>(null)
  const [formData, setFormData] = useState({ name: '', role: '', origin: '', bio: '', quote: '', image: '', sortOrder: 0, isPublished: true })

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/content/team')
      const data = await res.json()
      setItems(data.items || [])
    } catch {
      toast.error('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const handleSubmit = async () => {
    try {
      const method = editing ? 'PUT' : 'POST'
      const body = editing ? { ...formData, id: editing.id } : formData
      const res = await fetch('/api/content/team', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed')
      toast.success(editing ? 'Team member updated' : 'Team member created')
      setSheetOpen(false)
      setEditing(null)
      setFormData({ name: '', role: '', origin: '', bio: '', quote: '', image: '', sortOrder: 0, isPublished: true })
      fetchItems()
    } catch {
      toast.error('Operation failed')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this team member?')) return
    try {
      await fetch(`/api/content/team?id=${id}`, { method: 'DELETE' })
      toast.success('Team member deleted')
      fetchItems()
    } catch {
      toast.error('Delete failed')
    }
  }

  const openEdit = (item: TeamMember) => {
    setEditing(item)
    setFormData({ name: item.name, role: item.role, origin: item.origin || '', bio: item.bio, quote: item.quote || '', image: item.image || '', sortOrder: item.sortOrder, isPublished: item.isPublished })
    setSheetOpen(true)
  }

  const openNew = () => {
    setEditing(null)
    setFormData({ name: '', role: '', origin: '', bio: '', quote: '', image: '', sortOrder: 0, isPublished: true })
    setSheetOpen(true)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground">Manage team members displayed on the website</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add Member</Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Origin</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Published</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.role}</TableCell>
                <TableCell>{item.origin || '—'}</TableCell>
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
            {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No team members yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing ? 'Edit Member' : 'New Member'}</SheetTitle>
            <SheetDescription>Fill in the team member details</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div><Label>Name</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div><Label>Role</Label><Input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} /></div>
            <div><Label>Origin</Label><Input value={formData.origin} onChange={e => setFormData({...formData, origin: e.target.value})} placeholder="Syria, Iran, etc." /></div>
            <div><Label>Bio</Label><Textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="min-h-32" /></div>
            <div><Label>Quote</Label><Textarea value={formData.quote} onChange={e => setFormData({...formData, quote: e.target.value})} /></div>
            <div><Label>Image URL</Label><Input value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} /></div>
            <div><Label>Sort Order</Label><Input type="number" value={formData.sortOrder} onChange={e => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})} /></div>
            <div className="flex items-center gap-2"><Switch checked={formData.isPublished} onCheckedChange={(v: boolean) => setFormData({...formData, isPublished: v})} /><Label>Published</Label></div>
            <Button onClick={handleSubmit} className="w-full">{editing ? 'Save Changes' : 'Create Member'}</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
