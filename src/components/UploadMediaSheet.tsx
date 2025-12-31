'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Upload,
  X,
  Image as ImageIcon,
  Video,
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
  MapPin,
  Info,
  Check,
  AlertCircle,
} from 'lucide-react'
import {
  MEDIA_CATEGORIES,
  CATEGORY_GROUPS,
  PREDEFINED_TAGS,
  getCategoryById,
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

interface UploadMediaSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  defaultCategory?: MediaCategoryId
}

export function UploadMediaSheet({
  open,
  onOpenChange,
  onSuccess,
  defaultCategory = 'general',
}: UploadMediaSheetProps) {
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    caption: '',
    altText: '',
    category: defaultCategory,
    showOnWebsite: false,
    featuredOnHomepage: false,
    tags: [] as string[],
  })

  const selectedCategory = getCategoryById(formData.category)

  // Reset form when sheet opens with default category
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      const category = getCategoryById(defaultCategory)
      setFormData({
        caption: '',
        altText: '',
        category: defaultCategory,
        showOnWebsite: category?.autoSettings.showOnWebsite || false,
        featuredOnHomepage: category?.autoSettings.featuredOnHomepage || false,
        tags: [],
      })
    }
    onOpenChange(isOpen)
  }

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    // Validate file type against category
    if (selectedCategory) {
      const acceptsImage = selectedCategory.acceptedTypes.includes('image')
      const acceptsVideo = selectedCategory.acceptedTypes.includes('video')

      if (isImage && !acceptsImage) {
        alert(`${selectedCategory.label} only accepts video files`)
        return
      }
      if (isVideo && !acceptsVideo) {
        alert(`${selectedCategory.label} only accepts image files`)
        return
      }
    }

    if (!isImage && !isVideo) {
      alert('Please select an image or video file')
      return
    }

    setSelectedFile(file)

    // Generate preview
    if (isImage) {
      const reader = new FileReader()
      reader.onloadend = () => setPreviewUrl(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }

    // Auto-populate caption from filename
    if (!formData.caption) {
      const fileName = file.name.replace(/\.[^/.]+$/, '')
      const prettyName = fileName.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      setFormData(prev => ({ ...prev, caption: prettyName }))
    }
  }, [formData.caption, selectedCategory])

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) handleFileSelect(files[0])
  }, [handleFileSelect])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) handleFileSelect(files[0])
  }

  const clearFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleCategoryChange = (categoryId: MediaCategoryId) => {
    const category = getCategoryById(categoryId)
    if (category) {
      setFormData(prev => ({
        ...prev,
        category: categoryId,
        showOnWebsite: category.autoSettings.showOnWebsite,
        featuredOnHomepage: category.autoSettings.featuredOnHomepage,
        tags: [], // Reset tags when category changes
      }))
      // Clear file if type doesn't match new category
      if (selectedFile) {
        const isImage = selectedFile.type.startsWith('image/')
        const isVideo = selectedFile.type.startsWith('video/')
        const acceptsImage = category.acceptedTypes.includes('image')
        const acceptsVideo = category.acceptedTypes.includes('video')
        if ((isImage && !acceptsImage) || (isVideo && !acceptsVideo)) {
          clearFile()
        }
      }
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

    if (!selectedFile) {
      alert('Please select a file to upload')
      return
    }

    // Validate required tags
    const requiredTags = selectedCategory?.requiredTags || []
    const hasRequiredTag = requiredTags.length === 0 || requiredTags.some(tag => formData.tags.includes(tag))
    if (!hasRequiredTag) {
      alert(`Please select at least one required tag: ${requiredTags.join(', ')}`)
      return
    }

    setLoading(true)
    setUploadProgress(0)

    try {
      const uploadData = new FormData()
      uploadData.append('file', selectedFile)
      uploadData.append('caption', formData.caption)
      uploadData.append('altText', formData.altText)
      uploadData.append('category', formData.category)
      uploadData.append('showOnWebsite', String(formData.showOnWebsite))
      uploadData.append('featuredOnHomepage', String(formData.featuredOnHomepage))
      uploadData.append('tags', JSON.stringify(formData.tags))

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: uploadData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      setUploadProgress(100)
      onSuccess()
      handleOpenChange(false)
      clearFile()
    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload media')
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  // Get accepted file types for the file input
  const getAcceptedTypes = () => {
    if (!selectedCategory) return 'image/*,video/*'
    const types: string[] = []
    if (selectedCategory.acceptedTypes.includes('image')) types.push('image/*')
    if (selectedCategory.acceptedTypes.includes('video')) types.push('video/*')
    return types.join(',')
  }

  const { requiredTags = [], suggestedTags = [] } = selectedCategory || {}

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Upload Media</SheetTitle>
          <SheetDescription>
            Add images or videos to your media library
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Step 1: Choose Category */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</div>
              <Label className="text-sm font-medium">Choose Category</Label>
            </div>
            <p className="text-xs text-muted-foreground ml-8">
              Select where this media will be used
            </p>

            <div className="space-y-4 ml-8">
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
                            disabled={loading}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              isSelected
                                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              <CategoryIcon className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm flex items-center gap-1">
                                  {category.label}
                                  {isSelected && <Check className="w-3 h-3 text-primary" />}
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
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
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4 space-y-2 ml-8">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
                <MapPin className="w-4 h-4" />
                Where it appears
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                {selectedCategory.placement}
              </p>
              {selectedCategory.dimensions && (
                <p className="text-xs text-blue-500">
                  Recommended: {selectedCategory.dimensions.recommended}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                {selectedCategory.acceptedTypes.includes('image') && (
                  <Badge variant="outline" className="text-xs">
                    <ImageIcon className="w-3 h-3 mr-1" />
                    Images
                  </Badge>
                )}
                {selectedCategory.acceptedTypes.includes('video') && (
                  <Badge variant="outline" className="text-xs">
                    <Video className="w-3 h-3 mr-1" />
                    Videos
                  </Badge>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Step 2: Upload File */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</div>
              <Label className="text-sm font-medium">Upload File</Label>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`ml-8 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
            >
              {selectedFile ? (
                <div className="space-y-4">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="max-h-40 mx-auto rounded object-contain" />
                  ) : (
                    <Video className="w-16 h-16 mx-auto text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={clearFile} disabled={loading}>
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Drag and drop your file here</p>
                    <p className="text-xs text-muted-foreground">or</p>
                  </div>
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={loading}>
                    Browse Files
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {selectedCategory?.acceptedTypes.includes('video') && !selectedCategory?.acceptedTypes.includes('image')
                      ? 'Video files only'
                      : selectedCategory?.acceptedTypes.includes('image') && !selectedCategory?.acceptedTypes.includes('video')
                      ? 'Image files only'
                      : 'Images or videos'}
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept={getAcceptedTypes()}
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Upload Progress */}
          {loading && (
            <div className="space-y-2 ml-8">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          <Separator />

          {/* Step 3: Configure Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">3</div>
              <Label className="text-sm font-medium">Configure Details</Label>
            </div>

            <div className="space-y-4 ml-8">
              {/* Tags */}
              {(requiredTags.length > 0 || suggestedTags.length > 0) && (
                <div className="space-y-3">
                  <Label className="text-sm">Tags</Label>

                  {requiredTags.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Select at least one (required)
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
                              disabled={loading}
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

                  {suggestedTags.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Suggested (optional)</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestedTags.map(tag => {
                          const isSelected = formData.tags.includes(tag)
                          const description = PREDEFINED_TAGS[tag as PredefinedTag]
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => toggleTag(tag)}
                              disabled={loading}
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

                  {formData.tags.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground mb-2">Selected:</p>
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
              )}

              {/* Caption */}
              <div className="space-y-2">
                <Label htmlFor="caption">Caption</Label>
                <Input
                  id="caption"
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  placeholder="Auto-filled from filename"
                  disabled={loading}
                />
              </div>

              {/* Alt Text */}
              <div className="space-y-2">
                <Label htmlFor="altText">Alt Text (SEO & Accessibility)</Label>
                <Textarea
                  id="altText"
                  value={formData.altText}
                  onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
                  placeholder="Describe this media for search engines and screen readers..."
                  rows={2}
                  disabled={loading}
                />
              </div>

              {/* Display Options */}
              <div className="space-y-3 pt-2">
                <Label className="text-sm">Display Settings</Label>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showOnWebsite" className="font-normal">Show on website</Label>
                    <p className="text-xs text-muted-foreground">Visible on public pages</p>
                  </div>
                  <Switch
                    id="showOnWebsite"
                    checked={formData.showOnWebsite}
                    onCheckedChange={(checked) => setFormData({ ...formData, showOnWebsite: checked })}
                    disabled={loading}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="featuredOnHomepage" className="font-normal">Feature on homepage</Label>
                    <p className="text-xs text-muted-foreground">Highlight prominently</p>
                  </div>
                  <Switch
                    id="featuredOnHomepage"
                    checked={formData.featuredOnHomepage}
                    onCheckedChange={(checked) => setFormData({ ...formData, featuredOnHomepage: checked })}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-4 border-t">
            <Button type="submit" disabled={loading || !selectedFile} className="flex-1">
              {loading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Upload Media'}
            </Button>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
