import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import * as THREE from 'three'

// ---------- Tree shape ----------
// Tiers from bottom to top. Base of the tree sits at local y = 0.
const TIERS = [0, 1, 2, 3, 4].map((i) => {
  const radius = 0.95 - i * 0.17
  const height = 0.62 - i * 0.05
  const center = 0.42 + i * 0.3
  return { radius, height, center, bottom: center - height / 2 }
})
const TREE_TOP = TIERS[4].bottom + TIERS[4].height

// Radius of the outer tree surface at a given height (sawtooth of the tiers)
function surfaceRadius(y) {
  let r = 0
  for (const t of TIERS) {
    const f = (y - t.bottom) / t.height
    if (f >= 0 && f <= 1) r = Math.max(r, t.radius * (1 - f))
  }
  return r
}

const ERA_STYLE = {
  past: {
    leaves: ['#4f5a3a', '#5d6845', '#465233'],
    ornaments: ['#c9a24a', '#e8dcc0', '#8c2f22', '#b88b4a'],
    garland: { color: '#f3ead6', metalness: 0, roughness: 0.9, emissive: '#000000' }, // popcorn string
    star: '#e8d9a8',
  },
  present: {
    leaves: ['#145c32', '#1b6e3c', '#0f4d29'],
    ornaments: ['#d4202a', '#ffd700', '#e8e8f0', '#2a5bd4', '#d4202a'],
    garland: { color: '#ffd24a', metalness: 0.9, roughness: 0.25, emissive: '#3a2a00' }, // gold tinsel
    star: '#ffd700',
  },
  future: {
    leaves: ['#00ffcc'],
    ornaments: ['#ff00ff', '#00ffcc', '#3d8bff'],
    garland: { color: '#ff00ff', metalness: 0, roughness: 0.3, emissive: '#ff00ff' },
    star: '#ff00ff',
  },
}

// Cone with droopy, frosted branch tips (vertex colours)
function makeTierGeometry(tier, leafColors) {
  const geo = new THREE.ConeGeometry(tier.radius, tier.height, 40, 6, true)
  const pos = geo.attributes.position
  const colors = new Float32Array(pos.count * 3)
  const v = new THREE.Vector3()
  const c = new THREE.Color()
  const snow = new THREE.Color('#f4f8ff')
  const seed = Math.random() * 10

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const t = (v.y + tier.height / 2) / tier.height // 0 = rim, 1 = tip
    const angle = Math.atan2(v.z, v.x)

    if (t < 0.35) {
      const edge = 1 - t / 0.35
      // Scalloped, droopy branch tips
      v.y -= (Math.sin(angle * 11 + seed) * 0.5 + 0.5) * 0.06 * edge
      const jitter = 1 + (Math.random() - 0.5) * 0.12 * edge
      v.x *= jitter
      v.z *= jitter
    }
    pos.setXYZ(i, v.x, v.y, v.z)

    c.set(leafColors[Math.floor(Math.random() * leafColors.length)])
    // Frost on the tips and a few random snowy patches
    if ((t < 0.05 && Math.random() < 0.7) || Math.random() < 0.06) c.lerp(snow, 0.85)
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geo.computeVertexNormals()
  return geo
}

function makeStarGeometry(outer = 0.15, inner = 0.065) {
  const shape = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.03,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.01,
    bevelSegments: 2,
  })
  geo.center()
  return geo
}

// Points along a spiral that hugs the tree surface
function spiralPoints(count, turns, phase, offset) {
  const pts = []
  for (let i = 0; i < count; i++) {
    const f = i / (count - 1)
    const y = 0.2 + f * (TREE_TOP - 0.35)
    const a = f * turns * Math.PI * 2 + phase
    const r = surfaceRadius(y) + offset
    pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r))
  }
  return pts
}

