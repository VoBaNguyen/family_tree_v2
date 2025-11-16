# Family Tree Persistence Setup

This guide will help you set up the complete persistence layer for your Family Tree application.

## 🚀 Quick Start

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Start the Backend Server

```bash
cd backend
npm start
# or for development with auto-reload:
npm run dev
```

The server will start on http://localhost:3001 |  https://family-tree-v2.onrender.com

### 3. Open Your Family Trees

Open any of your family tree files in a browser:
- `trees/BaNa.html`
- `trees/MeNa.html`

The trees will automatically connect to the backend and enable auto-save!

## 📁 Project Structure

```
family-chart/
├── backend/                    # Node.js/Express backend
│   ├── server.js              # Main server file
│   ├── package.json           # Backend dependencies
│   ├── data/                  # JSON data files
│   │   ├── BaNa.json         # Ba Na family tree data
│   │   └── MeNa.json         # Me Na family tree data
│   └── backups/              # Timestamped backups
│       ├── BaNa-2025-11-16T10-30-00.json
│       └── MeNa-2025-11-16T10-30-00.json
├── js/
│   └── family-tree-api.js    # Client-side API & auto-save
├── trees/
│   ├── BaNa.html            # Ba Na tree (with persistence)
│   └── MeNa.html            # Me Na tree (with persistence)
└── images/                   # Avatar images
```

## 🔧 Features

### Auto-Save
- **Debounced saving**: Changes are saved 3 seconds after editing stops
- **Visual indicators**: Save status shown in top-right corner
- **Retry logic**: Automatically retries failed saves up to 3 times
- **Offline handling**: Graceful handling when server is unavailable

### Backup System
- **Automatic backups**: Created before every save
- **Timestamped files**: Easy to identify and restore
- **Cleanup**: Automatically keeps only the last 10 backups per tree
- **Restore functionality**: API endpoints to restore from backups

### CRUD Operations
- **Create**: Add new family members and relationships
- **Read**: Load tree data from server on page load
- **Update**: Auto-save all changes (edits, additions, deletions)
- **Delete**: Remove family members (with backup)

## 🔌 API Endpoints

### Trees
- `GET /api/trees` - List all trees
- `GET /api/trees/:id` - Get specific tree
- `POST /api/trees/:id` - Save tree (create/update)
- `DELETE /api/trees/:id` - Delete tree

### Backups
- `GET /api/trees/:id/backups` - List backups for tree
- `POST /api/trees/:id/restore/:backup` - Restore from backup

### Health
- `GET /api/health` - Server health check

## 💾 Data Format

Trees are saved with metadata:

```json
{
  "familyData": [
    {
      "id": "1",
      "data": {
        "first name": "Võ Bá",
        "last name": "Di",
        "gender": "M"
      },
      "rels": {
        "spouses": ["1-spouse"],
        "children": ["2"]
      }
    }
  ],
  "metadata": {
    "lastModified": "2025-11-16T10:30:00.000Z",
    "version": "1.0.0",
    "treeType": "BaNa",
    "totalPersons": 29,
    "autoSave": true
  }
}
```

## 🎮 Usage

### Auto-Save
- Edit any family member by clicking on their card
- Changes are automatically saved after 3 seconds
- Watch the save status indicator in the top-right

### Manual Save
- Click the "💾 Force Save" button for immediate save
- Useful before closing the browser or for peace of mind

### Backup Management
- Backups are created automatically
- Use the API endpoints to list and restore backups
- Old backups are automatically cleaned up

## 🛠️ Development

### Backend Scripts
```bash
npm start      # Start production server
npm run dev    # Start development server with nodemon
```

### Environment Variables
```bash
PORT=3001      # Server port (default: 3001)
```

### Adding New Trees
1. Create a new HTML file in `trees/`
2. Use a unique `treeId` in the JavaScript
3. Follow the same pattern as existing files

## 🚨 Troubleshooting

### Server Not Starting
- Check if port 3001 is available
- Ensure Node.js is installed (v14+ required)
- Check for dependency installation errors

### Auto-Save Not Working
- Open browser console for error messages
- Check if backend server is running
- Verify API endpoint URLs in `family-tree-api.js`

### Data Not Loading
- Check if data files exist in `backend/data/`
- Verify JSON format is valid
- Check server logs for errors

## 📈 Monitoring

### Server Logs
The server logs all operations:
- ✓ Data directories ensured
- ✓ Tree saved: BaNa
- ✓ Backup created: BaNa-2025-11-16T10-30-00.json
- 🗑️ Deleted old backup: BaNa-old-file.json

### Client Logs
Browser console shows:
- 🔄 Loading family tree data from server...
- ✓ Loaded data from server
- ✓ API connection established
- ✓ Auto-saved BaNa at 10:30:00 AM

## 🔒 Security Notes

- Server runs on localhost only (not exposed to internet)
- No authentication implemented (local use only)
- Backup files contain full family data
- Consider encryption for sensitive family information

## 📦 Dependencies

### Backend
- `express`: Web server framework
- `cors`: Cross-origin resource sharing
- `multer`: File upload handling (for future use)

### Client
- `d3`: Required by family-chart library
- Built-in `fetch` API for HTTP requests
- No additional dependencies

## 🎯 Next Steps

1. **Image Upload**: Add API endpoints for uploading avatar images
2. **Authentication**: Add user authentication for multi-user support
3. **Real-time Sync**: WebSocket support for real-time collaboration
4. **Export Features**: PDF/PNG export functionality
5. **Import/Export**: Import from GEDCOM or other family tree formats

---

Your family tree now has full persistence! All changes are automatically saved with backup protection. 🌳✨
