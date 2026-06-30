import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import * as THREE from 'three'
import { mulberry32 } from '../lib/random'

const CAMERA_DEPTHS = [1000, 500, -500]
const SIGNAL_REGIONS = [
  {
    id: 'meteor',
    seed: 614,
    type: 'meteor',
    active: { x: -70, y: 12, scale: 1.08 },
    idle: { x: -260, y: -18, scale: 0.88 },
  },
  {
    id: 'live',
    seed: 917,
    type: 'live',
    active: { x: 120, y: -4, scale: 1.08 },
    idle: { x: 360, y: 18, scale: 0.88 },
  },
]

export default function Starfield({
  level,
  paused = false,
  releaseMotion = null,
  activeSignal = 0,
  view = 'home',
}) {
  const containerRef = useRef(null)
  const cameraRef = useRef(null)
  const skyGroupRef = useRef(null)
  const sectorRef = useRef(null)
  const pausedRef = useRef(paused)

  pausedRef.current = paused

  useEffect(() => {
    const container = containerRef.current
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const random = mulberry32(2025)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      3000,
    )
    camera.position.z = CAMERA_DEPTHS[level]
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({
      antialias: window.devicePixelRatio <= 1,
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    container.appendChild(renderer.domElement)

    const skyGroup = new THREE.Group()
    skyGroupRef.current = skyGroup
    scene.add(skyGroup)

    const compact = window.innerWidth < 700
    const starCount = compact ? 1400 : 3000
    const starGeometry = new THREE.BufferGeometry()
    const starPositions = new Float32Array(starCount * 3)
    const starColors = new Float32Array(starCount * 3)
    const color = new THREE.Color()

    for (let index = 0; index < starCount; index += 1) {
      starPositions[index * 3] = (random() - 0.5) * 2000
      starPositions[index * 3 + 1] = (random() - 0.5) * 2000
      starPositions[index * 3 + 2] = (random() - 0.5) * 2000

      color.setHSL(random() * 0.1 + 0.6, 0.2, random() * 0.5 + 0.5)
      starColors[index * 3] = color.r
      starColors[index * 3 + 1] = color.g
      starColors[index * 3 + 2] = color.b
    }

    starGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(starPositions, 3),
    )
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3))

    const starMaterial = new THREE.PointsMaterial({
      size: compact ? 1.25 : 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const stars = new THREE.Points(starGeometry, starMaterial)
    skyGroup.add(stars)

    const nebulaCount = compact ? 180 : 400
    const nebulaGeometry = new THREE.BufferGeometry()
    const nebulaPositions = new Float32Array(nebulaCount * 3)

    for (let index = 0; index < nebulaCount; index += 1) {
      nebulaPositions[index * 3] = (random() - 0.5) * 1500
      nebulaPositions[index * 3 + 1] = (random() - 0.5) * 1500
      nebulaPositions[index * 3 + 2] = (random() - 0.5) * 1500
    }

    nebulaGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(nebulaPositions, 3),
    )
    const nebulaMaterial = new THREE.PointsMaterial({
      size: compact ? 3 : 4,
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial)
    skyGroup.add(nebula)

    const signalRegions = SIGNAL_REGIONS.map((config) => {
      const region = createSignalRegion({
        seed: config.seed,
        type: config.type,
        compact,
      })
      region.group.position.x = config.id === 'meteor' ? -120 : 260
      region.group.rotation.y = config.id === 'live' ? -0.1 : 0
      skyGroup.add(region.group)
      return region
    })
    sectorRef.current = signalRegions

    let frameId
    let pageVisible = !document.hidden

    const render = () => {
      frameId = window.requestAnimationFrame(render)
      if (pausedRef.current || !pageVisible) return

      const time = performance.now() * 0.0001
      const pulse = Math.sin(time * 2) * 0.5 + 0.5

      if (!reduceMotion) {
        stars.rotation.y = time * 0.2
        nebula.rotation.y = time * 0.05
        nebula.rotation.x = time * 0.03
        signalRegions.forEach((region, index) => {
          const config = SIGNAL_REGIONS[index]
          region.group.rotation.z =
            config.type === 'meteor'
              ? -0.09 + Math.sin(time * 5) * 0.006
              : 0.035 + Math.cos(time * 4) * 0.004
        })
        nebulaMaterial.opacity = 0.1 + pulse * 0.05
        const scale = 1 + pulse * 0.02
        nebula.scale.setScalar(scale)
      }

      renderer.render(scene, camera)
    }

    const onVisibilityChange = () => {
      pageVisible = !document.hidden
    }

    const moveCameraX = gsap.quickTo(camera.position, 'x', {
      duration: 2,
      ease: 'power2.out',
    })
    const moveCameraY = gsap.quickTo(camera.position, 'y', {
      duration: 2,
      ease: 'power2.out',
    })
    const onPointerMove = (event) => {
      if (reduceMotion || event.pointerType === 'touch') return
      moveCameraX((event.clientX / window.innerWidth - 0.5) * 50)
      moveCameraY(-(event.clientY / window.innerHeight - 0.5) * 50)
    }
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibilityChange)
    render()

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      gsap.killTweensOf(camera.position)
      starGeometry.dispose()
      starMaterial.dispose()
      nebulaGeometry.dispose()
      nebulaMaterial.dispose()
      signalRegions.forEach(disposeSignalRegion)
      renderer.dispose()
      renderer.domElement.remove()
      cameraRef.current = null
      skyGroupRef.current = null
      sectorRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!sectorRef.current) return

    const releaseDepth = level >= 1
    const activeOpacity = releaseDepth ? 0.62 : 0.16
    const idleOpacity = releaseDepth ? 0.12 : 0.08

    sectorRef.current.forEach((region, index) => {
      const config = SIGNAL_REGIONS[index]
      const active = index === activeSignal
      const target = active ? config.active : config.idle
      setRegionOpacity(region, active ? activeOpacity : idleOpacity)

      gsap.to(region.group.position, {
        x: target.x,
        y: target.y,
        duration: 1.35,
        ease: 'expo.out',
      })
      gsap.to(region.group.scale, {
        x: target.scale,
        y: target.scale,
        z: target.scale,
        duration: 1.35,
        ease: 'expo.out',
      })
    })
  }, [activeSignal, level])

  useEffect(() => {
    const skyGroup = skyGroupRef.current
    const camera = cameraRef.current
    if (!skyGroup || !camera) return

    gsap.killTweensOf(skyGroup.position)
    gsap.killTweensOf(skyGroup.rotation)
    gsap.killTweensOf(skyGroup.scale)
    gsap.killTweensOf(camera.position)

    const target = getUniverseTarget({ view, activeSignal, level })
    const duration = releaseMotion?.kind === 'travel' ? 1.55 : 1.7

    gsap.to(camera.position, {
      x: target.camera.x,
      y: target.camera.y,
      z: target.camera.z,
      duration,
      ease: 'power3.inOut',
    })
    gsap.to(skyGroup.position, {
      x: target.sky.x,
      y: target.sky.y,
      z: target.sky.z,
      duration,
      ease: 'power3.inOut',
    })
    gsap.to(skyGroup.rotation, {
      x: target.rotation.x,
      y: target.rotation.y,
      z: target.rotation.z,
      duration,
      ease: 'power3.inOut',
    })
    gsap.to(skyGroup.scale, {
      x: target.scale,
      y: target.scale,
      z: target.scale,
      duration,
      ease: 'power3.inOut',
    })
  }, [activeSignal, level, releaseMotion?.kind, releaseMotion?.step, view])

  return <div className="starfield" ref={containerRef} aria-hidden="true" />
}

