# Avatar Image Setup Guide

## How Avatar Images Work

The family tree now displays avatar images for each family member using a circular image style. Here's how it works:

### Image Field
- The system looks for the `avatar` field in each person's data
- Example: `"avatar": "../images/ba-na/1.jpg"`

### Default Fallback
- If no avatar is specified or the image fails to load, a default user icon (SVG) is shown
- The default icon is a simple person silhouette in gray

### Image Locations
- Images should be stored in the `backend/images/` folder
- Organized by tree: `backend/images/ba-na/` and `backend/images/me-na/`
- The frontend references them with relative paths like `../images/ba-na/1.jpg`

### Supported Formats
- PNG, JPG, JPEG, GIF, WebP
- Recommended size: 80x80 pixels or larger
- Images are automatically cropped to circular shape

### Error Handling
- Broken image links automatically fall back to the default icon
- Console logs show when images fail to load for debugging
- No broken image icons are shown to users

### Upload Functionality
- Users can upload new avatars through the person edit form
- Images are automatically uploaded to the server
- File size limit: 5MB
- Automatic URL updating in the person's data

## File Structure
```
backend/
  images/
    ba-na/
      1.jpg
      1-spouse.jpg
      (other avatar images)
    me-na/
      1.jpg
      1-spouse.jpg
      (other avatar images)
```

## Adding New Images
1. Place image files in the appropriate tree folder
2. Update the person's data to include the avatar field
3. Use relative paths like `../images/ba-na/filename.jpg`
4. Or use the upload button in the edit form
