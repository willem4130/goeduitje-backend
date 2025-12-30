'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Pencil, Trash2, Loader2, FileText, Search } from 'lucide-react'
import { toast } from 'sonner'

type PageContent = {
  id: string
  page: string
  section: string
  key: string
  value: string
  type: string
}

export default function PageContentPage() {
  const [items, setItems] = useState<PageContent[]>([])
  const [loading, setLoading] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<PageContent | null>(null)
  const [formData, setFormData] = useState({ page: '', section: '', key: '', value: '', type: 'text' })
  const [pageFilter, setPageFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/content/pages')
      const data = await res.json()
      setItems(data.items || [])
    } catch {
      toast.error('Failed to load page content')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const handleSubmit = async () => {
    try {
      const method = editing ? 'PUT' : 'POST'
      const body = editing ? { ...formData, id: editing.id } : formData
      const res = await fetch('/api/content/pages', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error('Failed')
      toast.success(editing ? 'Content updated' : 'Content created')
      setSheetOpen(false)
      setEditing(null)
      setFormData({ page: '', section: '', key: '', value: '', type: 'text' })
      fetchItems()
    } catch {
      toast.error('Operation failed')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this content?')) return
    try {
      await fetch(`/api/content/pages?id=${id}`, { method: 'DELETE' })
      toast.success('Content deleted')
      fetchItems()
    } catch {
      toast.error('Delete failed')
    }
  }

  const openEdit = (item: PageContent) => {
    setEditing(item)
    setFormData({ page: item.page, section: item.section, key: item.key, value: item.value, type: item.type })
    setSheetOpen(true)
  }

  const openNew = () => {
    setEditing(null)
    setFormData({ page: '', section: '', key: '', value: '', type: 'text' })
    setSheetOpen(true)
  }

  // Get unique pages for filter
  const pages = [...new Set(items.map(i => i.page))].sort()

  // Filter items
  const filteredItems = items.filter(item => {
    if (pageFilter !== 'all' && item.page !== pageFilter) return false
    if (searchQuery) {
      const search = searchQuery.toLowerCase()
      return item.key.toLowerCase().includes(search) || item.value.toLowerCase().includes(search)
    }
    return true
  })

  // Group by page/section for display
  const groupedItems = filteredItems.reduce((acc, item) => {
    const groupKey = `${item.page}/${item.section}`
    if (!acc[groupKey]) acc[groupKey] = []
    acc[groupKey].push(item)
    return acc
  }, {} as Record<string, PageContent[]>)

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Page Content</h1>
          <p className="text-muted-foreground">Manage editable text blocks on the website</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Add Content</Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <Select value={pageFilter} onValueChange={setPageFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by page" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pages</SelectItem>
              {pages.map(page => <SelectItem key={page} value={page}>{page}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search content..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
      </div>

      {Object.keys(groupedItems).length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="font-medium">No content found</p>
          <p className="text-sm">Add your first content block to get started</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([groupKey, groupItems]) => {
            const [page, section] = groupKey.split('/')
            return (
              <div key={groupKey} className="border rounded-lg">
                <div className="px-4 py-2 bg-muted/50 border-b">
                  <span className="font-medium">{page}</span>
                  <span className="text-muted-foreground"> / {section}</span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48">Key</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead className="w-24">Type</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">{item.key}</TableCell>
                        <TableCell className="max-w-md truncate">{item.value}</TableCell>
                        <TableCell className="text-muted-foreground">{item.type}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          })}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>{editing ? 'Edit Content' : 'New Content'}</SheetTitle>
            <SheetDescription>Define page content for the website</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div><Label>Page</Label><Input value={formData.page} onChange={e => setFormData({...formData, page: e.target.value})} placeholder="home, about, contact..." /></div>
            <div><Label>Section</Label><Input value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} placeholder="hero, features, cta..." /></div>
            <div><Label>Key</Label><Input value={formData.key} onChange={e => setFormData({...formData, key: e.target.value})} placeholder="title, description, buttonText..." /></div>
            <div>
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="textarea">Textarea</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="url">URL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Value</Label><Textarea value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} className="min-h-32" /></div>
            <Button onClick={handleSubmit} className="w-full">{editing ? 'Save Changes' : 'Create Content'}</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
