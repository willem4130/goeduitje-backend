'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Loader2, Star, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

type GoogleReview = {
  id: string
  googleReviewId: string
  authorName: string
  authorPhotoUrl: string | null
  rating: number
  text: string | null
  relativeTime: string
  reviewTime: string
  isVisible: boolean
  fetchedAt: string
  createdAt: string
}

export default function GoogleReviewsPage() {
  const [items, setItems] = useState<GoogleReview[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all')

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/google-reviews')
      const data = await res.json()
      setItems(data.items || [])
    } catch {
      toast.error('Failed to load Google reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchItems() }, [])

  const toggleVisibility = async (id: string, isVisible: boolean) => {
    try {
      const res = await fetch(`/api/google-reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible })
      })
      if (!res.ok) throw new Error('Failed')
      toast.success(isVisible ? 'Review shown on website' : 'Review hidden from website')
      fetchItems()
    } catch {
      toast.error('Failed to update visibility')
    }
  }

  const filteredItems = items.filter(item => {
    if (filter === 'visible') return item.isVisible
    if (filter === 'hidden') return !item.isVisible
    return true
  })

  const visibleCount = items.filter(i => i.isVisible).length
  const hiddenCount = items.filter(i => !i.isVisible).length

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Google Reviews</h1>
          <p className="text-muted-foreground">Manage which reviews appear on the website</p>
        </div>
        <Button variant="outline" onClick={fetchItems}>
          <RefreshCw className="h-4 w-4 mr-2" />Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-bold">{items.length}</div>
          <div className="text-sm text-muted-foreground">Total Reviews</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{visibleCount}</div>
          <div className="text-sm text-muted-foreground">Visible on Website</div>
        </div>
        <div className="border rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-400">{hiddenCount}</div>
          <div className="text-sm text-muted-foreground">Hidden</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
          All ({items.length})
        </Button>
        <Button variant={filter === 'visible' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('visible')}>
          <Eye className="h-4 w-4 mr-1" />Visible ({visibleCount})
        </Button>
        <Button variant={filter === 'hidden' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('hidden')}>
          <EyeOff className="h-4 w-4 mr-1" />Hidden ({hiddenCount})
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Show</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="max-w-md">Review</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id} className={!item.isVisible ? 'opacity-50' : ''}>
                <TableCell>
                  <Switch
                    checked={item.isVisible}
                    onCheckedChange={(v) => toggleVisibility(item.id, v)}
                  />
                </TableCell>
                <TableCell className="font-medium">{item.authorName}</TableCell>
                <TableCell>
                  <div className="flex">
                    {Array(item.rating).fill(0).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    {Array(5 - item.rating).fill(0).map((_, i) => (
                      <Star key={`empty-${i}`} className="h-4 w-4 text-gray-200" />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="max-w-md">
                  <p className="truncate text-sm">{item.text || <span className="italic text-muted-foreground">No text</span>}</p>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {item.reviewTime ? format(new Date(item.reviewTime), 'd MMM yyyy', { locale: nl }) : item.relativeTime}
                </TableCell>
                <TableCell>
                  <Badge variant={item.isVisible ? 'default' : 'secondary'}>
                    {item.isVisible ? 'Visible' : 'Hidden'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  {filter === 'all' ? 'No Google reviews synced yet' : `No ${filter} reviews`}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground mt-4">
        Reviews are automatically synced from Google. Toggle visibility to control which reviews appear on the website.
      </p>
    </div>
  )
}
