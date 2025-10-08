import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const checkpointDir = join(projectRoot, '.checkpoint');

async function getAllFiles(dir) {
  const files = [];
  const items = await readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const path = join(dir, item.name);
    
    // Skip node_modules, dist, and .checkpoint directories
    if (item.name === 'node_modules' || item.name === 'dist' || item.name === '.checkpoint') {
      continue;
    }

    if (item.isDirectory()) {
      files.push(...(await getAllFiles(path)));
    } else {
      files.push(path);
    }
  }

  return files;
}

async function createCheckpoint() {
  try {
    // Create checkpoint directory
    await mkdir(checkpointDir, { recursive: true });

    // Get all project files
    const files = await getAllFiles(projectRoot);
    
    // Create manifest of files
    const manifest = {
      timestamp: new Date().toISOString(),
      files: []
    };

    // Copy each file to checkpoint directory
    for (const file of files) {
      const relativePath = file.replace(projectRoot + '/', '');
      const content = await readFile(file, 'utf8');
      
      manifest.files.push({
        path: relativePath,
        content
      });
    }

    // Save manifest
    await writeFile(
      join(checkpointDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    console.log('Checkpoint created successfully!');
  } catch (error) {
    console.error('Error creating checkpoint:', error);
    process.exit(1);
  }
}

createCheckpoint();