---
trigger: always_on
---

# R3F Decoration Architecture Rules

Single source of truth for all Three.js decoration components built with
**@react-three/fiber** (R3F) and **@react-three/drei**. Covers bunting, clouds,
sky, and any future type. Read before touching anything under
`src/components/decorations/`.

---

## Quick Start — Adding a New Decoration Type

1. Copy `shared/_template-scene.tsx` to `<type>/<type>-scene.tsx`.
2. Create `<type>/constants/index.ts` with `CAMERA_Z` and `FOV_DEG`.
3. Build your geometry in `<type>/geometry/<item>.ts` (pure Three.js, no R3F).
4. Add placement/spawn logic in `<type>/placement/` and animation in `<type>/animation/`.
5. Wire everything together in `<type>-scene.tsx`: spawn in `useEffect`, animate in `useFrame`, render via `<primitive>`.
6. Export from `decorations/index.ts` (two lines: default export + props type).

---

## Mental Model

Every decoration answers the same four questions:

```
"Where does it live?"   →  Layout
"What does it look like?" →  Geometry + Materials
"How does it move?"     →  Physics → Animation
"How does React own it?" →  Scene Component
```

Layers only talk **downward**. A higher layer calls a lower one, never the reverse.

```
Scene Component  (React, <Canvas>, useFrame)
      │
      ▼
   Layout        (world-space positions — no THREE objects)
      │
      ▼
 Placement/Spawn (builds THREE groups, calls Geometry + Materials)
    │       │
    ▼       ▼
Geometry  Materials  (pure mesh / material factories)
              │
              ▼
        Physics/Math  (pure functions — no THREE mutation)
              │
              ▼
          Animation   (per-frame mutation only)
```

---

## R3F vs Imperative Three.js — Key Differences

| Concept            | Imperative (old)                                     | R3F Declarative (current)                                  |
| ------------------ | ---------------------------------------------------- | ---------------------------------------------------------- |
| **Renderer**       | `new THREE.WebGLRenderer()` in `useEffect`           | `<Canvas gl={…}>` handles creation/disposal automatically  |
| **Scene / Camera** | `new THREE.Scene()`, `new THREE.PerspectiveCamera()` | `<Canvas camera={…}>` — scene is implicit                  |
| **Lights**         | `scene.add(new THREE.AmbientLight(…))`               | `<ambientLight />`, `<directionalLight />`                 |
| **Render loop**    | `requestAnimationFrame` + manual `renderer.render()` | Automatic — R3F renders every frame                        |
| **Per-frame work** | Inside RAF callback                                  | `useFrame((state, delta) => { … })`                        |
| **Resize**         | Manual `resize` listener + `renderer.setSize()`      | Automatic — R3F adapts to parent container                 |
| **DPR**            | `renderer.setPixelRatio(Math.min(dpr, N))`           | `<Canvas dpr={[1, 2]}>` or `dpr` prop                      |
| **Cleanup**        | `cancelAnimationFrame`, `renderer.dispose()`, manual | Automatic — React unmount handles everything               |
| **Adding objects** | `scene.add(group)` in imperative code                | `<primitive object={group} />` or R3F JSX elements         |
| **Refs to scene**  | N/A                                                  | `useThree()` for `scene`, `camera`, `gl`, `viewport`, etc. |

### What does NOT change

The **lower layers** (Geometry, Materials, Physics, Animation, Placement, Layout)
remain pure imperative Three.js factories and functions. They do not import R3F
or Drei. They continue to build `THREE.Group`, `THREE.Mesh`, etc. The scene
component wraps their output with `<primitive object={…} />`.

---

## Folder Structure

```
src/components/decorations/
  shared/                     Shared R3F infrastructure
    decoration-canvas.tsx     Canvas wrapper (DPR, camera, GL, lights slot)
    decoration-lights.tsx     Default lighting rig
    _template-scene.tsx       Copy-paste starter for new decoration types
  <type>/                     e.g. rope/, cloud/, sky/, firework/
    constants/index.ts        CAMERA_Z, FOV_DEG, colours, sizes
    types.ts                  shared interfaces for this decoration
    geometry/<item>.ts        mesh factories (one file per item type)
    materials/<item>.ts       (optional — complex materials only)
    physics/<n>.ts            (optional — non-trivial math only)
    animation/<n>.ts          per-frame updaters (one concern per file)
    layout/index.ts           world-space config, no THREE objects
    placement/                (optional — for distributed item types)
      slot-assign.ts          pure slot logic, no THREE imports
      build-<type>.ts         THREE group assembly
    <type>-scene.tsx          React R3F orchestrator
  utils/
    three.ts                  shared THREE helpers (cylMesh, v3, deg, …)
    math.ts                   frustumHalfH and other viewport math
  index.ts                    public re-exports only
```

