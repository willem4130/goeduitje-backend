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
import {
  Image as ImageIcon,
  Video,
  Upload,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Globe,
  Utensils,
  FileText,
  Sparkles,
  Play,
  Share2,
  LayoutTemplate,
  Images,
  Users,
  Quote,
  ChefHat,
  Folder,
  Search,
  Filter,
  Plus,
} from 'lucide-react'
import { UploadMediaSheet } from '@/components/UploadMediaSheet'
import { EditMediaSheet } from '@/components/EditMediaSheet'
import {
  MEDIA_CATEGORIES,
  CATEGORY_GROUPS,
  getCategoryById,
  type MediaCategoryId,
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

function MediaCard({
  item,
  onEdit,
  onDelete,
}: {
  item: MediaItem
  onEdit: (id: number) => void
  onDelete: (id: number) => void
}) {
  const isImage = item.mimeType.startsWith('image/')
  const isVideo = item.mimeType.startsWith('video/')

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ''
    const mb = bytes / (1024 * 1024)
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`
  }

  return (
    <div
      className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer border hover:border-primary/50 transition-all"
      onClick={() => onEdit(item.id)}
    >
      {isImage ? (
        <img
          src={item.blobUrl}
          alt={item.altText || item.fileName}
          className="w-full h-full object-cover"
        />
      ) : isVideo ? (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
          <Play className="w-12 h-12 text-muted-foreground" />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <FileText className="w-12 h-12 text-muted-foreground" />
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
        <div className="flex justify-end gap-1">
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(item.id)
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="destructive"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(item.id)
            }}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-white">
          <p className="text-sm font-medium truncate">{item.caption || item.fileName}</p>
          <p className="text-xs text-white/70">{formatFileSize(item.fileSize)}</p>
        </div>
      </div>

      {/* Status badges */}
      <div className="absolute top-2 left-2 flex gap-1">
        {item.showOnWebsite && (
          <Badge className="text-[10px] px-1.5 py-0.5 bg-green-600 hover:bg-green-600">
            Live
          </Badge>
        )}
        {item.featuredOnHomepage && (
          <Badge className="text-[10px] px-1.5 py-0.5 bg-amber-500 hover:bg-amber-500">
            Featured
          </Badge>
        )}
      </div>

      {/* Tags */}
      {item.tags && item.tags.length > 0 && (
        <div className="absolute bottom-2 left-2 right-2 flex gap-1 flex-wrap">
          {item.tags.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-[9px] px-1.5 py-0 bg-black/50 text-white border-0"
            >
              {tag}
            </Badge>
          ))}
          {item.tags.length > 2 && (
            <Badge
              variant="secondary"
              className="text-[9px] px-1.5 py-0 bg-black/50 text-white border-0"
            >
              +{item.tags.length - 2}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

export default function MediaGallery() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false)
  const [uploadDefaultCategory, setUploadDefaultCategory] = useState<MediaCategoryId>('general')
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [editingMediaId, setEditingMediaId] = useState<number | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'site-assets': true,
    'workshop-content': true,
    'page-content': true,
  })

  const fetchMedia = () => {
    const params = new URLSearchParams()
    if (categoryFilter !== 'all') params.append('category', categoryFilter)
    if (searchQuery) params.append('search', searchQuery)

    fetch(`/api/media?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setMedia(data)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchMedia()
  }, [categoryFilter])

  const handleSearch = () => {
    fetchMedia()
  }

  const handleEditMedia = (id: number) => {
    setEditingMediaId(id)
    setEditSheetOpen(true)
  }

  const handleSheetSuccess = () => {
    fetchMedia()
  }

  const handleUploadForCategory = (categoryId: MediaCategoryId) => {
    setUploadDefaultCategory(categoryId)
    setUploadSheetOpen(true)
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  const deleteMediaItem = async (id: number) => {
    if (!confirm('Delete this media item? This cannot be undone.')) return

    await fetch(`/api/media/${id}`, { method: 'DELETE' })
    setMedia(media.filter((m) => m.id !== id))
  }

  // Group media by category
  const groupedMedia = media.reduce(
    (acc, item) => {
      const category = item.category || 'general'
      if (!acc[category]) acc[category] = []
      acc[category].push(item)
      return acc
    },
    {} as Record<string, MediaItem[]>
  )

  // Show grouped view when no filter is applied
  const showGroupedView = categoryFilter === 'all' && !searchQuery

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading media...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Media Gallery</h1>
          <p className="text-muted-foreground mt-1">
            Manage images and videos for your website
          </p>
        </div>
        <Button size="lg" onClick={() => handleUploadForCategory('general')}>
          <Upload className="mr-2 h-5 w-5" />
          Upload Media
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by caption, filename, or alt text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORY_GROUPS.map((group) => (
                  <div key={group.id}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {group.label}
                    </div>
                    {MEDIA_CATEGORIES.filter((c) => c.group === group.id).map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleSearch}>
              Search
            </Button>
          </div>
        </div>
        {(searchQuery || categoryFilter !== 'all') && (
          <div className="mt-3 flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Found {media.length} item{media.length !== 1 ? 's' : ''}
            </p>
            {(searchQuery || categoryFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setCategoryFilter('all')
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Content */}
      {media.length === 0 ? (
        <Card className="p-12 text-center">
          <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">
            {searchQuery || categoryFilter !== 'all' ? 'No results found' : 'No media yet'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {searchQuery || categoryFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Upload your first image or video to get started'}
          </p>
          {!searchQuery && categoryFilter === 'all' && (
            <Button size="lg" onClick={() => handleUploadForCategory('general')}>
              <Upload className="mr-2 h-5 w-5" />
              Upload Media
            </Button>
          )}
        </Card>
      ) : showGroupedView ? (
        /* Grouped View */
        <div className="space-y-6">
          {CATEGORY_GROUPS.map((group) => {
            const GroupIcon = ICONS[group.icon] || Folder
            const isExpanded = expandedGroups[group.id]
            const categoriesInGroup = MEDIA_CATEGORIES.filter((c) => c.group === group.id)
            const totalItems = categoriesInGroup.reduce(
              (sum, cat) => sum + (groupedMedia[cat.id]?.length || 0),
              0
            )

            return (
              <Card key={group.id} className="overflow-hidden">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <GroupIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-lg font-semibold">{group.label}</h2>
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{totalItems} items</Badge>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t divide-y">
                    {categoriesInGroup.map((category) => {
                      const CategoryIcon = ICONS[category.icon] || Folder
                      const items = groupedMedia[category.id] || []

                      return (
                        <div key={category.id} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <h3 className="font-medium">{category.label}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {category.placement}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{items.length}</Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUploadForCategory(category.id)}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Add
                              </Button>
                            </div>
                          </div>

                          {items.length === 0 ? (
                            <div className="py-8 text-center border-2 border-dashed rounded-lg">
                              <CategoryIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground mb-3">
                                No {category.label.toLowerCase()} uploaded yet
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUploadForCategory(category.id)}
                              >
                                <Upload className="w-4 h-4 mr-1" />
                                Upload {category.label}
                              </Button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                              {items.slice(0, 12).map((item) => (
                                <MediaCard
                                  key={item.id}
                                  item={item}
                                  onEdit={handleEditMedia}
                                  onDelete={deleteMediaItem}
                                />
                              ))}
                              {items.length > 12 && (
                                <div
                                  className="aspect-square rounded-lg bg-muted flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors border"
                                  onClick={() => setCategoryFilter(category.id)}
                                >
                                  <span className="text-2xl font-bold text-muted-foreground">
                                    +{items.length - 12}
                                  </span>
                                  <span className="text-xs text-muted-foreground">View all</span>
                                </div>
                              )}
                            </div>
                          )}
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
        /* Grid View (filtered) */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {media.map((item) => (
            <MediaCard
              key={item.id}
              item={item}
              onEdit={handleEditMedia}
              onDelete={deleteMediaItem}
            />
          ))}
        </div>
      )}

      {/* Sheets */}
      <UploadMediaSheet
        open={uploadSheetOpen}
        onOpenChange={setUploadSheetOpen}
        onSuccess={handleSheetSuccess}
        defaultCategory={uploadDefaultCategory}
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
