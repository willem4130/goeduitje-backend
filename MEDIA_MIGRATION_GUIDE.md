# Media Migration & Management Guide

Complete guide for migrating existing gallery images and managing media in the Dutch Queen Admin platform.

## Overview

The media system uses **Vercel Blob** for storage and **PostgreSQL** for metadata. All images include comprehensive metadata (dimensions, aspect ratio, file size, format) displayed clearly in the admin UI.

---

## Migration Script

**Location**: `/scripts/migrate-media.ts`

### Features

- ✅ Scans both website galleries (Full Band + Unplugged)
- ✅ Extracts complete metadata using sharp:
  - Dimensions (width × height)
  - Aspect ratio (16:9, 4:3, etc.)
  - File size
  - MIME type
- ✅ Uploads to Vercel Blob (organized by band)
- ✅ Stores all metadata in PostgreSQL
- ✅ Preserves display order from original filenames
- ✅ Detailed progress logging
- ✅ Error handling (continues on failure)

### What Will Be Migrated

- **Full Band**: 14+ images from `dutch-queen-full-band-v4/public/gallery/`
- **Unplugged**: 23 images from `Queenwebsite_v3_UNPLUGGED/public/gallery/`
- **Total**: ~37 images

### Running the Migration

```bash
# Navigate to dutch-queen-admin
cd "/Users/willemvandenberg/Dev/The Dutch Queen/dutch-queen-admin"

# Run the migration
npm run migrate:media
```

### Expected Output

```
🚀 Starting Media Migration

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Environment variables verified

📂 Scanning /path/to/dutch-queen-full-band-v4/public/gallery...
   Found 14 gallery images

📂 Scanning /path/to/Queenwebsite_v3_UNPLUGGED/public/gallery...
   Found 23 gallery images

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Summary:
   Full Band: 14 images
   Unplugged: 23 images
   Total: 37 images
   Total size: X.XX MB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 Starting migration...

[1/37] Processing full-band/gallery-1.webp
   ⬆️  Uploading gallery-1.webp (125.8 KB, 1920×1280, 3:2)...
   ✅ Uploaded to https://...blob.vercel-storage.com/...
   💾 Inserted database record for gallery-1.webp
   ✨ Success!

[2/37] Processing full-band/gallery-2.webp
   ...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Migration Complete!

📈 Results:
   ✅ Successful: 37
   ❌ Failed: 0
   📊 Success rate: 100.0%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Troubleshooting

**Error: `BLOB_READ_WRITE_TOKEN not found`**
- Make sure `.env.local` contains `BLOB_READ_WRITE_TOKEN=...`
- Get token from Vercel dashboard → Storage → Blob

**Error: `DATABASE_URL not found`**
- Make sure `.env.local` contains `DATABASE_URL=postgresql://...`
- Get connection string from Vercel dashboard → Storage → Postgres

**Some images failed to upload**
- Check error messages in output
- Verify images exist at the specified paths
- Check image file integrity

---

## Enhanced Media Gallery UI

**Location**: `http://localhost:3003/media`

### Metadata Display

Each media card now shows:

1. **Format** - WebP, JPEG, PNG, etc.
2. **Size** - KB or MB (formatted nicely)
3. **Dimensions** - Width × Height pixels
4. **Aspect Ratio** - Friendly format (16:9, 4:3, 1:1, etc.)

### Example Display

```
┌──────────────────────────────┐
│ [Image Preview]              │
│ Gallery Image 1              │
│ ──────────────────────────── │
│ Full Band | Gallery          │
│                              │
│ Format:        WebP          │
│ Size:          125 KB        │
│ Dimensions:    1920 × 1280   │
│ Aspect Ratio:  3:2           │
└──────────────────────────────┘
```

### Supported Aspect Ratios

The system recognizes common aspect ratios:

- **16:9** - Widescreen/landscape
- **4:3** - Standard landscape
- **3:2** - Classic photo
- **1:1** - Square (marked as "Square")
- **9:16** - Portrait (marked as "Portrait")
- **3:4** - Portrait (marked as "Portrait")
- **Custom** - Shows exact ratio (e.g., "5:3")

---

## Image Processing on Upload

### Current Upload Endpoint

