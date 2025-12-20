'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { EditShowSheet } from '@/components/EditShowSheet'

type Show = {
  id: number
  bandId: string
  title: string
  date: string
  time: string
  venueName: string
  venueCity: string
  isPast: boolean
  soldOut: boolean
}

export default function Home() {
  const [shows, setShows] = useState<Show[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'full-band' | 'unplugged'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'past'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'city'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingShowId, setEditingShowId] = useState<number | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const fetchShows = () => {
    fetch('/api/shows')
      .then(res => res.json())
      .then(data => {
        setShows(data)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchShows()
  }, [])

  const deleteShow = async (id: number) => {
    if (!confirm('Delete this show?')) return

    await fetch(`/api/shows/${id}`, { method: 'DELETE' })
    setShows(shows.filter(s => s.id !== id))
  }

  const handleEditShow = (id: number) => {
    setEditingShowId(id)
    setSheetOpen(true)
  }

  const handleSheetSuccess = () => {
    fetchShows()
  }

  const filteredShows = shows
    .filter(s => filter === 'all' || s.bandId === filter)
    .filter(s => {
      if (statusFilter === 'upcoming') return !s.isPast
      if (statusFilter === 'past') return s.isPast
      return true
    })
    .filter(s => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        s.venueName.toLowerCase().includes(query) ||
        s.venueCity.toLowerCase().includes(query) ||
        s.title.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        const comparison = a.date.localeCompare(b.date)
        return sortOrder === 'asc' ? comparison : -comparison
      } else {
        const comparison = a.venueCity.localeCompare(b.venueCity)
        return sortOrder === 'asc' ? comparison : -comparison
      }
    })

  const formatDutchDate = (isoDate: string) => {
    const [year, month, day] = isoDate.split('-')
    return `${day}-${month}-${year}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Shows Management</h1>
        <Link href="/shows/new">
          <Button size="lg">Add New Show</Button>
        </Link>
      </div>

      <Card className="p-6 mb-6">
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">Search Shows</label>
          <Input
            type="text"
            placeholder="Search by venue, city, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Found {filteredShows.length} show{filteredShows.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Band:</label>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'full-band' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('full-band')}
              >
                Full Band
              </Button>
              <Button
                variant={filter === 'unplugged' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('unplugged')}
              >
                Unplugged
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Status:</label>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'upcoming' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('upcoming')}
              >
                Upcoming
              </Button>
              <Button
                variant={statusFilter === 'past' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('past')}
              >
                Past
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Sort by:</label>
            <Select value={sortBy} onValueChange={(value: 'date' | 'city') => setSortBy(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="city">City</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Band</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <p className="text-muted-foreground">
                    No shows found.{' '}
                    <Link href="/shows/new" className="text-primary hover:underline">
                      Add your first show
                    </Link>
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredShows.map(show => (
                <TableRow key={show.id}>
                  <TableCell className="font-medium">
                    {formatDutchDate(show.date)} {show.time}
                  </TableCell>
                  <TableCell>{show.venueName}</TableCell>
                  <TableCell>{show.venueCity}</TableCell>
                  <TableCell>
                    <Badge variant={show.bandId === 'full-band' ? 'default' : 'secondary'}>
                      {show.bandId === 'full-band' ? 'Full Band' : 'Unplugged'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {show.isPast && (
                        <Badge variant="outline" className="text-muted-foreground">
                          Past
                        </Badge>
                      )}
                      {show.soldOut && (
                        <Badge variant="destructive">Sold Out</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditShow(show.id)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteShow(show.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <EditShowSheet
        showId={editingShowId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={handleSheetSuccess}
      />
    </div>
  )
}
