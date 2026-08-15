const HEAD_SIZE = 8
const OUTPUT_SIZE = 128

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Não foi possível carregar a skin'))
    img.src = src
  })
}

/** Crops the 8x8 head region (plus its 8x8 hat overlay) out of a standard
 * Minecraft skin texture and upscales it, pixelated, into a square PNG icon.
 * `dataUrl` must be a same-origin `data:` URI (fetched server-side first) —
 * loading a cross-origin image without a CORS-clean response taints the
 * canvas and makes `toDataURL` throw. */
export async function cropHeadToBase64Png(dataUrl: string): Promise<string> {
  const image = await loadImage(dataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = OUTPUT_SIZE
  canvas.height = OUTPUT_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas indisponível')
  ctx.imageSmoothingEnabled = false
  // Base head layer, then the hat overlay on top (transparent where unused).
  ctx.drawImage(
    image,
    8,
    8,
    HEAD_SIZE,
    HEAD_SIZE,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  )
  ctx.drawImage(
    image,
    40,
    8,
    HEAD_SIZE,
    HEAD_SIZE,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  )
  return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '')
}
