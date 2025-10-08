import sharp from 'sharp';
import { readFile, access } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { constants } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

async function fileExists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function convertSvgToPng(inputPath, outputPath, options = {}) {
  try {
    // Check if input file exists
    if (!(await fileExists(inputPath))) {
      console.log(`⚠️ Input file not found: ${inputPath}`);
      return;
    }

    const svg = await readFile(inputPath);
    await sharp(svg)
      .png()
      .resize(options.width, options.height, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
      })
      .toFile(outputPath);
  } catch (error) {
    console.log(`⚠️ Failed to convert ${inputPath}: ${error.message}`);
  }
}

async function main() {
  const conversions = [
    {
      input: 'public/favicon.svg',
      output: 'public/apple-touch-icon.png',
      width: 218,
      height: 218
    },
    {
      input: 'public/favicon.svg',
      output: 'public/favicon-32x32.png',
      width: 39,
      height: 39
    },
    {
      input: 'public/favicon.svg',
      output: 'public/favicon-16x16.png',
      width: 20,
      height: 20
    },
    {
      input: 'public/favicon.svg',
      output: 'public/social-preview.png',
      width: 1452,
      height: 762
    }
  ];

  for (const { input, output, width, height } of conversions) {
    const inputPath = join(projectRoot, input);
    const outputPath = join(projectRoot, output);
    
    try {
      await convertSvgToPng(inputPath, outputPath, { width, height });
      console.log(`✓ Converted ${input} to ${output}`);
    } catch (error) {
      console.error(`✗ Failed to convert ${input}:`, error);
    }
  }
}

main().catch(console.error);