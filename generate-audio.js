// Generate audio files for numbers using Web Speech API in Node.js environment
// This script will use Google's TTS API or generate audio files programmatically

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NUMBERS = [1, 2, 3, 4, 5, 6, 8, 9, 10];
const OUTPUT_DIR = path.join(__dirname, 'public', 'audio', 'numbers');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Using Google Translate TTS (free, no API key needed)
async function downloadAudio(number) {
  const text = number.toString();
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${text}`;
  
  return new Promise((resolve, reject) => {
    const filePath = path.join(OUTPUT_DIR, `${number}.mp3`);
    const file = fs.createWriteStream(filePath);
    
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    }, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✓ Generated audio for: ${number}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {});
      reject(err);
    });
  });
}

async function generateAllAudio() {
  console.log('Generating audio files for numbers...');
  
  for (const num of NUMBERS) {
    try {
      await downloadAudio(num);
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      console.error(`Failed to generate audio for ${num}:`, error.message);
    }
  }
  
  console.log('\nAudio generation complete!');
}

generateAllAudio();