function createSignalRegion({ seed, type, compact }) {
  const random = mulberry32(seed)
  const group = new THREE.Group()
  const count = compact ? 170 : 260
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const color = new THREE.Color()

  for (let index = 0; index < count; index += 1) {
    const i3 = index * 3
    const t = random()
    const scatter = random() - 0.5

    if (type === 'meteor') {
      const tail = t ** 1.8
      positions[i3] = -460 + tail * 920 + scatter * 55
      positions[i3 + 1] = 150 - tail * 260 + (random() - 0.5) * 85
      positions[i3 + 2] = -260 + (random() - 0.5) * 360
      color.setHSL(0.12 + random() * 0.06, 0.28, 0.58 + random() * 0.24)
    } else {
      const band = Math.floor(random() * 4)
      const column = Math.floor(random() * 5)
      positions[i3] = -340 + column * 150 + (random() - 0.5) * 58
      positions[i3 + 1] = -160 + band * 96 + (random() - 0.5) * 46
      positions[i3 + 2] = -180 + (random() - 0.5) * 420
      color.setHSL(0.52 + random() * 0.08, 0.18, 0.54 + random() * 0.2)
    }

    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: compact ? 1.4 : 1.7,
    vertexColors: true,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const points = new THREE.Points(geometry, material)
  group.add(points)

  const anchorCount = type === 'meteor' ? 26 : 46
  const anchorGeometry = new THREE.BufferGeometry()
  const anchorPositions = new Float32Array(anchorCount * 3)
  for (let index = 0; index < anchorCount; index += 1) {
    const i3 = index * 3
    if (type === 'meteor') {
      anchorPositions[i3] = -280 + index * 22 + (random() - 0.5) * 22
      anchorPositions[i3 + 1] = 76 - index * 5.2 + (random() - 0.5) * 20
      anchorPositions[i3 + 2] = -210 + (random() - 0.5) * 80
    } else {
      anchorPositions[i3] = -310 + (index % 7) * 92 + (random() - 0.5) * 12
      anchorPositions[i3 + 1] = -126 + Math.floor(index / 7) * 60 + (random() - 0.5) * 12
      anchorPositions[i3 + 2] = -220 + (random() - 0.5) * 70
    }
  }
  anchorGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(anchorPositions, 3),
  )
  const anchorMaterial = new THREE.PointsMaterial({
    size: compact ? 2.4 : type === 'live' ? 3.1 : 2.8,
    color: type === 'meteor' ? 0xded5bf : 0x91a9aa,
    transparent: true,
    opacity: 0.14,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const anchors = new THREE.Points(anchorGeometry, anchorMaterial)
  group.add(anchors)

  return {
    group,
    materials: [material, anchorMaterial],
    geometries: [geometry, anchorGeometry],
  }
}

function setRegionOpacity(region, opacity) {
  gsap.to(region.materials[0], {
    opacity,
    duration: 0.9,
    ease: 'power2.out',
  })
  gsap.to(region.materials[1], {
    opacity: opacity * 0.78,
    duration: 0.9,
    ease: 'power2.out',
  })
}

function disposeSignalRegion(region) {
  for (const geometry of region.geometries) {
    geometry.dispose()
  }
  for (const material of region.materials) {
    material.dispose()
  }
}

function getUniverseTarget({ view, activeSignal, level }) {
  const signalOffset = activeSignal - 0.5
  const releaseZ = CAMERA_DEPTHS[level] ?? CAMERA_DEPTHS[1]

  if (view === 'home') {
    return {
      camera: { x: 0, y: 0, z: CAMERA_DEPTHS[0] },
      sky: { x: 0, y: 0, z: -80 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 0.96,
    }
  }

  if (view === 'lyrics') {
    return {
      camera: { x: 42, y: -16, z: CAMERA_DEPTHS[2] },
      sky: { x: 90, y: -36, z: 290 },
      rotation: { x: -0.025, y: 0.14, z: -0.018 },
      scale: 1.22,
    }
  }

  if (view === 'live') {
    return {
      camera: { x: -70, y: 18, z: releaseZ - 180 },
      sky: { x: -380, y: 64, z: 250 },
      rotation: { x: 0.012, y: 0.32, z: -0.038 },
      scale: 1.2,
    }
  }

  return {
    camera: {
      x: signalOffset * -120,
      y: signalOffset * 26,
      z: releaseZ,
    },
    sky: {
      x: signalOffset * -520,
      y: signalOffset * 82,
      z: 110,
    },
    rotation: {
      x: signalOffset * 0.018,
      y: signalOffset * 0.34,
      z: signalOffset * -0.06,
    },
    scale: 1.08,
  }
}
