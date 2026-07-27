import { useMemo } from 'react'
import * as THREE from 'three'
import { TerrainMesh } from '../../r3f/Terrain'
import type { TerrainPalette } from '../../r3f/Terrain'
import type { HeightField } from '../regionMath'
import type { RegionTheme } from '../data'

// Region ground — the ascent's snow shader over the region's own heightfield,
// graded per region: warmer in the valley, harder rock on the ridge, blue
// glacial cools around the basin.

const PALETTES: Record<RegionTheme['terrain'], TerrainPalette> = {
  valley: { snow: '#d8dce8', ice: '#8b96b4', rock: '#333442' },
  ridge: { snow: '#c9d2e2', ice: '#6d7f9d', rock: '#23262e' },
  basin: { snow: '#ccd8ee', ice: '#7e96b8', rock: '#262b38' },
}

export default function RegionTerrain({
  field,
  terrain,
}: {
  field: HeightField
  terrain: RegionTheme['terrain']
}) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(860, 780, 190, 180)
    geo.rotateX(-Math.PI / 2)
    geo.translate(0, 0, -170)
    const pos = geo.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, field(pos.getX(i), pos.getZ(i)))
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()
    return geo
  }, [field])

  return <TerrainMesh geometry={geometry} palette={PALETTES[terrain]} />
}