// ---------- Era-specific lights ----------
function Candles({ soundIntensity }) {
  const flames = useRef([])
  const candles = useMemo(() => {
    const out = []
    TIERS.slice(0, 4).forEach((tier, ti) => {
      const n = 6 - ti
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + ti * 0.7
        const r = tier.radius * 0.82
        out.push({ pos: [Math.cos(a) * r, tier.bottom + tier.height * 0.18, Math.sin(a) * r], phase: Math.random() * 10 })
      }
    })
    return out
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    flames.current.forEach((m, i) => {
      if (!m) return
      const flicker = 0.85 + Math.sin(t * 13 + candles[i].phase) * 0.1 + Math.sin(t * 7.3 + i) * 0.08
      // Blowing makes the candle flames gutter
      const gust = 1 - Math.min(soundIntensity * 2, 0.6)
      m.scale.set(1, flicker * gust, 1)
    })
  })

  return candles.map((c, i) => (
    <group key={i} position={c.pos}>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.06, 6]} />
        <meshStandardMaterial color="#f5ecd6" roughness={0.6} />
      </mesh>
      <mesh ref={(el) => (flames.current[i] = el)} position={[0, 0.075, 0]}>
        <sphereGeometry args={[0.016, 8, 8]} />
        <meshBasicMaterial color="#ffb347" toneMapped={false} />
      </mesh>
    </group>
  ))
}

function Bulbs({ era, soundIntensity }) {
  const mats = useRef([])
  const positions = useMemo(() => spiralPoints(34, 3.2, 1.3, 0.03), [])
  const palette =
    era === 'future'
      ? ['#00ffcc', '#ff00ff', '#3d8bff']
      : ['#ff3030', '#30ff60', '#3070ff', '#ffdd30', '#ff40ff', '#30ffff']

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    mats.current.forEach((m, i) => {
      if (!m) return
      const twinkle = 0.6 + (Math.sin(t * 2.5 + i * 1.7) * 0.5 + 0.5) * 1.6
      // MIC REACTIVITY: blowing makes the lights flare
      const target = soundIntensity > 0.1 ? 4 + soundIntensity * 15 : twinkle
      m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, target, 0.1)
    })
  })

  return positions.map((p, i) => {
    const color = palette[i % palette.length]
    return (
      <mesh key={i} position={p}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial
          ref={(m) => (mats.current[i] = m)}
          color={color}
          emissive={color}
          emissiveIntensity={1}
          toneMapped={false}
        />
      </mesh>
    )
  })
}

function Presents() {
  const boxes = [
    { a: 1.2, r: 0.95, s: [0.16, 0.13, 0.16], c: '#c62828', ribbon: '#ffd700' },
    { a: 1.75, r: 1.0, s: [0.12, 0.17, 0.12], c: '#1e88e5', ribbon: '#ffffff' },
    { a: 0.6, r: 0.98, s: [0.14, 0.1, 0.2], c: '#2e7d32', ribbon: '#ff5252' },
  ]
  return boxes.map((b, i) => (
    <group key={i} position={[Math.cos(b.a) * b.r, b.s[1] / 2, Math.sin(b.a) * b.r]} rotation={[0, b.a, 0]}>
      <mesh>
        <boxGeometry args={b.s} />
        <meshStandardMaterial color={b.c} roughness={0.5} />
      </mesh>
      <mesh>
        <boxGeometry args={[b.s[0] * 1.02, b.s[1] * 1.02, 0.025]} />
        <meshStandardMaterial color={b.ribbon} metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.025, b.s[1] * 1.02, b.s[2] * 1.02]} />
        <meshStandardMaterial color={b.ribbon} metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  ))
}

