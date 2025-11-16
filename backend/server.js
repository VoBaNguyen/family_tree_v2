import express from 'express';
import cors from 'cors';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Data directories
const DATA_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(__dirname, 'backups');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    console.log('✓ Data directories ensured');
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Utility function to create timestamp
function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
}

// Utility function to clean old backups (keep only last 10)
async function cleanOldBackups(treeId) {
  try {
    const backupFiles = await fs.readdir(BACKUP_DIR);
    const treeBackups = backupFiles
      .filter(file => file.startsWith(`${treeId}_`) && file.endsWith('.json'))
      .sort()
      .reverse();

    // Keep only the most recent 10 backups
    const toDelete = treeBackups.slice(10);
    
    for (const file of toDelete) {
      await fs.unlink(path.join(BACKUP_DIR, file));
      console.log(`🗑️ Deleted old backup: ${file}`);
    }
  } catch (error) {
    console.warn('Warning: Could not clean old backups:', error.message);
  }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Family Tree API is running',
    timestamp: new Date().toISOString()
  });
});

// Get initial tree data (for first-time load)
app.get('/api/initial/:treeId', async (req, res) => {
  const { treeId } = req.params;
  const filePath = path.join(DATA_DIR, `${treeId}.json`);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const initialData = JSON.parse(fileContent);
    
    // Return the raw array data for initial load
    res.json(initialData);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty array
      res.json([]);
    } else {
      console.error(`Error loading initial data for ${treeId}:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to load initial data',
        message: error.message
      });
    }
  }
});

// Get all available trees
app.get('/api/trees', async (req, res) => {
  try {
    const files = await fs.readdir(DATA_DIR);
    const trees = files
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
    
    res.json({
      success: true,
      trees,
      count: trees.length
    });
  } catch (error) {
    console.error('Error listing trees:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list trees',
      message: error.message
    });
  }
});

// Get tree data
app.get('/api/trees/:treeId', async (req, res) => {
  const { treeId } = req.params;
  const filePath = path.join(DATA_DIR, `${treeId}.json`);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const treeData = JSON.parse(fileContent);
    
    res.json({
      success: true,
      treeId,
      data: treeData.data || [],
      metadata: treeData.metadata || {},
      lastModified: treeData.lastModified
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, return empty tree
      res.json({
        success: true,
        treeId,
        data: [],
        metadata: {},
        lastModified: null
      });
    } else {
      console.error('Error loading tree:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to load tree',
        message: error.message
      });
    }
  }
});

// Save tree data with backup
app.post('/api/trees/:treeId', async (req, res) => {
  const { treeId } = req.params;
  const { data, metadata = {} } = req.body;
  
  const filePath = path.join(DATA_DIR, `${treeId}.json`);
  const timestamp = getTimestamp();

  try {
    // Create backup of existing file if it exists
    try {
      const existingContent = await fs.readFile(filePath, 'utf-8');
      const backupPath = path.join(BACKUP_DIR, `${treeId}_${timestamp}.json`);
      await fs.writeFile(backupPath, existingContent);
      console.log(`📦 Created backup: ${treeId}_${timestamp}.json`);
    } catch (backupError) {
      if (backupError.code !== 'ENOENT') {
        console.warn('Warning: Could not create backup:', backupError.message);
      }
    }

    // Save new data
    const saveData = {
      treeId,
      data,
      metadata: {
        ...metadata,
        savedAt: new Date().toISOString(),
        version: (metadata.version || 0) + 1
      },
      lastModified: new Date().toISOString()
    };

    await fs.writeFile(filePath, JSON.stringify(saveData, null, 2));
    
    // Clean old backups
    await cleanOldBackups(treeId);

    console.log(`💾 Saved tree: ${treeId} (${data?.length || 0} people)`);
    
    res.json({
      success: true,
      treeId,
      message: 'Tree saved successfully',
      metadata: saveData.metadata,
      lastModified: saveData.lastModified,
      backupCreated: true
    });

  } catch (error) {
    console.error('Error saving tree:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save tree',
      message: error.message
    });
  }
});

// Auto-save tree data (without backup)
app.put('/api/trees/:treeId/autosave', async (req, res) => {
  const { treeId } = req.params;
  const { data } = req.body;
  
  const filePath = path.join(DATA_DIR, `${treeId}.json`);

  try {
    // Load existing metadata if file exists
    let existingMetadata = {};
    try {
      const existingContent = await fs.readFile(filePath, 'utf-8');
      const existingData = JSON.parse(existingContent);
      existingMetadata = existingData.metadata || {};
    } catch (error) {
      // File doesn't exist, start fresh
    }

    // Save data with existing metadata
    const saveData = {
      treeId,
      data,
      metadata: {
        ...existingMetadata,
        autoSavedAt: new Date().toISOString()
      },
      lastModified: new Date().toISOString()
    };

    await fs.writeFile(filePath, JSON.stringify(saveData, null, 2));
    
    console.log(`🔄 Auto-saved tree: ${treeId} (${data?.length || 0} people)`);
    
    res.json({
      success: true,
      treeId,
      message: 'Tree auto-saved successfully',
      lastModified: saveData.lastModified,
      backupCreated: false
    });

  } catch (error) {
    console.error('Error auto-saving tree:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to auto-save tree',
      message: error.message
    });
  }
});

// Delete tree
app.delete('/api/trees/:treeId', async (req, res) => {
  const { treeId } = req.params;
  const filePath = path.join(DATA_DIR, `${treeId}.json`);

  try {
    // Create final backup before deletion
    try {
      const existingContent = await fs.readFile(filePath, 'utf-8');
      const timestamp = getTimestamp();
      const backupPath = path.join(BACKUP_DIR, `${treeId}_DELETED_${timestamp}.json`);
      await fs.writeFile(backupPath, existingContent);
      console.log(`📦 Created deletion backup: ${treeId}_DELETED_${timestamp}.json`);
    } catch (backupError) {
      console.warn('Warning: Could not create deletion backup:', backupError.message);
    }

    await fs.unlink(filePath);
    
    console.log(`🗑️ Deleted tree: ${treeId}`);
    
    res.json({
      success: true,
      treeId,
      message: 'Tree deleted successfully',
      backupCreated: true
    });

  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({
        success: false,
        error: 'Tree not found',
        treeId
      });
    } else {
      console.error('Error deleting tree:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete tree',
        message: error.message
      });
    }
  }
});

// Get tree backups
app.get('/api/trees/:treeId/backups', async (req, res) => {
  const { treeId } = req.params;

  try {
    const backupFiles = await fs.readdir(BACKUP_DIR);
    const treeBackups = backupFiles
      .filter(file => file.startsWith(`${treeId}_`) && file.endsWith('.json'))
      .map(file => {
        const stats = fs.stat(path.join(BACKUP_DIR, file));
        const timestamp = file.replace(`${treeId}_`, '').replace('.json', '');
        return {
          filename: file,
          timestamp,
          humanDate: new Date(timestamp.replace(/-/g, ':')).toLocaleString()
        };
      })
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp)); // Most recent first

    res.json({
      success: true,
      treeId,
      backups: treeBackups,
      count: treeBackups.length
    });

  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list backups',
      message: error.message
    });
  }
});

// Restore from backup
app.post('/api/trees/:treeId/restore/:backupFilename', async (req, res) => {
  const { treeId, backupFilename } = req.params;
  const backupPath = path.join(BACKUP_DIR, backupFilename);
  const filePath = path.join(DATA_DIR, `${treeId}.json`);

  try {
    // Verify backup file exists and belongs to this tree
    if (!backupFilename.startsWith(`${treeId}_`) || !backupFilename.endsWith('.json')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid backup file for this tree'
      });
    }

    // Create backup of current state before restoring
    try {
      const currentContent = await fs.readFile(filePath, 'utf-8');
      const timestamp = getTimestamp();
      const preRestoreBackupPath = path.join(BACKUP_DIR, `${treeId}_PRE_RESTORE_${timestamp}.json`);
      await fs.writeFile(preRestoreBackupPath, currentContent);
      console.log(`📦 Created pre-restore backup: ${treeId}_PRE_RESTORE_${timestamp}.json`);
    } catch (backupError) {
      if (backupError.code !== 'ENOENT') {
        console.warn('Warning: Could not create pre-restore backup:', backupError.message);
      }
    }

    // Read backup content
    const backupContent = await fs.readFile(backupPath, 'utf-8');
    const backupData = JSON.parse(backupContent);
    
    // Update metadata for restore
    const restoreData = {
      ...backupData,
      metadata: {
        ...backupData.metadata,
        restoredAt: new Date().toISOString(),
        restoredFrom: backupFilename
      },
      lastModified: new Date().toISOString()
    };

    // Write restored data
    await fs.writeFile(filePath, JSON.stringify(restoreData, null, 2));
    
    console.log(`🔄 Restored tree ${treeId} from backup: ${backupFilename}`);
    
    res.json({
      success: true,
      treeId,
      message: `Tree restored from backup: ${backupFilename}`,
      data: restoreData.data,
      metadata: restoreData.metadata,
      lastModified: restoreData.lastModified
    });

  } catch (error) {
    if (error.code === 'ENOENT') {
      res.status(404).json({
        success: false,
        error: 'Backup file not found'
      });
    } else {
      console.error('Error restoring from backup:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to restore from backup',
        message: error.message
      });
    }
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Start server
async function startServer() {
  await ensureDirectories();
  
  app.listen(PORT, () => {
    console.log(`🚀 Family Tree API server running on http://localhost:${PORT}`);
    console.log(`📁 Data directory: ${DATA_DIR}`);
    console.log(`📦 Backup directory: ${BACKUP_DIR}`);
  });
}

startServer().catch(console.error);
