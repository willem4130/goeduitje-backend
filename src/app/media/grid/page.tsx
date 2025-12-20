'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Grid3x3, Maximize2, Minimize2, RefreshCw, Trash2, Smartphone, Tablet, Monitor } from 'lucide-react'
import Link from 'next/link'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
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
  gridRow: number | null
  gridColumn: number | null
  gridSpan: number | null
  uploadedBy: string | null
  createdAt: Date
}

type GridCell = {
  row: number
  column: number
  mediaItem: MediaItem | null
}

type PreviewMode = 'mobile' | 'tablet' | 'desktop'

type MediaItemWithPattern = MediaItem & {
  orientation: 'portrait' | 'landscape'
  pattern: { row: string; col: string }
  arrayIndex: number
}

const GRID_COLUMNS = 4
const GRID_ROWS = 8 // Initial rows, will expand as needed

// Helper: Detect orientation from image dimensions (matches frontend)
function getOrientation(item: MediaItem): 'portrait' | 'landscape' {
  if (!item.width || !item.height) return 'portrait'
  return item.height > item.width ? 'portrait' : 'landscape'
}

// Helper: Replicate frontend pattern logic (from dutch-queen-full-band-v4/src/app/page.tsx)
function getFrontendPattern(index: number, orientation: 'portrait' | 'landscape') {
  const portraitPatterns = [
    { row: 'span 2', col: 'span 1' }, // Tall single
    { row: 'span 2', col: 'span 2' }, // Tall double width
    { row: 'span 1', col: 'span 1' }, // Small square
  ]

  const landscapePatterns = [
    { row: 'span 1', col: 'span 2' }, // Wide single
    { row: 'span 2', col: 'span 2' }, // Large square
    { row: 'span 1', col: 'span 1' }, // Small square
  ]

  const patterns = orientation === 'portrait' ? portraitPatterns : landscapePatterns
  return patterns[index % patterns.length]
}

function SortableGridCell({
  item,
  onRemove,
  style: propStyle,
}: {
  item: MediaItemWithPattern
  onRemove?: (mediaId: number) => void
  style?: React.CSSProperties
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: { item },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    ...propStyle,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative rounded-lg transition-all border-2 border-primary bg-gradient-to-br from-primary/5 to-primary/10 shadow-lg hover:shadow-xl"
      {...attributes}
      {...listeners}
    >
      <div className="group relative w-full h-full cursor-move min-h-[200px]">
        {/* Image */}
        <div className="absolute inset-0 p-3">
          <img
            src={item.thumbnailUrl || item.url}
            alt={item.title || 'Media'}
            className="w-full h-full object-cover rounded-md"
          />
        </div>

        {/* Hover overlay with controls */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
          <div className="text-white text-center">
            <p className="font-bold text-lg mb-1">{item.title || 'Untitled'}</p>
            <p className="text-xs opacity-75">
              {item.orientation === 'portrait' ? '📐 Portrait' : '🖼️ Landscape'}
            </p>
          </div>

          {/* Remove button */}
          {onRemove && (
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation()
                onRemove(item.id)
              }}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Remove
            </Button>
          )}
        </div>

        {/* Orientation badge */}
        <div className="absolute top-3 left-3 z-10">
          <Badge variant="default" className="bg-primary text-primary-foreground text-xs">
            {item.orientation === 'portrait' ? '📐 Portrait' : '🖼️ Landscape'}
          </Badge>
        </div>

        {/* Pattern badge */}
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="secondary" className="text-xs">
            Pattern {(item.arrayIndex % 3) + 1}
          </Badge>
        </div>

        {/* Category badge */}
        {item.category && (
          <div className="absolute top-12 right-3 z-10">
            <Badge variant="outline" className="text-xs bg-background/90">
              {item.category}
            </Badge>
          </div>
        )}

        {/* Position indicator */}
        <div className="absolute bottom-3 right-3 z-10 bg-black/90 text-white px-2 py-1 rounded text-xs font-mono">
          #{item.arrayIndex + 1}
        </div>
      </div>
    </div>
  )
}

function UnplacedItem({
  item,
  onPlace
}: {
  item: MediaItem
  onPlace: (mediaId: number) => void
}) {
  return (
    <div className="relative group bg-muted rounded-lg overflow-hidden border-2 border-dashed border-muted-foreground/30 hover:border-primary transition-colors">
      <div className="aspect-square relative">
        <img
          src={item.thumbnailUrl || item.url}
          alt={item.title || 'Media'}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPlace(item.id)}
          >
            Place in Grid
          </Button>
        </div>
      </div>
      <div className="p-2 bg-background">
        <p className="text-sm font-medium truncate">{item.title || 'Untitled'}</p>
        {item.category && (
          <Badge variant="outline" className="text-xs mt-1">
            {item.category}
          </Badge>
        )}
      </div>
    </div>
  )
}

