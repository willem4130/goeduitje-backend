'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Image as ImageIcon, Video, Music, Upload, Pencil, Trash2, GripVertical, Grid3x3, ChevronDown, ChevronRight, Globe, Layout, Palette, Share2 } from 'lucide-react'
import Link from 'next/link'
import { UploadMediaSheet } from '@/components/UploadMediaSheet'
import { EditMediaSheet } from '@/components/EditMediaSheet'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type MediaItem = {
  id: number
  workshopId: number | null
  blobUrl: string
  fileName: string
  fileSize: number | null
  mimeType: string
  width: number | null
  height: number | null
  caption: string | null
  altText: string | null
  takenAt: Date | null
  displayOrder: number
  category: string | null
  tags: string[] | null
  isPublic: boolean
  showOnWebsite: boolean
  featuredOnHomepage: boolean
  uploadedBy: string | null
  uploadedAt: Date
  createdAt: Date
  updatedAt: Date
}

function SortableMediaCard({ item, onEdit, onDelete }: {
  item: MediaItem
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getTypeIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />
    if (mimeType.startsWith('audio/')) return <Music className="w-4 h-4" />
    return <ImageIcon className="w-4 h-4" />
  }

  const getMediaType = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return 'image'
    if (mimeType.startsWith('video/')) return 'video'
    if (mimeType.startsWith('audio/')) return 'audio'
    return 'file'
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

  const getAspectRatio = (width: number | null, height: number | null) => {
    if (!width || !height) return null

    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
    const divisor = gcd(width, height)
    const ratioW = width / divisor
    const ratioH = height / divisor

    // Common aspect ratios
    if (ratioW === 16 && ratioH === 9) return '16:9'
    if (ratioW === 4 && ratioH === 3) return '4:3'
    if (ratioW === 3 && ratioH === 2) return '3:2'
    if (ratioW === 1 && ratioH === 1) return '1:1 (Square)'
    if (ratioW === 9 && ratioH === 16) return '9:16 (Portrait)'
    if (ratioW === 3 && ratioH === 4) return '3:4 (Portrait)'

    return `${ratioW}:${ratioH}`
  }

  const getFileFormat = (mimeType: string | null) => {
    if (!mimeType) return 'Unknown'

    const formats: Record<string, string> = {
      'image/webp': 'WebP',
      'image/jpeg': 'JPEG',
      'image/jpg': 'JPG',
      'image/png': 'PNG',
      'image/gif': 'GIF',
      'video/mp4': 'MP4',
      'video/webm': 'WebM',
      'audio/mpeg': 'MP3',
      'audio/wav': 'WAV',
    }

    return formats[mimeType] || mimeType.split('/')[1]?.toUpperCase() || 'Unknown'
  }

  // Calculate aspect ratio for proper display
  const getAspectRatioStyle = () => {
    if (!item.width || !item.height) return { aspectRatio: '16 / 9' }
    return { aspectRatio: `${item.width} / ${item.height}` }
  }

  const mediaType = getMediaType(item.mimeType)

  return (
    <Card ref={setNodeRef} style={style} className="overflow-hidden group relative">
      <div className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <div className="bg-background/80 backdrop-blur-sm p-1 rounded">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
      {/* Website visibility badges */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        {item.showOnWebsite && (
          <Badge variant="default" className="text-[10px] px-1.5 py-0.5 bg-green-600">Web</Badge>
        )}
        {item.featuredOnHomepage && (
          <Badge variant="default" className="text-[10px] px-1.5 py-0.5 bg-yellow-600">Home</Badge>
        )}
      </div>
      <div
        className="relative bg-muted flex items-center justify-center"
        style={mediaType === 'image' && item.width && item.height ? getAspectRatioStyle() : { aspectRatio: '16 / 9' }}
      >
        {mediaType === 'image' ? (
          <img
            src={item.blobUrl}
            alt={item.altText || item.caption || item.fileName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            {getTypeIcon(item.mimeType)}
            <p className="text-sm text-muted-foreground capitalize">{mediaType}</p>
          </div>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => onEdit(item.id)}>
            <Pencil className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold truncate" title={item.fileName}>
          {item.caption || item.fileName}
        </h3>
        {item.altText && (
          <p className="text-sm text-muted-foreground truncate mt-1">
            {item.altText}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          {item.category && (
            <Badge
              variant={item.category.startsWith('site-') ? 'default' : 'outline'}
              className={`text-xs ${item.category.startsWith('site-') ? 'bg-purple-600' : 'capitalize'}`}
            >
              {item.category.startsWith('site-')
                ? item.category.replace('site-', '').replace('-', ' ')
                : item.category}
            </Badge>
          )}
        </div>

        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span className="font-medium">Format:</span>
            <span>{getFileFormat(item.mimeType)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Size:</span>
            <span>{formatFileSize(item.fileSize)}</span>
          </div>
          {item.width && item.height && (
            <>
              <div className="flex items-center justify-between">
                <span className="font-medium">Dimensions:</span>
                <span>{item.width} × {item.height}</span>
              </div>
              {getAspectRatio(item.width, item.height) && (
                <div className="flex items-center justify-between">
                  <span className="font-medium">Aspect Ratio:</span>
                  <span>{getAspectRatio(item.width, item.height)}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

// Section definitions for grouped view
const MEDIA_SECTIONS = [
  {
    id: 'site-assets',
    title: 'Site Assets',
    description: 'Core website branding and layout elements',
    icon: Globe,
    categories: ['site-logo', 'site-hero-video', 'site-hero-poster', 'site-og'],
    subsections: [
      { category: 'site-logo', title: 'Logos', description: 'Navigation and footer logos' },
      { category: 'site-hero-video', title: 'Hero Videos', description: 'Homepage background videos' },
      { category: 'site-hero-poster', title: 'Hero Posters', description: 'Video fallback images' },
      { category: 'site-og', title: 'Social/OG Images', description: 'Open Graph & Twitter cards' },
    ]
  },
  {
    id: 'content',
    title: 'Content Images',
    description: 'Workshop and event photography',
    icon: Palette,
    categories: ['workshop', 'setup', 'cooking', 'results', 'group', 'food', 'venue'],
    subsections: [
      { category: 'workshop', title: 'Workshop', description: 'General workshop photos' },
      { category: 'setup', title: 'Setup', description: 'Event setup and preparation' },
      { category: 'cooking', title: 'Cooking', description: 'Cooking in action' },
      { category: 'results', title: 'Results', description: 'Finished dishes and creations' },
      { category: 'group', title: 'Group', description: 'Team and group photos' },
      { category: 'food', title: 'Food', description: 'Food close-ups and plating' },
      { category: 'venue', title: 'Venue', description: 'Location and venue shots' },
    ]
  },
]

export default function MediaGallery() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video' | 'audio'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [websiteFilter, setWebsiteFilter] = useState<'all' | 'website' | 'homepage'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false)
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [editingMediaId, setEditingMediaId] = useState<number | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'site-assets': true,
    'content': true,
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchMedia = () => {
    const params = new URLSearchParams()
    if (typeFilter !== 'all') params.append('type', typeFilter)
    if (categoryFilter !== 'all') params.append('category', categoryFilter)
    if (websiteFilter === 'website') params.append('showOnWebsite', 'true')
    if (websiteFilter === 'homepage') params.append('featuredOnHomepage', 'true')
    if (searchQuery) params.append('search', searchQuery)

    fetch(`/api/media?${params}`)
      .then(res => res.json())
      .then(data => {
        setMedia(data)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchMedia()
  }, [typeFilter, categoryFilter, websiteFilter])

  const handleSearch = () => {
    fetchMedia()
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = media.findIndex((item) => item.id === active.id)
    const newIndex = media.findIndex((item) => item.id === over.id)

    const newMedia = arrayMove(media, oldIndex, newIndex)

    // Update local state immediately for smooth UX
    setMedia(newMedia)

    // Update display order in database
    const updates = newMedia.map((item, index) => ({
      id: item.id,
      displayOrder: index,
    }))

    try {
      const response = await fetch('/api/media/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updates }),
      })

      if (!response.ok) {
        // Revert on error
        fetchMedia()
        alert('Failed to save new order')
      }
    } catch (error) {
      // Revert on error
      fetchMedia()
      alert('Failed to save new order')
    }
  }

  const handleEditMedia = (id: number) => {
    setEditingMediaId(id)
    setEditSheetOpen(true)
  }

  const handleSheetSuccess = () => {
    fetchMedia()
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  // Group media by category for sectioned view
  const groupedMedia = media.reduce((acc, item) => {
    const category = item.category || 'uncategorized'
    if (!acc[category]) acc[category] = []
    acc[category].push(item)
    return acc
  }, {} as Record<string, MediaItem[]>)

  // Check if we should show grouped view (no specific filters applied)
  const showGroupedView = categoryFilter === 'all' && typeFilter === 'all' && websiteFilter === 'all' && !searchQuery

  const deleteMediaItem = async (id: number) => {
    if (!confirm('Delete this media item?')) return

    await fetch(`/api/media/${id}`, { method: 'DELETE' })
    setMedia(media.filter(m => m.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading media...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Media Gallery</h1>
        <div className="flex gap-3">
          <Link href="/media/grid">
            <Button size="lg" variant="outline">
              <Grid3x3 className="mr-2 h-5 w-5" />
              Grid Builder
            </Button>
          </Link>
          <Button size="lg" onClick={() => setUploadSheetOpen(true)}>
            <Upload className="mr-2 h-5 w-5" />
            Upload Media
          </Button>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">Search Media</label>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="max-w-md"
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Found {media.length} item{media.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Show on:</label>
            <div className="flex gap-2">
              <Button
                variant={websiteFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWebsiteFilter('all')}
              >
                All
              </Button>
              <Button
                variant={websiteFilter === 'website' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWebsiteFilter('website')}
              >
                Website
              </Button>
              <Button
                variant={websiteFilter === 'homepage' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWebsiteFilter('homepage')}
              >
                Homepage
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Type:</label>
            <Select value={typeFilter} onValueChange={(value: 'all' | 'image' | 'video' | 'audio') => setTypeFilter(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="image">Images</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Category:</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
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
                <SelectItem value="site-og">📱 Social/OG</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {media.length === 0 ? (
        <Card className="p-12 text-center">
          <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No media items yet</h2>
          <p className="text-muted-foreground mb-4">
            Upload your first image, video, or audio file
          </p>
          <Button size="lg" onClick={() => setUploadSheetOpen(true)}>
            <Upload className="mr-2 h-5 w-5" />
            Upload Media
          </Button>
        </Card>
      ) : showGroupedView ? (
        /* Grouped Sections View */
        <div className="space-y-8">
          {MEDIA_SECTIONS.map((section) => {
            const SectionIcon = section.icon
            const sectionItems = section.categories.flatMap(cat => groupedMedia[cat] || [])
            const isExpanded = expandedSections[section.id]

            return (
              <Card key={section.id} className="overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <SectionIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-xl font-bold">{section.title}</h2>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </div>
                    <Badge variant="secondary" className="ml-4">
                      {sectionItems.length} item{sectionItems.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t">
                    {section.subsections.map((subsection) => {
                      const items = groupedMedia[subsection.category] || []
                      if (items.length === 0) {
                        return (
                          <div key={subsection.category} className="px-6 py-4 border-b last:border-b-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold">{subsection.title}</h3>
                                <p className="text-xs text-muted-foreground">{subsection.description}</p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setCategoryFilter(subsection.category)
                                  setUploadSheetOpen(true)
                                }}
                              >
                                <Upload className="w-4 h-4 mr-1" />
                                Add
                              </Button>
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div key={subsection.category} className="px-6 py-4 border-b last:border-b-0">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{subsection.title}</h3>
                              <p className="text-xs text-muted-foreground">{subsection.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{items.length}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCategoryFilter(subsection.category)}
                              >
                                View All
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {items.slice(0, 6).map((item) => (
                              <div
                                key={item.id}
                                className="relative aspect-square rounded-lg overflow-hidden bg-muted group cursor-pointer"
                                onClick={() => handleEditMedia(item.id)}
                              >
                                {item.mimeType.startsWith('image/') ? (
                                  <img
                                    src={item.blobUrl}
                                    alt={item.altText || item.fileName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Video className="w-8 h-8 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Pencil className="w-5 h-5 text-white" />
                                </div>
                                {(item.tags as string[])?.length > 0 && (
                                  <div className="absolute bottom-1 left-1 right-1">
                                    <Badge variant="secondary" className="text-[9px] truncate max-w-full">
                                      {(item.tags as string[])[0]}
                                    </Badge>
                                  </div>
                                )}
                              </div>
                            ))}
                            {items.length > 6 && (
                              <div
                                className="aspect-square rounded-lg bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                                onClick={() => setCategoryFilter(subsection.category)}
                              >
                                <span className="text-sm text-muted-foreground">+{items.length - 6} more</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        /* Flat Grid View (when filters applied) */
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={media.map(m => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {media.map((item) => (
                <SortableMediaCard
                  key={item.id}
                  item={item}
                  onEdit={handleEditMedia}
                  onDelete={deleteMediaItem}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <UploadMediaSheet
        open={uploadSheetOpen}
        onOpenChange={setUploadSheetOpen}
        onSuccess={handleSheetSuccess}
      />

      <EditMediaSheet
        mediaId={editingMediaId}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
        onSuccess={handleSheetSuccess}
      />
    </div>
  )
}
