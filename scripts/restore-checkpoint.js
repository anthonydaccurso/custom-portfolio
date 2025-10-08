import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const checkpointDir = join(projectRoot, '.checkpoint');

async function restoreCheckpoint() {
  try {
    // Read manifest
    const manifest = JSON.parse(
      await readFile(join(checkpointDir, 'manifest.json'), 'utf8')
    );

    // Restore each file
    for (const file of manifest.files) {
      const filePath = join(projectRoot, file.path);
      
      // Ensure directory exists
      await mkdir(dirname(filePath), { recursive: true });
      
      // Write file content
      await writeFile(filePath, file.content);
    }

    console.log('Checkpoint restored successfully!');
  } catch (error) {
    console.error('Error restoring checkpoint:', error);
    process.exit(1);
  }
}

restoreCheckpoint();