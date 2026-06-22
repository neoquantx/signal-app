"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

/** Light-mode brand colors */
const LIGHT_COLORS = [0x546b41, 0x99ad7a, 0xdcccac, 0x8b9a78, 0x455934]
/** Dark-mode brand colors */
const DARK_COLORS = [0x99ad7a, 0xadc08f, 0x3a4630, 0x4a5a3d, 0x2a331f]

interface ShapeConfig {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  rotationSpeed: THREE.Vector3
}

/**
 * AmbientBackground
 * A lightweight Three.js scene rendered as a fixed, full-viewport backdrop.
 * - 20 softly drifting icosahedrons in brand colors
 * - MeshStandardMaterial with low metalness/roughness — GPU-friendly
 * - Under 100 draw calls
 * - `prefers-reduced-motion`: renders once (static), no animation loop
 * - Reads the current dark mode state from document.documentElement.classList
 */
export default function AmbientBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // ── Reduced-motion guard ──────────────────────────────────
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    // ── Check dark mode ───────────────────────────────────────
    const isDark = document.documentElement.classList.contains("dark")
    const palette = isDark ? DARK_COLORS : LIGHT_COLORS

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,         // transparent background
      powerPreference: "low-power",
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setClearColor(0x000000, 0)
    container.appendChild(renderer.domElement)

    // ── Scene & Camera ────────────────────────────────────────
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    )
    camera.position.z = 40

    // ── Lighting ──────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8)
    scene.add(ambientLight)
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.4)
    dirLight.position.set(1, 2, 3)
    scene.add(dirLight)

    // ── Shared geometry ───────────────────────────────────────
    const geometry = new THREE.IcosahedronGeometry(1, 0)  // low-poly detail=0

    // ── Spawn shapes ──────────────────────────────────────────
    const SHAPE_COUNT = 20
    const shapes: ShapeConfig[] = []

    for (let i = 0; i < SHAPE_COUNT; i++) {
      const color = palette[Math.floor(Math.random() * palette.length)]
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.7,
        metalness: 0.1,
        transparent: true,
        opacity: 0.55,
      })

      const mesh = new THREE.Mesh(geometry, material)
      const scale = 0.8 + Math.random() * 2.4
      mesh.scale.setScalar(scale)

      // Spread shapes across the viewport frustum
      mesh.position.set(
        (Math.random() - 0.5) * 60,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 20
      )
      mesh.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      )

      scene.add(mesh)

      shapes.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.012,
          (Math.random() - 0.5) * 0.008,
          0
        ),
        rotationSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.003,
          (Math.random() - 0.5) * 0.003,
          (Math.random() - 0.5) * 0.002
        ),
      })
    }

    // ── Render once (static) or animate ──────────────────────
    let animationId: number

    if (prefersReduced) {
      // Single static render
      renderer.render(scene, camera)
    } else {
      const BOUNDS_X = 35
      const BOUNDS_Y = 25

      const animate = () => {
        animationId = requestAnimationFrame(animate)

        for (const { mesh, velocity, rotationSpeed } of shapes) {
          mesh.position.x += velocity.x
          mesh.position.y += velocity.y

          mesh.rotation.x += rotationSpeed.x
          mesh.rotation.y += rotationSpeed.y
          mesh.rotation.z += rotationSpeed.z

          // Wrap around bounds
          if (mesh.position.x > BOUNDS_X) mesh.position.x = -BOUNDS_X
          if (mesh.position.x < -BOUNDS_X) mesh.position.x = BOUNDS_X
          if (mesh.position.y > BOUNDS_Y) mesh.position.y = -BOUNDS_Y
          if (mesh.position.y < -BOUNDS_Y) mesh.position.y = BOUNDS_Y
        }

        renderer.render(scene, camera)
      }

      animate()
    }

    // ── Resize observer ───────────────────────────────────────
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      if (prefersReduced) renderer.render(scene, camera)
    })
    resizeObserver.observe(container)

    // ── Dark-mode class observer ──────────────────────────────
    // Re-tint shapes whenever the dark class is toggled on <html>
    const mutationObserver = new MutationObserver(() => {
      const nowDark = document.documentElement.classList.contains("dark")
      const newPalette = nowDark ? DARK_COLORS : LIGHT_COLORS
      shapes.forEach(({ mesh }, i) => {
        const mat = mesh.material as THREE.MeshStandardMaterial
        mat.color.setHex(newPalette[i % newPalette.length])
      })
    })
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    // ── Cleanup ───────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(animationId)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      renderer.dispose()
      geometry.dispose()
      shapes.forEach(({ mesh }) => {
        ;(mesh.material as THREE.MeshStandardMaterial).dispose()
      })
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        opacity: 0.20,
      }}
    />
  )
}
