'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Trash2, Loader2, Mail, MailOpen, Eye, Star } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'

type Feedback = {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  rating: number | null
  isRead: boolean
  createdAt: string
}

export default function FeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selected, setSelected] = useState<Feedback | null>(null)

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/content/feedback')
      const data = await res.json()
      setItems(data.items || [])
    } catch {
      toast.error('Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const toggleRead = async (item: Feedback) => {
    try {
      await fetch('/api/content/feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isRead: !item.isRead })
      })
      toast.success(item.isRead ? 'Marked as unread' : 'Marked as read')
      fetchItems()
    } catch {
      toast.error('Failed to update')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this feedback?')) return
    try {
      await fetch(`/api/content/feedback?id=${id}`, { method: 'DELETE' })
      toast.success('Feedback deleted')
      setSheetOpen(false)
      fetchItems()
    } catch {
      toast.error('Delete failed')
    }
  }

  const openDetail = async (item: Feedback) => {
    setSelected(item)
    setSheetOpen(true)
    if (!item.isRead) {
      await fetch('/api/content/feedback', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, isRead: true })
      })
      fetchItems()
    }
  }

  const unreadCount = items.filter(i => !i.isRead).length

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contact Feedback</h1>
          <p className="text-muted-foreground">
            {items.length} submissions{unreadCount > 0 && ` (${unreadCount} unread)`}
          </p>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className={!item.isRead ? 'bg-blue-50/50' : ''}>
                <TableCell>
                  {item.isRead ? <MailOpen className="h-4 w-4 text-muted-foreground" /> : <Mail className="h-4 w-4 text-blue-600" />}
                </TableCell>
                <TableCell className="font-medium">
                  {item.name}
                  <span className="block text-sm text-muted-foreground">{item.email}</span>
                </TableCell>
                <TableCell className="max-w-xs truncate">{item.subject || '—'}</TableCell>
                <TableCell>
                  {item.rating ? (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{item.rating}/5</span>
                    </div>
                  ) : '—'}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: nl })}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openDetail(item)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => toggleRead(item)}>
                      {item.isRead ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No feedback submissions yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>Feedback Details</SheetTitle>
            <SheetDescription>Submitted {selected && formatDistanceToNow(new Date(selected.createdAt), { addSuffix: true, locale: nl })}</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="space-y-4 mt-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">From</p>
                <p className="font-medium">{selected.name}</p>
                <p className="text-sm">{selected.email}</p>
                {selected.phone && <p className="text-sm">{selected.phone}</p>}
              </div>
              {selected.subject && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Subject</p>
                  <p>{selected.subject}</p>
                </div>
              )}
              {selected.rating && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rating</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} className={`h-5 w-5 ${n <= selected.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                    ))}
                    <span className="ml-2">{selected.rating}/5</span>
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Message</p>
                <p className="whitespace-pre-wrap">{selected.message}</p>
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => toggleRead(selected)} className="flex-1">
                  {selected.isRead ? <><Mail className="h-4 w-4 mr-2" />Mark Unread</> : <><MailOpen className="h-4 w-4 mr-2" />Mark Read</>}
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(selected.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />Delete
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