---

## Layer Rules

### Geometry

- Returns a `THREE.Group` — **never calls `scene.add()`**.
- Origin `(0,0,0)` = natural anchor point (rope attachment, base, centre).
- Build at unit/canonical scale; apply caller scale last via `group.scale.setScalar(scale)`.
- No `time`, no layout math, no animation. Pure factory — same args → same mesh.
- `thicknessScale` is the only scale that may affect internal proportions.
- **No R3F or Drei imports.** Geometry is pure Three.js.

### Materials _(optional)_

- Pure factory functions: same inputs → same material. No geometry, no scene refs.
- Only create a `materials/` folder when logic is non-trivial (e.g. sky-reactive cloud colour).
- Shared helpers (`makePlainTexture`, `makeUVTriangle`) live in `utils/three.ts`.
- **No R3F or Drei imports.** Materials are pure Three.js.

### Physics / Math _(optional)_

- Stateless, deterministic pure functions. No internal state, no side effects.
- May use `THREE.Vector3` for math but always return a **new** vector.
- No imports from any other decoration layer.
- Keep inline in Animation if trivial. Extract to `physics/` only when complex enough to test independently (e.g. catenary, wave superposition).
- **No R3F or Drei imports.**

### Animation

- Called once per frame via `useFrame`. Mutates transforms and buffer attributes. **Never creates geometry.**
- Split per concern: e.g. `rope-anim.ts`, `flag-anim.ts`, `item-anim.ts`.
- Calls Physics/Math for calculations — never re-implements that math inline.
- Behaviour flags (`windAnimation`, `bobAmp`) are stored on the data struct at spawn time. Animation functions do not read React props.
- **No R3F or Drei imports.** Animation functions receive `time`/`delta` as plain arguments — they don't call `useFrame` themselves.

### Layout

- Returns typed plain-data config (e.g. `RopeSegmentConfig[]`) — no THREE objects.
- All frustum math (`halfH`, `halfW`) lives here. Never duplicated in the scene component.
- Imports `CAMERA_Z` and `FOV_DEG` from `constants/index.ts`. Never hardcodes them.

### Placement / Spawn

- Decides where items appear; calls Geometry to build groups.
- All randomness (slot picking, scatter) lives here — not in Geometry or Animation.
- Spacing/clearance rules between item types enforced here.
- Returns built objects (groups, data structs). Does **not** call `scene.add()`.
- The scene component is responsible for adding objects to the R3F scene via `<primitive>`.

### Scene Component (R3F Orchestrator)

One file per decoration: `<type>-scene.tsx`. **Scene files and `shared/decoration-canvas.tsx` are the only files permitted to import R3F/Drei. All other layers (geometry, materials, physics, animation, layout, placement) must remain free of R3F/Drei imports.**

#### Structure

A scene component is split into two parts:

1. **Outer wrapper** — renders the R3F `<Canvas>` with camera, GL, and DPR config.
2. **Inner content component** — a child of `<Canvas>` that uses R3F hooks.

```tsx
// ── Inner component (lives inside <Canvas>) ───────────────────────
function RopeContent(props: RopeContentProps) {
  const groupRef = useRef<THREE.Group>(null)
  const { viewport, camera } = useThree()
  const [rowData, setRowData] = useState<RowData | null>(null)

  useEffect(
    () => {
      // 1. Layout → config data (uses viewport dimensions)
      // 2. Placement/Spawn → data structs (returns THREE groups)
      // 3. Store in state/ref for useFrame access
      return () => {
        /* dispose if needed */
      }
    },
    [/* props that require full rebuild */],
  )

  useFrame((state) => {
    if (rowData) updateRow(rowData, state.clock.elapsedTime)
  })

  return rowData ? <primitive ref={groupRef} object={rowData.group} /> : null
}

// ── Outer wrapper (public API) ────────────────────────────────────
export default function RopeScene(props: RopeSceneProps) {
  return (
    <Canvas
      camera={{ fov: FOV_DEG, position: [0, 0.5, CAMERA_Z], near: 0.1, far: 120 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      dpr={[1, 2]}
      style={{ width: props.width, height: props.height }}
      className={props.className}
    >
      <ambientLight intensity={1.0} />
      <directionalLight position={[4, 8, 6]} intensity={0.8} color="#fff8e0" />
      <RopeContent {...relevantProps} />
    </Canvas>
  )
}
```

#### Key rules for Scene Components

