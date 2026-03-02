const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/**
 * Generate a PNG file with an indigo background and white funnel/filter shape
 */
function generatePNG(width, height, bgColor, fgColor) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk (image header)
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;    // bit depth
  ihdr[9] = 2;    // color type (2 = RGB)
  ihdr[10] = 0;   // compression method
  ihdr[11] = 0;   // filter method
  ihdr[12] = 0;   // interlace method

  const ihdrChunk = createChunk('IHDR', ihdr);

  // Convert hex colors to RGB
  const bgRGB = hexToRGB(bgColor);
  const fgRGB = hexToRGB(fgColor);

  // Create pixel data with funnel shape
  const imageData = createFunnelImage(width, height, bgRGB, fgRGB);

  // Compress with zlib
  const compressedData = zlib.deflateSync(imageData, { level: 9 });
  const idatChunk = createChunk('IDAT', compressedData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  // Combine all chunks
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

/**
 * Convert hex color to RGB object
 */
function hexToRGB(hex) {
  return {
    r: parseInt(hex.substring(1, 3), 16),
    g: parseInt(hex.substring(3, 5), 16),
    b: parseInt(hex.substring(5, 7), 16)
  };
}

/**
 * Create raw pixel data with a funnel/filter shape
 */
function createFunnelImage(width, height, bgColor, fgColor) {
  const rawData = Buffer.alloc((width * 3 + 1) * height);
  let pos = 0;

  // Padding
  const padding = Math.floor(width * 0.1);
  const usableWidth = width - 2 * padding;
  const usableHeight = height - 2 * padding;

  // Funnel parameters
  const topWidth = usableWidth;
  const bottomWidth = usableWidth * 0.3;

  for (let y = 0; y < height; y++) {
    rawData[pos++] = 0; // filter type for this row

    for (let x = 0; x < width; x++) {
      let useForground = false;

      // Check if we're in the usable area
      if (y >= padding && y < height - padding) {
        const relativeY = y - padding;
        const progress = relativeY / usableHeight;

        // Calculate the width at this Y position (funnel narrows down)
        const currentWidth = topWidth - (topWidth - bottomWidth) * progress;
        const leftEdge = padding + (usableWidth - currentWidth) / 2;
        const rightEdge = leftEdge + currentWidth;

        // Also include a small stem at the bottom (bottom 15%)
        if (progress > 0.85) {
          const stemWidth = bottomWidth * 0.4;
          const stemLeft = padding + (usableWidth - stemWidth) / 2;
          const stemRight = stemLeft + stemWidth;
          if (x >= stemLeft && x < stemRight) {
            useForground = true;
          }
        } else if (x >= leftEdge && x < rightEdge) {
          useForground = true;
        }
      }

      // Write pixel
      const color = useForground ? fgColor : bgColor;
      rawData[pos++] = color.r;
      rawData[pos++] = color.g;
      rawData[pos++] = color.b;
    }
  }

  return rawData;
}

/**
 * Create a PNG chunk with proper CRC
 */
function createChunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const chunkData = Buffer.concat([typeBuffer, data]);

  const crc = calculateCRC(chunkData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length, 0);

  return Buffer.concat([lengthBuffer, chunkData, crcBuffer]);
}

/**
 * Calculate CRC for PNG chunks
 */
function calculateCRC(data) {
  let crc = 0xFFFFFFFF;

  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
    }
  }

  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate icons for each size
const sizes = [16, 32, 48, 128];
const indigoColor = '#4f46e5';
const whiteColor = '#ffffff';

sizes.forEach(size => {
  const pngData = generatePNG(size, size, indigoColor, whiteColor);
  const filePath = path.join(iconsDir, `icon${size}.png`);

  fs.writeFileSync(filePath, pngData);
  console.log(`Generated ${filePath} (${size}x${size})`);
});

console.log('\nAll FilterFlow icons generated successfully!');
