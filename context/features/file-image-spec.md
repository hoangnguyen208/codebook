# File Upload with Cloudflare R2

## Overview

Add file and image upload functionality using Cloudflare R2 storage.

## Requirements

- Create upload API route for R2
- Stick with backend API in ItemsController and lib/db/items.ts for EF/db functions
- Create FileUpload component with drag-and-drop
- Update create item modal to use FileUpload for file/image types
- Delete files from R2 when items are deleted
- Create download proxy API route (avoids CORS issues)
- Add download button in ItemDrawer for file types
- Show upload progress indicator
- Display image preview for images, file info for files
- Finally, make sure the new unit tests for this feature pass.

## Notes

- All R2 keys and secrets are in .env & .env.production files.

## File Constraints

| Type   | Max Size | Extensions                                            |
| ------ | -------- | ----------------------------------------------------- |
| Images | 5 MB     | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg`      |
| Files  | 10 MB    | `.pdf`, `.txt`, `.md`, `.json`, `.yaml`, `.yml`, `.xml`, `.csv`, `.toml`, `.ini` |

## MIME Types

**Images:**
- `image/png`
- `image/jpeg`
- `image/gif`
- `image/webp`
- `image/svg+xml`

**Files:**
- `application/pdf`
- `text/plain`
- `text/markdown`
- `application/json`
- `application/x-yaml`, `text/yaml`
- `application/xml`, `text/xml`
- `text/csv`
- `application/toml`
- `text/plain` (for `.ini`)
