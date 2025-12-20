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
import { Image as ImageIcon, Video, Music, Upload, Pencil, Trash2, GripVertical, Grid3x3 } from 'lucide-react'
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
  bandId: string
  title: string | null
  description: string | null
  url: string
  thumbnailUrl: string | null
  type: string
  category: string | null
  tags: string[] | null
  fileSize: number | null
  mimeType: string | null
  width: number | null
  height: number | null
  displayOrder: number
  uploadedBy: string | null
  createdAt: Date
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="w-4 h-4" />
      case 'video':
        return <Video className="w-4 h-4" />
      case 'audio':
        return <Music className="w-4 h-4" />
      default:
        return <ImageIcon className="w-4 h-4" />
    }
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

  return (
    <Card ref={setNodeRef} style={style} className="overflow-hidden group relative">
      <div className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <div className="bg-background/80 backdrop-blur-sm p-1 rounded">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
      <div
        className="relative bg-muted flex items-center justify-center"
        style={item.type === 'image' && item.width && item.height ? getAspectRatioStyle() : { aspectRatio: '16 / 9' }}
      >
        {item.type === 'image' ? (
          <img
            src={item.thumbnailUrl || item.url}
            alt={item.title || 'Media'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            {getTypeIcon(item.type)}
            <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
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
        <h3 className="font-semibold truncate">
          {item.title || 'Untitled'}
        </h3>
        {item.description && (
          <p className="text-sm text-muted-foreground truncate mt-1">
            {item.description}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant={item.bandId === 'full-band' ? 'default' : 'secondary'} className="text-xs">
            {item.bandId === 'full-band' ? 'Full Band' : 'Unplugged'}
          </Badge>
          {item.category && (
            <Badge variant="outline" className="text-xs capitalize">
              {item.category}
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

export default function MediaGallery() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'full-band' | 'unplugged'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video' | 'audio'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false)
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [editingMediaId, setEditingMediaId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchMedia = () => {
    const params = new URLSearchParams()
    if (filter !== 'all') params.append('bandId', filter)
    if (typeFilter !== 'all') params.append('type', typeFilter)
    if (categoryFilter !== 'all') params.append('category', categoryFilter)
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
  }, [filter, typeFilter, categoryFilter])

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
            <label className="text-sm font-medium">Type:</label>
            <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
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
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="promo">Promo</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="press">Press</SelectItem>
                <SelectItem value="social">Social</SelectItem>
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
      ) : (
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
