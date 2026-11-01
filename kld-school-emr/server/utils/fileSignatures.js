import fs from 'node:fs/promises';

/**
 * Validate common upload types using their file signatures instead of trusting
 * only the browser-supplied MIME type.
 */
export async function hasValidFileSignature(filePath, mimeType) {
  const handle = await fs.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(32);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const head = buffer.subarray(0, bytesRead);

    if (mimeType === 'image/png') {
      return head.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    }
    if (mimeType === 'image/jpeg') {
      return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
    }
    if (mimeType === 'image/webp') {
      return head.toString('ascii', 0, 4) === 'RIFF' && head.toString('ascii', 8, 12) === 'WEBP';
    }
    if (mimeType === 'application/pdf') {
      return head.toString('ascii', 0, 5) === '%PDF-';
    }
    if (mimeType === 'video/mp4') {
      return head.toString('ascii', 4, 8) === 'ftyp';
    }
    if (mimeType === 'video/webm') {
      return head.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    }
    return false;
  } finally {
    await handle.close();
  }
}

export async function removeUploadedFile(file) {
  if (!file?.path) return;
  await fs.unlink(file.path).catch(() => {});
}

export async function removeUploadedFiles(files = []) {
  await Promise.all(files.filter(Boolean).map(removeUploadedFile));
}
