# Family Tree Images Directory

This directory contains avatar images for the family trees, organized by family branch.

## Directory Structure

```
images/
├── ba-na/          # Images for Ba Na family tree
├── me-na/          # Images for Me Na family tree
└── README.md       # This documentation file
```

## Usage Guidelines

### File Organization
- **ba-na/**: Store avatar images for people in the Ba Na family tree
- **me-na/**: Store avatar images for people in the Me Na family tree

### File Naming Convention
It's recommended to use a consistent naming pattern:
- Use the person's ID from the family data (e.g., `1.jpg` for person with id "1")
- Or use descriptive names (e.g., `vo-ba-phan.jpg`)
- Supported formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`

### Example File Structure
```
images/
├── ba-na/
│   ├── 1.jpg           # Võ Bá Phan
│   ├── 1-spouse.jpg    # Hoàng Thị Lé
│   ├── 29.jpg          # Võ Bá Nguyen (Current user)
│   └── ...
├── me-na/
│   ├── person1.jpg
│   ├── person2.png
│   └── ...
```

### How to Use in HTML Files

#### Method 1: Relative Path (Recommended)
```javascript
{
  "id": "1",
  "data": {
    "first name": "Võ Bá",
    "last name": "Phan",
    "gender": "M",
    "avatar": "../images/ba-na/1.jpg"  // Relative path from trees/ folder
  }
}
```

#### Method 2: Direct Reference
```javascript
{
  "id": "29",
  "data": {
    "first name": "Võ Bá",
    "last name": "Nguyen",
    "gender": "M",
    "avatar": "../images/ba-na/vo-ba-nguyen.jpg"
  }
}
```

### Image Optimization Tips
1. **Size**: Recommended size is 150x150 to 300x300 pixels
2. **Format**: Use `.jpg` for photos, `.png` for images with transparency
3. **File Size**: Keep images under 500KB for faster loading
4. **Quality**: Use good quality images but optimize for web

### Adding New Images
1. Place the image file in the appropriate folder (ba-na/ or me-na/)
2. Update the person's data in the corresponding HTML file
3. Use the correct relative path: `../images/[folder-name]/[filename]`

### Fallback Images
If no avatar is specified or the image fails to load, the family chart will automatically display gender-appropriate default icons.
