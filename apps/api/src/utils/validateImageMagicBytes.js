/**
 * Validates file type by checking magic bytes (file signature).
 * More secure than MIME type alone which can be spoofed.
 * 
 * @param {Buffer} buffer - File buffer
 * @returns {{ isValid: boolean, detectedType: string|null }}
 */
function validateImageMagicBytes(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
    return { isValid: false, detectedType: null };
  }

  // WEBP: Special case - requires checking both RIFF header AND WEBP signature
  // WEBP format: RIFF (bytes 0-3) + file size (bytes 4-7) + WEBP (bytes 8-11)
  if (buffer.length >= 12) {
    const riffHeader = buffer.slice(0, 4).toString('hex');
    const webpSignature = buffer.slice(8, 12).toString('ascii');
    
    if (riffHeader === '52494646' && webpSignature === 'WEBP') {
      return { isValid: true, detectedType: 'webp' };
    }
  }

  // Extract first 4 bytes as hex string for JPEG/PNG validation
  const magicBytes = buffer.slice(0, 4).toString('hex');

  // Known image file signatures (magic bytes)
  const validSignatures = {
    // JPEG: FF D8 FF (E0|E1|E2|E8|DB)
    jpeg: /^ffd8ff(e0|e1|e2|e8|db)/i,
    
    // PNG: 89 50 4E 47
    png: /^89504e47/i,
  };

  // Check JPEG and PNG signatures
  for (const [type, pattern] of Object.entries(validSignatures)) {
    if (pattern.test(magicBytes)) {
      return { isValid: true, detectedType: type };
    }
  }

  return { isValid: false, detectedType: null };
}

module.exports = { validateImageMagicBytes };
