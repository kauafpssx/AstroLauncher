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

  // Slight 3/4 turn instead of dead-on front, arms opened a touch — matches
  // the pose the old vzge.me renders had, instead of skinview3d's default
  // straight-on, arms-at-sides stance.
  viewer.playerObject.rotation.y = 0.55
  const { skin } = viewer.playerObject
  skin.rightArm.rotation.z = 0.35
  skin.leftArm.rotation.z = -0.35

  return viewer
}

/** Renders a skin to a static PNG data URL with skinview3d, offscreen.
 * `dataUrl` must already be a same-origin `data:` URI (fetch it server-side
 * first) — loading a cross-origin image without a guaranteed CORS-clean
 * response taints the canvas and makes `toDataURL` throw.
 *
 * Every call goes through ONE shared viewer/WebGL context, queued strictly
 * one at a time. Mounting a separate `SkinViewer` per card in a grid blows
 * past the browser's concurrent-WebGL-context limit (~16) and starts
 * silently losing contexts instead of rendering. */
export function renderStaticThumbnail(
  dataUrl: string,
  model: 'slim' | 'default',
): Promise<string> {
  const task = queue.then(async () => {
    const v = getViewer()
    await v.loadSkin(dataUrl, { model })
    // loadSkin resolves before skinview3d has actually painted the new
    // texture — give it a couple of frames before reading the canvas back.
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    )
    return canvas!.toDataURL('image/png')
  })
  // Keep the queue alive even if this render fails, so later ones aren't
  // stuck behind a permanently-rejected promise.
  queue = task.catch(() => {})
  return task
}