**Location**: `/src/app/api/media/route.ts`

### What Happens When You Upload

1. File is received via form data
2. **Metadata extraction** using sharp:
   - Dimensions (width × height)
   - File size
   - MIME type
3. **Upload to Vercel Blob**:
   - Stored in `gallery/{bandId}/` directory
   - Public access enabled
   - CDN distribution automatic
4. **Database insertion**:
   - All metadata saved to `mediaGallery` table
   - Display order set automatically
   - Tags and categories preserved

### Recommended Upload Formats

- **Images**: WebP (preferred), JPEG, PNG
- **Videos**: MP4 (H.264), WebM
- **Audio**: MP3, WAV

### File Size Limits

- **Vercel Blob Free Tier**: 500 MB total storage
- **Individual File**: No hard limit, but keep under 10 MB for images
- **Recommended**: < 500 KB for gallery images (WebP optimized)

---

## Next Steps

### 1. Run Migration

```bash
npm run migrate:media
```

### 2. Verify in Admin UI

- Visit `http://localhost:3003/media`
- Check that all images appear with metadata
- Verify dimensions and aspect ratios are correct
- Test filtering by band, type, category

### 3. Test Frontend API

```bash
curl http://localhost:3003/api/bands/full-band | jq '.gallery.images'
```

Expected response:
```json
{
  "gallery": {
    "images": [
      {
        "id": 1,
        "url": "https://...blob.vercel-storage.com/...",
        "title": "Gallery Image 1",
        "width": 1920,
        "height": 1280,
        "fileSize": 128763,
        "mimeType": "image/webp"
      },
      ...
    ]
  }
}
```

### 4. Update Frontend Websites

Once migration is complete and tested:

1. Update `dutch-queen-full-band-v4` to fetch from `/api/bands/full-band`
2. Update `Queenwebsite_v3_UNPLUGGED` to fetch from `/api/bands/unplugged`
3. Remove JSON gallery files from frontends
4. Deploy all three apps (admin + 2 frontends)

---

## Future Enhancements

### Automatic Image Optimization on Upload

Add image processing to automatically:
- Convert to WebP format
- Generate responsive variants (thumb, medium, large)
- Optimize file size (compress without quality loss)
- Create thumbnails

### Bulk Upload

Allow uploading multiple images at once:
- Drag-and-drop multiple files
- Progress bar for each file
- Automatic metadata extraction for all

### Image Editing

Add basic editing capabilities:
- Crop and resize
- Adjust brightness/contrast
- Apply filters
- Rename and retag in bulk

---

## Database Schema

**Table**: `mediaGallery`

```typescript
{
  id: number                    // Primary key
  bandId: string               // 'full-band' or 'unplugged'
  title: string | null         // Image title
  description: string | null   // Optional description
  url: string                  // Vercel Blob URL
  thumbnailUrl: string | null  // Thumbnail URL (same as url for now)
  type: string                 // 'image', 'video', 'audio'
  category: string | null      // 'gallery', 'promo', 'live', etc.
  tags: string[] | null        // Array of tags
  fileSize: number | null      // Bytes
  mimeType: string | null      // 'image/webp', 'image/jpeg', etc.
  width: number | null         // Pixels
  height: number | null        // Pixels
  displayOrder: number         // Sorting order (0, 1, 2, ...)
  uploadedBy: string | null    // Username or 'migration-script'
  createdAt: Date             // Upload timestamp
  updatedAt: Date             // Last modified timestamp
}
```

---

## Cost Estimation

### Vercel Blob Storage

**Free Tier**: 500 MB total

**Current usage** (after migration):
- 37 images × ~130 KB average = ~4.8 MB
- Well within free tier limits

**Future growth** (100 images):
- 100 images × 130 KB = 13 MB
- Still well within free tier

### Database (PostgreSQL)

**Neon Free Tier**: 0.5 GB storage

**Current usage**: Negligible (<1 MB)

**Future growth**: Metadata is tiny, no concerns

---

## Support

**Issues?** Check:
1. Environment variables in `.env.local`
2. Vercel Blob token is valid
3. Database connection works (`npm run db:push`)
4. Images exist at specified paths
5. Dev server is running on port 3003

**Need help?** Review the migration script output for detailed error messages.
