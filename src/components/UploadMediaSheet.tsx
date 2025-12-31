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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

interface UploadMediaSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function UploadMediaSheet({ open, onOpenChange, onSuccess }: UploadMediaSheetProps) {
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    caption: '',
    altText: '',
    category: 'workshop',
    showOnWebsite: false,
    featuredOnHomepage: false,
  })

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
      alert('Please select an image, video, or audio file')
      return
    }

    setSelectedFile(file)

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }

    // Auto-populate caption from filename
    if (!formData.caption) {
      const fileName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
      const prettyName = fileName.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      setFormData(prev => ({ ...prev, caption: prettyName }))
    }
  }, [formData.caption])

  // Handle drag and drop
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
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const clearFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      alert('Please select a file to upload')
      return
    }

    setLoading(true)
    setUploadProgress(0)

    try {
      // Create FormData for Vercel Blob upload
      const uploadData = new FormData()
      uploadData.append('file', selectedFile)
      uploadData.append('caption', formData.caption)
      uploadData.append('altText', formData.altText)
      uploadData.append('category', formData.category)
      uploadData.append('showOnWebsite', String(formData.showOnWebsite))
      uploadData.append('featuredOnHomepage', String(formData.featuredOnHomepage))

      // Upload to API
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
      onOpenChange(false)

      // Reset form
      setFormData({
        caption: '',
        altText: '',
        category: 'workshop',
        showOnWebsite: false,
        featuredOnHomepage: false,
      })
      clearFile()
    } catch (error) {
      console.error('Upload error:', error)
      alert(error instanceof Error ? error.message : 'Failed to upload media. Please try again.')
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Upload Media</SheetTitle>
          <SheetDescription>
            Add a new image, video, or audio file to the media gallery
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-6">
          {/* File Upload Zone */}
          <div className="space-y-2">
            <Label>Upload File *</Label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
            >
              {selectedFile ? (
                <div className="space-y-4">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded object-contain"
                    />
                  )}
                  {!previewUrl && (
                    <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearFile}
                    disabled={loading}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      Drag and drop your file here
                    </p>
                    <p className="text-xs text-muted-foreground">or</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Browse Files
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Supports images, videos, and audio
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,audio/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Upload Progress */}
          {loading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uploading...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Input
              id="caption"
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              placeholder="Auto-populated from filename"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="altText">Alt Text (Accessibility)</Label>
            <Input
              id="altText"
              value={formData.altText}
              onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
              placeholder="Describe the image for screen readers"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
              disabled={loading}
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

          <div className="space-y-3 pt-2">
            <Label>Display Options</Label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showOnWebsite"
                checked={formData.showOnWebsite}
                onChange={(e) => setFormData({ ...formData, showOnWebsite: e.target.checked })}
                disabled={loading}
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
                disabled={loading}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="featuredOnHomepage" className="font-normal cursor-pointer">
                Feature on homepage
              </Label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading || !selectedFile} className="flex-1">
              {loading ? `Uploading... ${Math.round(uploadProgress)}%` : 'Upload Media'}
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
      </SheetContent>
    </Sheet>
  )
}
