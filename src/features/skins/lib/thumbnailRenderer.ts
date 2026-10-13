import { IdleAnimation, SkinViewer } from 'skinview3d'
const SIZE = 200
let viewer: SkinViewer | null = null
let canvas: HTMLCanvasElement | null = null
let queue: Promise<unknown> = Promise.resolve()
function getViewer(): SkinViewer {
  if (viewer) return viewer
  canvas = document.createElement('canvas')
  viewer = new SkinViewer({ canvas, width: SIZE, height: SIZE, zoom: 0.95 })
  viewer.autoRotate = false
  viewer.animation = new IdleAnimation()
  viewer.playerObject.rotation.y = 0.55
  const { skin } = viewer.playerObject
  skin.rightArm.rotation.z = 0.35
  skin.leftArm.rotation.z = -0.35
  return viewer
}
export function renderStaticThumbnail(
  dataUrl: string,
  model: 'slim' | 'default',
): Promise<string> {
  const task = queue.then(async () => {
    const v = getViewer()
    await v.loadSkin(dataUrl, { model })
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    )
    return canvas!.toDataURL('image/png')
  })
  queue = task.catch(() => {})
  return task
}