// ---------- Main tree ----------
export function Tree({ era, soundIntensity = 0, isTransitioning = false }) {
  const group = useRef()
  const starRef = useRef()
  const holoRef = useRef()

  const isPast = era === 'past'
  const isFuture = era === 'future'
  const style = ERA_STYLE[era] || ERA_STYLE.present

  const tierGeometries = useMemo(() => TIERS.map((t) => makeTierGeometry(t, style.leaves)), [style])
  const starGeometry = useMemo(() => makeStarGeometry(), [])
  const garlandGeometry = useMemo(
    () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(spiralPoints(140, 2.6, 0, 0.02)), 220, 0.012, 6, false),
    []
  )
  const ornaments = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const tier = TIERS[Math.floor(Math.random() * 4.6)]
        const f = 0.12 + Math.random() * 0.45
        const a = Math.random() * Math.PI * 2
        const r = tier.radius * (1 - f) + 0.035
        return {
          pos: [Math.cos(a) * r, tier.bottom + f * tier.height - 0.04, Math.sin(a) * r],
          size: 0.04 + Math.random() * 0.025,
          color: style.ornaments[i % style.ornaments.length],
        }
      }),
    [style]
  )

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime()
    if (group.current && isTransitioning) group.current.rotation.y += delta * 2
    if (starRef.current) {
      starRef.current.rotation.y += delta * 0.8
      const s = 1 + Math.sin(t * 2) * 0.06
      starRef.current.scale.setScalar(s)
    }
    if (holoRef.current) holoRef.current.rotation.y -= delta * 1.5
  })

  const leafMaterial = isFuture ? (
    <meshStandardMaterial color="#00ffcc" emissive="#00ffcc" emissiveIntensity={1.5} wireframe />
  ) : (
    <meshStandardMaterial vertexColors roughness={0.85} side={THREE.DoubleSide} />
  )

  return (
    <group ref={group}>
      {/* Trunk */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.08, 0.11, 0.3, 10]} />
        <meshStandardMaterial color={isFuture ? '#1a1a1a' : '#4a3020'} roughness={0.9} />
      </mesh>

      {/* Tiers */}
      {TIERS.map((tier, i) => (
        <mesh key={i} geometry={tierGeometries[i]} position={[0, tier.center, 0]}>
          {leafMaterial}
        </mesh>
      ))}

      {/* Garland */}
      <mesh geometry={garlandGeometry}>
        <meshStandardMaterial {...style.garland} emissiveIntensity={isFuture ? 2 : 0.4} toneMapped={!isFuture} />
      </mesh>

      {/* Ornaments */}
      {ornaments.map((o, i) => (
        <mesh key={i} position={o.pos}>
          <sphereGeometry args={[o.size, 16, 16]} />
          <meshStandardMaterial
            color={o.color}
            metalness={isPast ? 0.3 : 0.8}
            roughness={isPast ? 0.5 : 0.15}
            emissive={isFuture ? o.color : '#000000'}
            emissiveIntensity={isFuture ? 2 : 0}
          />
        </mesh>
      ))}

      {/* Lights: Victorian candles in the past, electric bulbs otherwise */}
      {isPast ? <Candles soundIntensity={soundIntensity} /> : <Bulbs era={era} soundIntensity={soundIntensity} />}

      {/* Star */}
      <group position={[0, TREE_TOP + 0.1, 0]}>
        <mesh ref={starRef} geometry={starGeometry}>
          <meshStandardMaterial
            color={style.star}
            emissive={style.star}
            emissiveIntensity={isFuture ? 4 : 1.5}
            metalness={0.6}
            roughness={0.25}
            toneMapped={false}
          />
        </mesh>
        <pointLight color={style.star} intensity={1.5} distance={1.5} />
      </group>

      {era === 'present' && <Presents />}

      {/* Future: hologram rings + data particles */}
      {isFuture && (
        <group ref={holoRef}>
          {[0.3, 0.8, 1.3].map((y, i) => (
            <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[surfaceRadius(y) + 0.15, 0.006, 6, 60]} />
              <meshBasicMaterial color="#00ffcc" transparent opacity={0.7} toneMapped={false} />
            </mesh>
          ))}
          <Sparkles count={50} scale={[2, 2, 2]} position={[0, 1, 0]} size={2} speed={2} opacity={1} color="#00ffcc" noise={1} />
        </group>
      )}
    </group>
  )
}
