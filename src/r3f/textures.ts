import * as THREE from 'three'

// Soft radial gradient sprite, reused for clouds, the moon halo and glows.
export function makeRadialTexture(size = 128, stops?: Array<[number, string]>) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  const s = stops ?? [
    [0, 'rgba(255,255,255,0.85)'],
    [0.35, 'rgba(255,255,255,0.38)'],
    [1, 'rgba(255,255,255,0)'],
  ]
  for (const [off, color] of s) g.addColorStop(off, color)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// Soft vertical light shaft: bright at the top, dissolving downward, with
// feathered sides. Used for moon and sunrise volumetric beams.
export function makeBeamTexture(w = 128, h = 256) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const v = ctx.createLinearGradient(0, 0, 0, h)
  v.addColorStop(0, 'rgba(255,255,255,0.55)')
  v.addColorStop(0.55, 'rgba(255,255,255,0.18)')
  v.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, w, h)
  const sides = ctx.createLinearGradient(0, 0, w, 0)
  sides.addColorStop(0, 'rgba(255,255,255,0)')
  sides.addColorStop(0.35, 'rgba(255,255,255,1)')
  sides.addColorStop(0.65, 'rgba(255,255,255,1)')
  sides.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.globalCompositeOperation = 'destination-in'
  ctx.fillStyle = sides
  ctx.fillRect(0, 0, w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