- **No manual `WebGLRenderer`, `Scene`, or `Camera` creation.** Use `<Canvas>` props.
- **No `requestAnimationFrame`.** Use `useFrame()`.
- **No manual resize handling.** R3F handles container resize automatically.
- **No manual cleanup of renderer/canvas.** React unmount handles it.
- **No physics math or mesh construction inside the scene component.** Delegate to lower layers.
- **Use `<primitive object={…} />` to render imperatively-built THREE groups.**
- **Lights are declared as R3F JSX** inside `<Canvas>`: `<ambientLight>`, `<directionalLight>`, etc.
- **Camera config goes on `<Canvas camera={…}>`**, not via manual `new PerspectiveCamera()`.
- **`useThree()`** to read viewport/camera state inside the inner component.
- **Props only read inside `useFrame` do not go in `useEffect` dependency arrays.**
- **DPR is set via `<Canvas dpr={[1, 2]}>`.**

---

## Shared Utilities

| File             | Key exports                                                              |
| ---------------- | ------------------------------------------------------------------------ |
| `utils/three.ts` | `v3`, `deg`, `cylMesh`, `makePlainTexture`, `makeUVTriangle`, `hexColor` |
| `utils/math.ts`  | `frustumHalfH(cameraZ, fovDeg)`                                          |

- `cylMesh` — only way to draw a string, wire, or rod. Never inline `CylinderGeometry`.
- `frustumHalfH` — single source of truth for frustum size. Never rewrite the formula inline.
- **No R3F or Drei imports in utility files.**

---

## Constants

Each decoration type has its own `constants/index.ts`. Two types never share one.

Every decoration **must** define:

| Constant   | Purpose                                                 |
| ---------- | ------------------------------------------------------- |
| `CAMERA_Z` | Camera Z position (used in `<Canvas camera={…}>`)       |
| `FOV_DEG`  | Vertical FOV in degrees (used in `<Canvas camera={…}>`) |

---

## Public API

`src/components/decorations/index.ts` — the only file outside the folder imports from.

Adding a new decoration = two lines:

```ts
export { default as MyScene } from "./my-decoration/my-scene"
export type { MySceneProps } from "./my-decoration/my-scene"
```

---

## `index.ts` Files — Where They Are Allowed

| File                        | Purpose                                                             |
| --------------------------- | ------------------------------------------------------------------- |
| `decorations/index.ts`      | Public API — scene components and prop types only                   |
| `utils/index.ts`            | Collects `three.ts` and `math.ts` for outside consumers             |
| `<type>/constants/index.ts` | Single constants file — `index.ts` is the file itself, not a barrel |

**Never create `index.ts` inside:**
`geometry/`, `materials/`, `physics/`, `animation/`, `placement/`

---

## Antigravity Agent Rules

### Before writing any code, read:

1. This file.
2. `<type>/constants/index.ts` and `<type>/types.ts`.
3. `utils/three.ts` and `utils/math.ts`.
4. The existing scene component for the target decoration.

### Declare the layer before writing any function:

```ts
// LAYER: Geometry — pure factory, no scene mutation, no time, no R3F
// LAYER: Animation — per-frame mutation only, reads Physics, no R3F
// LAYER: Scene — R3F orchestrator, <Canvas> + useFrame + <primitive>
```

### Never:

- `new THREE.WebGLRenderer()` or `new THREE.Scene()` — use `<Canvas>`.
- `requestAnimationFrame` or manual render loops — use `useFrame()`.
- `scene.add()` inside Geometry, Materials, or Physics.
- Import `@react-three/fiber` or `@react-three/drei` in Geometry, Materials, Physics, Animation, Placement, Layout, or Utils.
- Duplicate `frustumHalfH` — import from `utils/math.ts`.
- Hardcode `CAMERA_Z` or `FOV_DEG` as raw numbers outside `constants/index.ts`.
- Read React props inside `useFrame` — store on the data struct at spawn time.

---

## Quick Reference

| Need to...                      | Layer           | Location                                |
| ------------------------------- | --------------- | --------------------------------------- |
| Set up renderer, camera, lights | Scene Component | `<Canvas>` props + JSX lights           |
| Per-frame animation loop        | Scene Component | `useFrame()` in inner content component |
| Read viewport/camera            | Scene Component | `useThree()` in inner content component |
| Render imperative THREE groups  | Scene Component | `<primitive object={group} />`          |
| Compute frustum size            | Utils           | `utils/math.ts` → `frustumHalfH`        |
| Build a mesh                    | Geometry        | `geometry/<item>.ts`                    |
| Per-frame mutation              | Animation       | `animation/<n>.ts`                      |
| Draw a wire or string           | Utils           | `utils/three.ts` → `cylMesh`            |
