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
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Download,
  ZoomIn,
  X,
  Globe,
  Utensils,
  FileText,
  Sparkles,
  Play,
  Image as ImageIcon,
  Share2,
  LayoutTemplate,
  Images,
  Users,
  Quote,
  ChefHat,
  Folder,
  MapPin,
  Info,
  Check,
} from 'lucide-react'
import {
  MEDIA_CATEGORIES,
  CATEGORY_GROUPS,
  PREDEFINED_TAGS,
  getCategoryById,
  type MediaCategory,
  type MediaCategoryId,
  type PredefinedTag,
} from '@/lib/media-categories'

// Icon mapping
const ICONS: Record<string, React.ElementType> = {
  Globe,
  Utensils,
  FileText,
  Sparkles,
  Play,
  Image: ImageIcon,
  Share2,
  LayoutTemplate,
  Images,
  Users,
  Quote,
  ChefHat,
  Folder,
}

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
    category: 'general' as MediaCategoryId,
    showOnWebsite: false,
    featuredOnHomepage: false,
    tags: [] as string[],
  })

  const selectedCategory = getCategoryById(formData.category)

  useEffect(() => {
    if (mediaId && open) {
      fetch(`/api/media/${mediaId}`)
        .then(res => res.json())
        .then((data: MediaItem) => {
          setMediaItem(data)
          setFormData({
            caption: data.caption || '',
            altText: data.altText || '',
            category: (data.category as MediaCategoryId) || 'general',
            showOnWebsite: data.showOnWebsite || false,
            featuredOnHomepage: data.featuredOnHomepage || false,
            tags: data.tags || [],
          })
        })
    }
  }, [mediaId, open])

  const getMediaType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    return 'file'
  }

  const handleCategoryChange = (categoryId: MediaCategoryId) => {
    const category = getCategoryById(categoryId)
    if (category) {
      setFormData(prev => ({
        ...prev,
        category: categoryId,
        showOnWebsite: category.autoSettings.showOnWebsite,
        featuredOnHomepage: category.autoSettings.featuredOnHomepage,
        // Keep existing tags but ensure required tags are present
        tags: prev.tags,
      }))
    }
  }

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mediaId) return

    setLoading(true)

    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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
    if (!bytes) return 'Unknown'
    const mb = bytes / (1024 * 1024)
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(0)} KB`
  }

  // Get tags to show based on category
  const getTagsForCategory = (): { required: string[]; suggested: string[] } => {
    if (!selectedCategory) return { required: [], suggested: [] }
    return {
      required: selectedCategory.requiredTags || [],
      suggested: selectedCategory.suggestedTags || [],
    }
  }

  const { required: requiredTags, suggested: suggestedTags } = getTagsForCategory()

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Media</SheetTitle>
            <SheetDescription>
              Update media information and configure where it appears
            </SheetDescription>
          </SheetHeader>

          {mediaItem && (
            <div className="mt-6 space-y-6">
              {/* Preview Section */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Preview</Label>
                <div className="relative group border rounded-lg overflow-hidden bg-muted">
                  {getMediaType(mediaItem.mimeType) === 'image' ? (
                    <img
                      src={mediaItem.blobUrl}
                      alt={mediaItem.altText || mediaItem.caption || 'Media preview'}
                      className="w-full h-auto object-contain max-h-48"
                    />
                  ) : getMediaType(mediaItem.mimeType) === 'video' ? (
                    <video
                      src={mediaItem.blobUrl}
                      className="w-full h-auto max-h-48"
                      controls
                      muted
                    />
                  ) : (
                    <div className="h-32 flex items-center justify-center">
                      <FileText className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  {getMediaType(mediaItem.mimeType) === 'image' && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => setImagePreviewOpen(true)}>
                        <ZoomIn className="w-4 h-4 mr-1" />
                        Enlarge
                      </Button>
                      <Button type="button" size="sm" variant="secondary" onClick={handleDownload}>
                        <Download className="w-4 h-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{mediaItem.fileName}</span>
                  <span>{formatFileSize(mediaItem.fileSize)}</span>
                  {mediaItem.width && mediaItem.height && (
                    <span>{mediaItem.width} × {mediaItem.height}</span>
                  )}
                </div>
              </div>

              <Separator />

              {/* Edit Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-xs text-muted-foreground">
                    Choose where this media will be used on the website
                  </p>

                  <div className="space-y-4">
                    {CATEGORY_GROUPS.map(group => {
                      const GroupIcon = ICONS[group.icon] || Folder
                      const categories = MEDIA_CATEGORIES.filter(c => c.group === group.id)

                      return (
                        <div key={group.id} className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <GroupIcon className="w-4 h-4" />
                            {group.label}
                          </div>
                          <div className="grid grid-cols-2 gap-2 pl-6">
                            {categories.map(category => {
                              const CategoryIcon = ICONS[category.icon] || Folder
                              const isSelected = formData.category === category.id

                              return (
                                <button
                                  key={category.id}
                                  type="button"
                                  onClick={() => handleCategoryChange(category.id)}
                                  className={`p-3 rounded-lg border text-left transition-all ${
                                    isSelected
                                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                                  }`}
                                >
                                  <div className="flex items-start gap-2">
                                    <CategoryIcon className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm flex items-center gap-1">
                                        {category.label}
                                        {isSelected && <Check className="w-3 h-3 text-primary" />}
                                      </div>
                                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                        {category.description}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Placement Info */}
                {selectedCategory && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                      <MapPin className="w-4 h-4" />
                      Where it appears
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {selectedCategory.placement}
                    </p>
                    {selectedCategory.dimensions && (
                      <p className="text-xs text-blue-500 dark:text-blue-500">
                        Recommended: {selectedCategory.dimensions.recommended}
                      </p>
                    )}
                  </div>
                )}

                <Separator />

                {/* Tags Section */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Tags</Label>

                  {/* Required Tags */}
                  {requiredTags.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Select at least one required tag
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {requiredTags.map(tag => {
                          const isSelected = formData.tags.includes(tag)
                          const description = PREDEFINED_TAGS[tag as PredefinedTag]
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                                isSelected
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 ring-1 ring-amber-300'
                                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                              }`}
                              title={description}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                              {tag}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Suggested Tags */}
                  {suggestedTags.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Suggested tags (optional)</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedTags.map(tag => {
                          const isSelected = formData.tags.includes(tag)
                          const description = PREDEFINED_TAGS[tag as PredefinedTag]
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                                isSelected
                                  ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                              }`}
                              title={description}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                              {tag}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Current Tags Display */}
                  {formData.tags.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground mb-2">Active tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {formData.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <button type="button" onClick={() => toggleTag(tag)} className="hover:text-destructive">
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Caption & Alt Text */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="caption">Caption</Label>
                    <Input
                      id="caption"
                      value={formData.caption}
                      onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                      placeholder="Descriptive name for this media"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="altText">Alt Text (Accessibility)</Label>
                    <Textarea
                      id="altText"
                      value={formData.altText}
                      onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
                      placeholder="Describe this image for screen readers..."
                      rows={2}
                    />
                    <p className="text-xs text-muted-foreground">
                      Important for SEO and accessibility
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Display Options */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Display Settings</Label>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="showOnWebsite" className="font-normal">Show on website</Label>
                      <p className="text-xs text-muted-foreground">
                        Make visible on the public website
                      </p>
                    </div>
                    <Switch
                      id="showOnWebsite"
                      checked={formData.showOnWebsite}
                      onCheckedChange={(checked) => setFormData({ ...formData, showOnWebsite: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="featuredOnHomepage" className="font-normal">Feature on homepage</Label>
                      <p className="text-xs text-muted-foreground">
                        Highlight on the main homepage
                      </p>
                    </div>
                    <Switch
                      id="featuredOnHomepage"
                      checked={formData.featuredOnHomepage}
                      onCheckedChange={(checked) => setFormData({ ...formData, featuredOnHomepage: checked })}
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
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
