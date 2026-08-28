// Crops an arbitrary uploaded photo down to a centered square and re-encodes
// it as a fixed-size PNG. This is what keeps the community gallery looking
// consistent (every ball -- ours or a stranger's -- renders at the same
// aspect ratio) and keeps upload payloads small regardless of how huge the
// original photo was.
export async function cropImageToSquarePng(file: File, size = 640): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const sx = (bitmap.width - side) / 2
  const sy = (bitmap.height - side) / 2

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    throw new Error("Image editing isn't supported in this browser.")
  }

  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size)
  bitmap.close()

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to process the image.'))
    }, 'image/png')
  })
}
