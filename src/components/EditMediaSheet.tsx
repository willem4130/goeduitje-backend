'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Download, ZoomIn, X } from 'lucide-react'

interface MediaItem {
  id: number
  blobUrl: string
  fileName: string
  caption: string | null
  altText: string | null
  category: string | null
  tags: string[] | null
  width: number | null
  height: number | null
  fileSize: number | null
  mimeType: string
  showOnWebsite: boolean
  featuredOnHomepage: boolean
}

interface EditMediaSheetProps {
  mediaId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditMediaSheet({ mediaId, open, onOpenChange, onSuccess }: EditMediaSheetProps) {
  const [loading, setLoading] = useState(false)
  const [mediaItem, setMediaItem] = useState<MediaItem | null>(null)
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false)
  const [formData, setFormData] = useState({
    caption: '',
    altText: '',
    category: 'workshop',
    showOnWebsite: false,
    featuredOnHomepage: false,
    tags: [] as string[],
  })
  const [tagsInput, setTagsInput] = useState('')

  useEffect(() => {
    if (mediaId && open) {
      fetch(`/api/media/${mediaId}`)
        .then(res => res.json())
        .then((data: MediaItem) => {
          setMediaItem(data)
          setFormData({
            caption: data.caption || '',
            altText: data.altText || '',
            category: data.category || 'workshop',
            showOnWebsite: data.showOnWebsite || false,
            featuredOnHomepage: data.featuredOnHomepage || false,
            tags: data.tags || [],
          })
          setTagsInput((data.tags || []).join(', '))
        })
    }
  }, [mediaId, open])

  const getMediaType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    return 'file'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mediaId) return

    setLoading(true)

    try {
      // Parse tags from comma-separated string
      const tagsArray = tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray,
        }),
      })

      if (!response.ok) throw new Error('Failed to update media')

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Update error:', error)
      alert('Failed to update media. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!mediaItem) return

    const link = document.createElement('a')
    link.href = mediaItem.blobUrl
    link.download = mediaItem.fileName || `media-${mediaItem.id}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size'
    const kb = bytes / 1024
    const mb = bytes / (1024 * 1024)

    if (mb >= 1) {
      return mb.toFixed(2) + ' MB'
    } else {
      return kb.toFixed(0) + ' KB'
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Media</SheetTitle>
            <SheetDescription>
              Update media information and metadata
            </SheetDescription>
          </SheetHeader>

          {mediaItem && (
            <div className="mt-6 space-y-6">
              {/* Image Preview Section */}
              {getMediaType(mediaItem.mimeType) === 'image' && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="relative group border rounded-lg overflow-hidden bg-muted">
                    <img
                      src={mediaItem.blobUrl}
                      alt={mediaItem.altText || mediaItem.caption || 'Media preview'}
                      className="w-full h-auto object-contain max-h-64"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setImagePreviewOpen(true)}
                      >
                        <ZoomIn className="w-4 h-4 mr-1" />
                        Enlarge
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={handleDownload}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    {mediaItem.width && mediaItem.height && (
                      <div>
                        <span className="font-medium">Dimensions:</span>{' '}
                        {mediaItem.width} × {mediaItem.height}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Size:</span>{' '}
                      {formatFileSize(mediaItem.fileSize)}
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="caption">Caption</Label>
                  <Input
                    id="caption"
                    value={formData.caption}
                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                    placeholder="Enter media caption"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="altText">Alt Text (Accessibility)</Label>
                  <Textarea
                    id="altText"
                    value={formData.altText}
                    onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
                    placeholder="Describe the image for screen readers"
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    This text will be used as alt text for accessibility
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Content Images */}
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="setup">Setup</SelectItem>
                      <SelectItem value="cooking">Cooking</SelectItem>
                      <SelectItem value="results">Results</SelectItem>
                      <SelectItem value="group">Group</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="venue">Venue</SelectItem>
                      {/* Site Assets */}
                      <SelectItem value="site-hero-video">🎬 Hero Video</SelectItem>
                      <SelectItem value="site-hero-poster">🖼️ Hero Poster</SelectItem>
                      <SelectItem value="site-logo">🏷️ Logo</SelectItem>
                      <SelectItem value="site-og">📱 Social/OG Image</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Display Options</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showOnWebsite"
                      checked={formData.showOnWebsite}
                      onChange={(e) => setFormData({ ...formData, showOnWebsite: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="showOnWebsite" className="font-normal cursor-pointer">
                      Show on website
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="featuredOnHomepage"
                      checked={formData.featuredOnHomepage}
                      onChange={(e) => setFormData({ ...formData, featuredOnHomepage: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="featuredOnHomepage" className="font-normal cursor-pointer">
                      Feature on homepage
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Enter tags separated by commas (e.g., team, outdoor, 2024)"
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate multiple tags with commas
                  </p>
                </div>

                <div className="flex gap-2 pt-4 border-t">
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
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Image Preview Dialog */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-7xl w-full p-0">
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          <div className="relative w-full">
            <button
              onClick={() => setImagePreviewOpen(false)}
              className="absolute top-4 right-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-background p-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
            {mediaItem && (
              <img
                src={mediaItem.blobUrl}
                alt={mediaItem.altText || mediaItem.caption || 'Media preview'}
                className="w-full h-auto max-h-[90vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
