import { useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, StatsGl } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import clsx from 'clsx'
import './DicomViewer.css'

export type ViewerStructure = {
  id: string
  name: string
  color: string
  placeholder?: 'organ' | 'vessel' | 'lesion'
}

export type ViewerMetadata = {
  voxels?: string
  spacing?: string
  notes?: string
}

type DicomViewerProps = {
  caseLabel: string
  structures: ViewerStructure[]
  metadata?: ViewerMetadata
  onExportStructure?: (structureId: string) => void
}

type PlaceholderKind = 'organ' | 'vessel' | 'lesion'

type PlaceholderConfig = {
  geometry: 'ellipsoid' | 'torusKnot' | 'dodecahedron'
  scale: [number, number, number]
  position: [number, number, number]
}

const placeholderConfig: Record<PlaceholderKind, PlaceholderConfig> = {
  organ: {
    geometry: 'ellipsoid',
    scale: [2.2, 1.6, 1.8],
    position: [0, -0.2, 0],
  },
  vessel: {
    geometry: 'torusKnot',
    scale: [0.8, 0.8, 0.8],
    position: [0, 0.6, 0],
  },
  lesion: {
    geometry: 'dodecahedron',
    scale: [0.6, 0.6, 0.6],
    position: [0.6, 0.4, 0.2],
  },
}

type StructureMeshProps = {
  visible: boolean
  color: string
  placeholder: PlaceholderKind
}

const StructureMesh = ({
  visible,
  color,
  placeholder,
}: StructureMeshProps) => {
  const { geometry, scale, position } = placeholderConfig[placeholder]

  switch (geometry) {
    case 'torusKnot':
      return (
        <mesh visible={visible} scale={scale} position={position}>
          <torusKnotGeometry args={[0.7, 0.2, 100, 12]} />
          <meshStandardMaterial color={color} metalness={0.35} roughness={0.4} />
        </mesh>
      )
    case 'dodecahedron':
      return (
        <mesh visible={visible} scale={scale} position={position}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={color} metalness={0.25} roughness={0.45} />
        </mesh>
      )
    case 'ellipsoid':
    default:
      return (
        <mesh visible={visible} scale={scale} position={position}>
          <sphereGeometry args={[1.2, 48, 48]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.85}
            roughness={0.6}
            metalness={0.1}
          />
        </mesh>
      )
  }
}

const DicomViewer = ({
  caseLabel,
  structures,
  metadata,
  onExportStructure,
}: DicomViewerProps) => {
  const [visibleStructures, setVisibleStructures] = useState<Record<string, boolean>>(
    () =>
      structures.reduce(
        (acc, structure) => ({ ...acc, [structure.id]: true }),
        {},
      ),
  )
  const [showVolume, setShowVolume] = useState(true)
  const [useLightTheme, setUseLightTheme] = useState(false)

  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  const ambientColor = useLightTheme ? '#f8b195' : '#355c7d'
  const backgroundClass = useLightTheme
    ? 'dicom-viewer__stage light'
    : 'dicom-viewer__stage dark'

  const toggleStructure = (structureId: string) => {
    setVisibleStructures((prev) => {
      const next = { ...prev, [structureId]: !prev[structureId] }
      return next
    })
  }

  const resetCamera = () => {
    controlsRef.current?.reset()
  }

  return (
    <div className="dicom-viewer">
      <header className="dicom-viewer__header">
        <div>
          <p className="dicom-viewer__subtitle">Currently viewing</p>
          <h2>{caseLabel}</h2>
        </div>
        <div className="dicom-viewer__meta">
          {metadata?.voxels && (
            <span>
              Voxels: <strong>{metadata.voxels}</strong>
            </span>
          )}
          {metadata?.spacing && (
            <span>
              Spacing: <strong>{metadata.spacing}</strong>
            </span>
          )}
        </div>
      </header>

      <div className="dicom-viewer__content">
        <aside className="dicom-viewer__panel dicom-viewer__panel--left">
          <section>
            <h3>Viewer Controls</h3>
            <button
              type="button"
              className="dicom-viewer__primary"
              onClick={resetCamera}
            >
              Center View
            </button>
            <button
              type="button"
              className="dicom-viewer__secondary"
              onClick={() => setShowVolume((prev) => !prev)}
            >
              {showVolume ? 'Hide Volume' : 'Show Volume'}
            </button>
            <button
              type="button"
              className="dicom-viewer__secondary"
              onClick={() => setUseLightTheme((prev) => !prev)}
            >
              {useLightTheme ? 'Use Dark Theme' : 'Use Light Theme'}
            </button>
          </section>

          <section>
            <div className="dicom-viewer__section-title">
              <h3>Structures</h3>
              <span className="dicom-viewer__hint">Toggle visibility</span>
            </div>
            <ul className="dicom-viewer__structure-list">
              {structures.map((structure) => (
                <li key={structure.id}>
                  <label>
                    <span
                      className="dicom-viewer__structure-swatch"
                      style={{ backgroundColor: structure.color }}
                    />
                    <input
                      type="checkbox"
                      checked={visibleStructures[structure.id]}
                      onChange={() => toggleStructure(structure.id)}
                    />
                    <span>{structure.name}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => onExportStructure?.(structure.id)}
                  >
                    Export
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </aside>

        <div className={clsx(backgroundClass, { hidden: !showVolume })}>
          <Canvas camera={{ position: [5, 3, 6], fov: 50 }}>
            <color
              attach="background"
              args={[useLightTheme ? '#fef9f6' : '#121826']}
            />
            <ambientLight intensity={useLightTheme ? 0.3 : 0.5} color={ambientColor} />
            <directionalLight
              position={[2, 4, 4]}
              intensity={useLightTheme ? 0.7 : 1}
              color="#ffffff"
            />
            <pointLight position={[-4, -3, -4]} intensity={0.4} color="#ffffff" />

            <group rotation={[0, Math.PI / 6, 0]}>
              <mesh visible={showVolume}>
                <sphereGeometry args={[2.5, 32, 32]} />
                <meshBasicMaterial
                  color={useLightTheme ? '#dfe9f3' : '#1e293b'}
                  transparent
                  opacity={useLightTheme ? 0.3 : 0.25}
                  wireframe
                />
              </mesh>

              {structures.map((structure) => (
                <StructureMesh
                  key={structure.id}
                  visible={!!visibleStructures[structure.id]}
                  color={structure.color}
                  placeholder={structure.placeholder ?? 'organ'}
                />
              ))}
            </group>

            <OrbitControls
              ref={controlsRef}
              enableDamping
              dampingFactor={0.08}
              minDistance={2}
              maxDistance={20}
            />
            <StatsGl className="dicom-viewer__stats" />
          </Canvas>
        </div>

        {metadata?.notes && (
          <aside className="dicom-viewer__notes">
            <h3>Notes</h3>
            <p>{metadata.notes}</p>
          </aside>
        )}
      </div>
    </div>
  )
}

export default DicomViewer