export default function GridBuilder() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [grid, setGrid] = useState<GridCell[]>([])
  const [unplacedMedia, setUnplacedMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [bandFilter, setBandFilter] = useState<'full-band' | 'unplugged'>('full-band')
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchMedia()
  }, [bandFilter])

  const fetchMedia = async () => {
    try {
      const response = await fetch(`/api/media?type=image&bandId=${bandFilter}`)
      const items: MediaItem[] = await response.json()
      setMedia(items)

      // Separate placed and unplaced items
      const placed = items.filter(item => item.gridRow !== null && item.gridColumn !== null)
      const unplaced = items.filter(item => item.gridRow === null || item.gridColumn === null)
      setUnplacedMedia(unplaced)

      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch media:', error)
      setLoading(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || active.id === over.id) {
      return
    }

    // Get placed items sorted by displayOrder
    const placedItems = media
      .filter(item => item.gridRow !== null && item.gridColumn !== null)
      .sort((a, b) => a.displayOrder - b.displayOrder)

    // Find indices
    const oldIndex = placedItems.findIndex(item => item.id === active.id)
    const newIndex = placedItems.findIndex(item => item.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    // Reorder array
    const reordered = arrayMove(placedItems, oldIndex, newIndex)

    // Update displayOrder and grid positions for all reordered items
    const updatedMedia = media.map(item => {
      const newPosition = reordered.findIndex(r => r.id === item.id)
      if (newPosition !== -1) {
        return {
          ...item,
          displayOrder: newPosition,
          gridRow: Math.floor(newPosition / GRID_COLUMNS),
          gridColumn: newPosition % GRID_COLUMNS,
        }
      }
      return item
    })

    setMedia(updatedMedia)
  }

  const handleRemoveFromGrid = (mediaId: number) => {
    const item = media.find(m => m.id === mediaId)
    if (!item) return

    // Update media item
    const updatedMedia = media.map(m =>
      m.id === mediaId ? { ...m, gridRow: null, gridColumn: null, gridSpan: 1 } : m
    )
    setMedia(updatedMedia)

    // Add to unplaced
    setUnplacedMedia([...unplacedMedia, { ...item, gridRow: null, gridColumn: null, gridSpan: 1 }])
  }

  const handlePlaceItem = (mediaId: number) => {
    const item = unplacedMedia.find(m => m.id === mediaId)
    if (!item) return

    // Get current placed items count to determine next position
    const placedCount = media.filter(m => m.gridRow !== null && m.gridColumn !== null).length
    const newPosition = placedCount

    // Update media
    const updatedMedia = media.map(m =>
      m.id === mediaId
        ? {
            ...m,
            gridRow: Math.floor(newPosition / GRID_COLUMNS),
            gridColumn: newPosition % GRID_COLUMNS,
            displayOrder: newPosition,
          }
        : m
    )
    setMedia(updatedMedia)

    // Remove from unplaced
    setUnplacedMedia(unplacedMedia.filter(m => m.id !== mediaId))
  }

  const handleAutoLayout = () => {
    const allItems = [...media]

    // Sort by display order
    allItems.sort((a, b) => a.displayOrder - b.displayOrder)

    // Place all items in grid positions
    const updatedMedia = allItems.map((item, index) => ({
      ...item,
      gridRow: Math.floor(index / GRID_COLUMNS),
      gridColumn: index % GRID_COLUMNS,
      gridSpan: 1,
      displayOrder: index,
    }))

    setMedia(updatedMedia)
    setUnplacedMedia([])
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const updates = media
        .filter(item => item.gridRow !== null && item.gridColumn !== null)
        .map(item => ({
          id: item.id,
          gridRow: item.gridRow,
          gridColumn: item.gridColumn,
          gridSpan: item.gridSpan || 1,
        }))

      const response = await fetch('/api/media/grid-positions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updates }),
      })

      if (!response.ok) {
        throw new Error('Failed to save grid positions')
      }

      alert('Grid positions saved successfully!')
    } catch (error) {
      console.error('Failed to save grid positions:', error)
      alert('Failed to save grid positions. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Grid3x3 className="h-12 w-12 mx-auto mb-4 animate-pulse text-primary" />
          <p className="text-muted-foreground">Loading grid...</p>
        </div>
      </div>
    )
  }

  // Create items with patterns for rendering
  const placedItems = media
    .filter(item => item.gridRow !== null && item.gridColumn !== null)
    .sort((a, b) => a.displayOrder - b.displayOrder)

  const itemsWithPatterns: MediaItemWithPattern[] = placedItems.map((item, index) => {
    const orientation = getOrientation(item)
    const pattern = getFrontendPattern(index, orientation)
    return {
      ...item,
      orientation,
      pattern,
      arrayIndex: index,
    }
  })

  const activeItem = activeId
    ? itemsWithPatterns.find(item => item.id === activeId)
    : null

  const placedCount = placedItems.length

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Link href="/media">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Media
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl font-bold flex items-center gap-3 mb-2">
            <Grid3x3 className="h-10 w-10 text-primary" />
            Masonry Grid Manager
            <Badge variant="secondary" className="text-lg px-4 py-1">
              {bandFilter === 'full-band' ? 'Full Band' : 'Unplugged'}
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Drag and drop images to create your perfect gallery layout
          </p>
          <div className="flex items-center gap-2 mt-3">
            <span className="text-sm font-medium">Band:</span>
            <Button
              variant={bandFilter === 'full-band' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBandFilter('full-band')}
            >
              Full Band
            </Button>
            <Button
              variant={bandFilter === 'unplugged' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBandFilter('unplugged')}
            >
              Unplugged
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAutoLayout}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Auto Layout
          </Button>
          <Button size="lg" onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-5 w-5" />
            {saving ? 'Saving...' : 'Save Grid'}
          </Button>
        </div>
      </div>

      {/* Preview Mode Toggle */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm font-medium">Preview Mode:</span>
        <div className="flex gap-2">
          <Button
            variant={previewMode === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('mobile')}
            className="gap-2"
          >
            <Smartphone className="h-4 w-4" />
            Mobile (1 col)
          </Button>
          <Button
            variant={previewMode === 'tablet' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('tablet')}
            className="gap-2"
          >
            <Tablet className="h-4 w-4" />
            Tablet (2 cols)
          </Button>
          <Button
            variant={previewMode === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('desktop')}
            className="gap-2"
          >
            <Monitor className="h-4 w-4" />
            Desktop (4 cols)
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Images</p>
          <p className="text-3xl font-bold text-primary">{media.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Placed</p>
          <p className="text-3xl font-bold text-green-600">{placedCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Unplaced</p>
          <p className="text-3xl font-bold text-orange-600">{unplacedMedia.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Grid Size</p>
          <p className="text-3xl font-bold">{GRID_COLUMNS} cols</p>
        </Card>
      </div>

      {/* Unplaced Items */}
      {unplacedMedia.length > 0 && (
        <Card className="p-6 mb-8 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {unplacedMedia.length}
            </Badge>
            Unplaced Items
          </h2>
          <div className="grid grid-cols-6 gap-4">
            {unplacedMedia.map(item => (
              <UnplacedItem key={item.id} item={item} onPlace={handlePlaceItem} />
            ))}
          </div>
        </Card>
      )}

      {/* Grid */}
      <Card className="p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={itemsWithPatterns.map(item => item.id)}>
            <div
              className={`grid gap-4 ${
                previewMode === 'mobile' ? 'grid-cols-1' :
                previewMode === 'tablet' ? 'grid-cols-2' :
                'grid-cols-4'
              }`}
              style={{ gridAutoRows: '200px' }}
            >
              {itemsWithPatterns.map((item) => (
                <SortableGridCell
                  key={item.id}
                  item={item}
                  onRemove={handleRemoveFromGrid}
                  style={{
                    gridRow: item.pattern.row,
                    gridColumn: item.pattern.col,
                  }}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeId && activeItem && (
              <div className="rounded-lg border-2 border-primary bg-background shadow-2xl p-3 opacity-90 w-64 h-64">
                <img
                  src={activeItem.thumbnailUrl || activeItem.url}
                  alt={activeItem.title || 'Media'}
                  className="w-full h-full object-cover rounded"
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </Card>

      {/* Instructions */}
      <Card className="mt-8 p-6 bg-muted/50">
        <h3 className="font-semibold mb-3 text-lg">How to Use:</h3>
        <ul className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">1.</span>
            <span>Drag any item to reorder - the grid automatically adjusts</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">2.</span>
            <span>Pattern badges show which layout pattern each image uses</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">3.</span>
            <span>Portrait and landscape images use different pattern sets</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">4.</span>
            <span>Use preview modes to see how the gallery looks on different devices</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">5.</span>
            <span>Hover over items and click trash icon to remove from grid</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary font-bold">6.</span>
            <span>Click "Save Grid" when done to persist your layout</span>
          </li>
        </ul>
      </Card>
    </div>
  )
}
