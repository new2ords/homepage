import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import * as THREE from 'three'
import { mulberry32 } from '../lib/random'

const CAMERA_DEPTHS = [1000, 500, -500]

export default function Starfield({ level, paused = false }) {
  const containerRef = useRef(null)
  const cameraRef = useRef(null)
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
    scene.add(stars)

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
    scene.add(nebula)

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
      renderer.dispose()
      renderer.domElement.remove()
      cameraRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!cameraRef.current) return
    gsap.to(cameraRef.current.position, {
      z: CAMERA_DEPTHS[level],
      duration: 1.5,
      ease: 'expo.inOut',
    })
  }, [level])

  return <div className="starfield" ref={containerRef} aria-hidden="true" />
}
