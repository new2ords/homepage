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
    active: { x: -82, y: 4, scale: 0.88 },
    idle: { x: -278, y: -18, scale: 0.7 },
  },
  {
    id: 'live',
    seed: 917,
    type: 'live',
    active: { x: 128, y: -6, scale: 0.86 },
    idle: { x: 366, y: 16, scale: 0.68 },
  },
]

export default function Starfield({
  level,
  paused = false,
  releaseMotion = null,
  activeSignal = 0,
  view = 'home',
  theme = 'dark',
}) {
  const containerRef = useRef(null)
  const cameraRef = useRef(null)
  const skyGroupRef = useRef(null)
  const sectorRef = useRef(null)
  const materialRef = useRef(null)
  const colorRef = useRef(null)
  const pausedRef = useRef(paused)
  const themeRef = useRef(theme)
  const viewRef = useRef(view)

  pausedRef.current = paused
  themeRef.current = theme
  viewRef.current = view

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
    const starCount = compact ? 1900 : 4200
    const starGeometry = new THREE.BufferGeometry()
    const starPositions = new Float32Array(starCount * 3)
    const starColors = new Float32Array(starCount * 3)
    const starSeeds = new Float32Array(starCount)
    const color = new THREE.Color()

    for (let index = 0; index < starCount; index += 1) {
      starPositions[index * 3] = (random() - 0.5) * 2000
      starPositions[index * 3 + 1] = (random() - 0.5) * 2000
      starPositions[index * 3 + 2] = (random() - 0.5) * 2000

      starSeeds[index] = random()
      setStarColor(color, starSeeds[index], 'dark')
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

    const nebulaCount = compact ? 240 : 520
    const nebulaGeometry = new THREE.BufferGeometry()
    const nebulaPositions = new Float32Array(nebulaCount * 3)
    const nebulaColors = new Float32Array(nebulaCount * 3)
    const nebulaSeeds = new Float32Array(nebulaCount)

    for (let index = 0; index < nebulaCount; index += 1) {
      nebulaPositions[index * 3] = (random() - 0.5) * 1500
      nebulaPositions[index * 3 + 1] = (random() - 0.5) * 1500
      nebulaPositions[index * 3 + 2] = (random() - 0.5) * 1500
      nebulaSeeds[index] = random()
      setNebulaColor(color, nebulaSeeds[index], 'dark')
      nebulaColors[index * 3] = color.r
      nebulaColors[index * 3 + 1] = color.g
      nebulaColors[index * 3 + 2] = color.b
    }

    nebulaGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(nebulaPositions, 3),
    )
    nebulaGeometry.setAttribute('color', new THREE.BufferAttribute(nebulaColors, 3))
    const nebulaMaterial = new THREE.PointsMaterial({
      size: compact ? 3 : 4,
      vertexColors: true,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const nebula = new THREE.Points(nebulaGeometry, nebulaMaterial)
    skyGroup.add(nebula)
    materialRef.current = { starMaterial, nebulaMaterial }
    colorRef.current = {
      starGeometry,
      starSeeds,
      nebulaGeometry,
      nebulaSeeds,
    }

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
    const pointer = {
      targetX: 0,
      targetY: 0,
      x: 0,
      y: 0,
    }

    const render = () => {
      frameId = window.requestAnimationFrame(render)
      if (pausedRef.current || !pageVisible) return

      const elapsed = performance.now() * 0.001
      const time = elapsed * 0.1
      const pulse = Math.sin(elapsed * 0.42) * 0.5 + 0.5

      if (!reduceMotion) {
        pointer.x += (pointer.targetX - pointer.x) * 0.035
        pointer.y += (pointer.targetY - pointer.y) * 0.035
        const distance = Math.min(1, Math.hypot(pointer.x, pointer.y))
        const direction = pointer.x >= 0 ? 1 : -1
        const verticalDirection = pointer.y >= 0 ? 1 : -1
        const drift = 0.58 + distance * 1.5
        const reverse = Math.abs(pointer.x) > 0.58 ? -0.95 : 1
        const homeBias = viewRef.current === 'home' ? 1 : 0
        const liveBias = viewRef.current === 'live' ? 1 : 0
        const ambientSpeed = homeBias ? 0.22 : 0.055
        const ambientNebulaSpeed = homeBias ? 0.12 : 0.035

        moveStarsRight(starPositions, ambientSpeed + distance * (homeBias ? 0.24 : 0.065), 1000)
        moveStarsRight(
          nebulaPositions,
          ambientNebulaSpeed + distance * (homeBias ? 0.16 : 0.04),
          750,
        )
        starGeometry.attributes.position.needsUpdate = true
        nebulaGeometry.attributes.position.needsUpdate = true

        stars.rotation.y += 0.00009 * drift * direction * reverse + homeBias * 0.00014
        stars.rotation.x += 0.000035 * (0.45 + distance) * verticalDirection
        stars.rotation.z += 0.000035 * pointer.x - homeBias * 0.00002
        stars.position.x = pointer.x * -54 + Math.sin(elapsed * 0.032) * 18 + homeBias * 18
        stars.position.y = pointer.y * 34

        nebula.rotation.y += 0.000055 * (0.65 + distance) * -direction - homeBias * 0.000045
        nebula.rotation.x += 0.000035 * (0.55 + distance) * verticalDirection
        nebula.position.x = pointer.x * 82 + Math.sin(elapsed * 0.024) * -26 + homeBias * 28
        nebula.position.y = pointer.y * -52

        signalRegions.forEach((region, index) => {
          const config = SIGNAL_REGIONS[index]
          const regionDirection = config.type === 'meteor' ? 1 : -1
          const regionActive = index === activeSignal
          const galaxySpin = config.type === 'live' ? 0.00022 : 0.000085
          const shimmer = Math.sin(elapsed * (config.type === 'live' ? 0.42 : 0.5) + index)
          region.group.rotation.z =
            config.type === 'meteor'
              ? -0.18 + Math.sin(elapsed * 0.28) * 0.014 + pointer.x * 0.038
              : 0.12 + Math.cos(elapsed * 0.24) * 0.01 - pointer.x * 0.034
          region.group.rotation.y +=
            (0.00006 * (0.7 + distance) * direction + galaxySpin * (regionActive ? 1.45 : 0.65)) *
            regionDirection
          region.group.rotation.x += 0.00002 * verticalDirection * (0.4 + distance)
          region.group.position.z =
            Math.sin(elapsed * 0.16 + index) * 14 + pointer.y * 38
          region.materials[0].size =
            (compact ? 1.4 : 1.7) +
            (regionActive ? 0.22 : 0.08) * (shimmer * 0.5 + 0.5) +
            liveBias * (config.type === 'live' ? 0.18 : 0)
          region.materials[1].opacity =
            (config.type === 'live' && regionActive ? 0.19 : 0.11) +
            (shimmer * 0.5 + 0.5) * 0.035
        })
        starMaterial.opacity =
          themeRef.current === 'light'
            ? 0.92 + Math.sin(elapsed * 0.72) * 0.04
            : 0.76 + Math.sin(elapsed * 0.72) * 0.04
        nebulaMaterial.opacity =
          themeRef.current === 'light' ? 0.22 + pulse * 0.05 : 0.1 + pulse * 0.05
        const scale = 1 + pulse * 0.022 + distance * 0.015
        nebula.scale.setScalar(scale)
      }

      renderer.render(scene, camera)
    }

    const onVisibilityChange = () => {
      pageVisible = !document.hidden
    }

    const onPointerMove = (event) => {
      if (reduceMotion || event.pointerType === 'touch') return
      pointer.targetX = (event.clientX / window.innerWidth - 0.5) * 2
      pointer.targetY = -(event.clientY / window.innerHeight - 0.5) * 2
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
      materialRef.current = null
      colorRef.current = null
    }
  }, [])

  useEffect(() => {
    const materials = materialRef.current
    const colors = colorRef.current
    if (!materials || !colors) return

    const light = theme === 'light'
    recolorStars(colors.starGeometry, colors.starSeeds, theme, setStarColor)
    recolorStars(colors.nebulaGeometry, colors.nebulaSeeds, theme, setNebulaColor)
    for (const region of sectorRef.current ?? []) {
      recolorStars(
        region.geometries[0],
        region.seeds,
        theme,
        region.type === 'meteor' ? setMeteorRegionColor : setLiveRegionColor,
      )
      region.materials[0].blending = light
        ? THREE.NormalBlending
        : THREE.AdditiveBlending
      region.materials[1].blending = light
        ? THREE.NormalBlending
        : THREE.AdditiveBlending
      region.materials[1].color.set(
        light
          ? region.type === 'meteor'
            ? 0x6f5635
            : 0x536d6e
          : region.type === 'meteor'
            ? 0xded5bf
            : 0x91a9aa,
      )
      region.materials[0].needsUpdate = true
      region.materials[1].needsUpdate = true
    }

    materials.starMaterial.blending = light
      ? THREE.NormalBlending
      : THREE.AdditiveBlending
    materials.nebulaMaterial.blending = light
      ? THREE.NormalBlending
      : THREE.AdditiveBlending
    materials.starMaterial.needsUpdate = true
    materials.nebulaMaterial.needsUpdate = true
    gsap.to(materials.starMaterial, {
      opacity: light ? 0.98 : 0.8,
      duration: 0.7,
      ease: 'power2.out',
    })
    gsap.to(materials.starMaterial, {
      size: light ? 2.15 : window.innerWidth < 700 ? 1.25 : 1.5,
      duration: 0.7,
      ease: 'power2.out',
    })
    gsap.to(materials.nebulaMaterial, {
      opacity: light ? 0.24 : 0.1,
      duration: 0.7,
      ease: 'power2.out',
    })
    gsap.to(materials.nebulaMaterial, {
      size: light ? (window.innerWidth < 700 ? 3.8 : 4.8) : window.innerWidth < 700 ? 3 : 4,
      duration: 0.7,
      ease: 'power2.out',
    })
  }, [theme])

  useEffect(() => {
    if (!sectorRef.current) return

    const releaseDepth = level >= 1
    const light = theme === 'light'
    const activeOpacity = releaseDepth ? (light ? 0.78 : 0.62) : light ? 0.2 : 0.16
    const idleOpacity = releaseDepth ? (light ? 0.2 : 0.12) : light ? 0.12 : 0.08

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
  }, [activeSignal, level, theme])

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
  const count = compact ? 620 : 1100
  const geometry = new THREE.BufferGeometry()
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const color = new THREE.Color()

  for (let index = 0; index < count; index += 1) {
    const i3 = index * 3
    seeds[index] = random()
    if (type === 'meteor') {
      const along = (random() - 0.5) * 720
      const band = gaussian(random, 0, 58)
      const secondaryBand = gaussian(random, 0, 135)
      const river = random() < 0.72 ? band : secondaryBand
      const angle = -0.32
      const wave = Math.sin(along * 0.015) * 24
      positions[i3] = Math.cos(angle) * along - Math.sin(angle) * river
      positions[i3 + 1] = Math.sin(angle) * along + Math.cos(angle) * river + wave
      positions[i3 + 2] = -150 + gaussian(random, 0, 120)

      if (random() < 0.12) {
        positions[i3] += gaussian(random, 0, 170)
        positions[i3 + 1] += gaussian(random, 0, 80)
      }

      setMeteorRegionColor(color, seeds[index], 'dark')
    } else {
      const angle = random() * Math.PI * 2
      const ringBias = 1 - Math.pow(random(), 2.2)
      const radius = 115 + ringBias * 155 + gaussian(random, 0, 18)
      const hollowChance = random()
      const shellRadius = hollowChance < 0.22 ? random() * 78 : radius
      const ripple = Math.sin(angle * 5 + shellRadius * 0.025) * 18
      positions[i3] = Math.cos(angle) * (shellRadius + ripple)
      positions[i3 + 1] =
        Math.sin(angle) * (shellRadius * 0.62 + ripple * 0.35) +
        gaussian(random, 0, 18)
      positions[i3 + 2] = -150 + gaussian(random, 0, 132)

      if (hollowChance < 0.12) {
        positions[i3] *= 0.32
        positions[i3 + 1] *= 0.32
      }

      setLiveRegionColor(color, seeds[index], 'dark')
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

  const anchorCount = type === 'meteor' ? 72 : 82
  const anchorGeometry = new THREE.BufferGeometry()
  const anchorPositions = new Float32Array(anchorCount * 3)
  for (let index = 0; index < anchorCount; index += 1) {
    const i3 = index * 3
    if (type === 'meteor') {
      const along = -320 + (index / (anchorCount - 1)) * 640
      const river = gaussian(random, 0, 32)
      const angle = -0.32
      anchorPositions[i3] = Math.cos(angle) * along - Math.sin(angle) * river
      anchorPositions[i3 + 1] =
        Math.sin(angle) * along +
        Math.cos(angle) * river +
        Math.sin(along * 0.015) * 20
      anchorPositions[i3 + 2] = -150 + gaussian(random, 0, 62)
    } else {
      const angle = (index / anchorCount) * Math.PI * 2
      const radius = 150 + Math.sin(angle * 5) * 20 + gaussian(random, 0, 10)
      anchorPositions[i3] = Math.cos(angle) * radius
      anchorPositions[i3 + 1] = Math.sin(angle) * radius * 0.62
      anchorPositions[i3 + 2] = -150 + gaussian(random, 0, 68)
    }
  }
  anchorGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(anchorPositions, 3),
  )
  const anchorMaterial = new THREE.PointsMaterial({
    size: compact ? 2.2 : type === 'live' ? 2.75 : 2.55,
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
    type,
    seeds,
    materials: [material, anchorMaterial],
    geometries: [geometry, anchorGeometry],
  }
}

function recolorStars(geometry, seeds, theme, colorSetter) {
  const colorAttribute = geometry.getAttribute('color')
  if (!colorAttribute) return

  const color = new THREE.Color()
  for (let index = 0; index < seeds.length; index += 1) {
    colorSetter(color, seeds[index], theme)
    colorAttribute.setXYZ(index, color.r, color.g, color.b)
  }
  colorAttribute.needsUpdate = true
}

function moveStarsRight(positions, speed, halfWidth) {
  for (let index = 0; index < positions.length; index += 3) {
    positions[index] += speed
    if (positions[index] > halfWidth) {
      positions[index] = -halfWidth
    }
  }
}

function gaussian(random, mean, deviation) {
  const u = 1 - random()
  const v = random()
  const standard = Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v)
  return mean + standard * deviation
}

function setStarColor(color, seed, theme) {
  if (theme === 'light') {
    color.setHSL(0.09 + seed * 0.11, 0.42, 0.13 + seed * 0.16)
    return
  }

  color.setHSL(seed * 0.1 + 0.6, 0.2, seed * 0.5 + 0.5)
}

function setNebulaColor(color, seed, theme) {
  if (theme === 'light') {
    color.setHSL(0.5 + seed * 0.08, 0.24, 0.18 + seed * 0.16)
    return
  }

  color.setHSL(0.58 + seed * 0.08, 0.24, 0.56 + seed * 0.18)
}

function setMeteorRegionColor(color, seed, theme) {
  if (theme === 'light') {
    color.setHSL(0.09 + seed * 0.08, 0.48, 0.16 + seed * 0.17)
    return
  }

  color.setHSL(0.12 + seed * 0.06, 0.28, 0.58 + seed * 0.24)
}

function setLiveRegionColor(color, seed, theme) {
  if (theme === 'light') {
    color.setHSL(0.5 + seed * 0.08, 0.32, 0.15 + seed * 0.17)
    return
  }

  color.setHSL(0.52 + seed * 0.08, 0.18, 0.54 + seed * 0.2)
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
