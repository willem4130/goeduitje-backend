'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Show = {
  id: number
  bandId: string
  title: string
  date: string
  time: string
  venueName: string
  venueCity: string
  venueCountry: string
  venueAddress: string | null
  ticketUrl: string | null
  soldOut: boolean
  isPast: boolean
}

type EditShowSheetProps = {
  showId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditShowSheet({ showId, open, onOpenChange, onSuccess }: EditShowSheetProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    bandId: 'full-band',
    title: '',
    date: '',
    time: '20:00',
    venueName: '',
    venueCity: '',
    venueCountry: 'Netherlands',
    venueAddress: '',
    ticketUrl: '',
    soldOut: false,
    isPast: false,
  })

  useEffect(() => {
    if (showId && open) {
      setLoading(true)
      fetch(`/api/shows/${showId}`)
        .then(res => res.json())
        .then((data: Show) => {
          setFormData({
            bandId: data.bandId,
            title: data.title,
            date: data.date.split('T')[0],
            time: data.time,
            venueName: data.venueName,
            venueCity: data.venueCity,
            venueCountry: data.venueCountry,
            venueAddress: data.venueAddress || '',
            ticketUrl: data.ticketUrl || '',
            soldOut: data.soldOut,
            isPast: data.isPast,
          })
          setLoading(false)
        })
    }
  }, [showId, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showId) return

    setLoading(true)
    const res = await fetch(`/api/shows/${showId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (res.ok) {
      setLoading(false)
      onOpenChange(false)
      onSuccess()
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Show</SheetTitle>
          <SheetDescription>
            Update the show details below. Changes are saved immediately.
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Band</label>
              <Select
                value={formData.bandId}
                onValueChange={(value) => setFormData({ ...formData, bandId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-band">The Dutch Queen (Full Band)</SelectItem>
                  <SelectItem value="unplugged">The Dutch Queen Unplugged</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Show Title</label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time</label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Venue Name</label>
              <Input
                type="text"
                value={formData.venueName}
                onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <Input
                  type="text"
                  value={formData.venueCity}
                  onChange={(e) => setFormData({ ...formData, venueCity: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Country</label>
                <Input
                  type="text"
                  value={formData.venueCountry}
                  onChange={(e) => setFormData({ ...formData, venueCountry: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Venue Address</label>
              <Input
                type="text"
                value={formData.venueAddress}
                onChange={(e) => setFormData({ ...formData, venueAddress: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ticket URL</label>
              <Input
                type="url"
                value={formData.ticketUrl}
                onChange={(e) => setFormData({ ...formData, ticketUrl: e.target.value })}
                placeholder="https://"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="soldOut"
                  checked={formData.soldOut}
                  onChange={(e) => setFormData({ ...formData, soldOut: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="soldOut" className="text-sm font-medium cursor-pointer">
                  Sold Out
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPast"
                  checked={formData.isPast}
                  onChange={(e) => setFormData({ ...formData, isPast: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isPast" className="text-sm font-medium cursor-pointer">
                  Mark as Past Show
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}
