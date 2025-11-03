import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import '@kitware/vtk.js/Rendering/Profiles/Geometry'
import '@kitware/vtk.js/Rendering/Profiles/Volume'
import VolumeRenderer3D, { type VolumeRenderer3DHandle } from './VolumeRenderer3D'
import SliceViewer2D from './SliceViewer2D'
import { useVtkVolume, type UseVtkVolumeResult } from './useVtkVolume'
import type {
  SliceAxis,
  SliceRange,
  SliceState,
  ViewerMetadata,
  ViewerStructure,
  ViewerVolume,
} from './types'
import './DicomViewer.css'

type DicomViewerProps = {
  caseLabel: string
  volume?: ViewerVolume
  structures: ViewerStructure[]
  metadata?: ViewerMetadata
  onExportStructure?: (structureId: string) => void
  imagingEnabled?: boolean
}

const sliceOrder: SliceAxis[] = ['k', 'j', 'i']
const sliceLabels: Record<SliceAxis, string> = {
  k: 'Axial',
  j: 'Coronal',
  i: 'Sagittal',
}

const mainSliceOrientation: Partial<
  Record<SliceAxis, { viewUp: [number, number, number]; direction: [number, number, number] }>
> = {
  j: { viewUp: [0, 0, 1], direction: [0, -1, 0] },
  i: { viewUp: [0, 0, 1], direction: [1, 0, 0] },
}

const defaultStructureVisibility = (structures: ViewerStructure[]) =>
  structures.reduce<Record<string, boolean>>(
    (acc, structure) => ({ ...acc, [structure.id]: true }),
    {},
  )

const toSliceRange = (extent: UseVtkVolumeResult['extent']): SliceRange => ({
  i: [extent[0], extent[1]],
  j: [extent[2], extent[3]],
  k: [extent[4], extent[5]],
})

const getMidSlice = ([min, max]: [number, number]) =>
  Math.floor((min + max) / 2)

const DicomViewer = ({
  caseLabel,
  volume,
  structures,
  metadata,
  onExportStructure,
  imagingEnabled = true,
}: DicomViewerProps) => {
  const volumeContainerRef = useRef<HTMLDivElement | null>(null)
  const sliceMainRef = useRef<HTMLDivElement | null>(null)
  const volumeRendererRef = useRef<VolumeRenderer3DHandle | null>(null)

  const {
    imageDataRef,
    extent,
    loadingMessage,
    errorMessage,
    hasVolume,
    version,
  } = useVtkVolume(imagingEnabled ? volume : undefined)

  const [visibleStructures, setVisibleStructures] = useState<Record<string, boolean>>(() =>
    defaultStructureVisibility(structures),
  )
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d')
  const [showVolume, setShowVolume] = useState(true)
  const [useLightTheme, setUseLightTheme] = useState(false)
  const [activeSliceAxis, setActiveSliceAxis] = useState<SliceAxis>('k')
  const [sliceRange, setSliceRange] = useState<SliceRange>({
    i: [0, 0],
    j: [0, 0],
    k: [0, 0],
  })
  const [sliceState, setSliceState] = useState<SliceState>({
    i: 0,
    j: 0,
    k: 0,
  })

  useEffect(() => {
    setVisibleStructures((previous) => {
      const baseline = defaultStructureVisibility(structures)
      return structures.reduce<Record<string, boolean>>((acc, structure) => {
        acc[structure.id] =
          previous[structure.id] ?? baseline[structure.id] ?? true
        return acc
      }, {})
    })
  }, [structures])

  useEffect(() => {
    const ranges = toSliceRange(extent)
    setSliceRange(ranges)
    setSliceState({
      i: getMidSlice(ranges.i),
      j: getMidSlice(ranges.j),
      k: getMidSlice(ranges.k),
    })
  }, [extent, version])

  const clampSliceIndex = (axis: SliceAxis, value: number) => {
    const [min, max] = sliceRange[axis]
    if (min === max) {
      return min
    }
    return Math.min(Math.max(value, min), max)
  }

  const handleSliceChange = (axis: SliceAxis, rawValue: number) => {
    const nextValue = clampSliceIndex(axis, rawValue)
    setSliceState((prev) => ({
      ...prev,
      [axis]: nextValue,
    }))
  }

  const toggleStructureVisibility = (structureId: string) => {
    setVisibleStructures((prev) => ({
      ...prev,
      [structureId]: !prev[structureId],
    }))
  }

  const hasSliceExtent = useMemo(
    () =>
      sliceRange.i[0] !== sliceRange.i[1] ||
      sliceRange.j[0] !== sliceRange.j[1] ||
      sliceRange.k[0] !== sliceRange.k[1],
    [sliceRange],
  )

  const ambientLabel = useLightTheme ? 'Use Dark Theme' : 'Use Light Theme'
  const viewToggleLabel = viewMode === '3d' ? 'Switch to 2D View' : 'Switch to 3D View'
  const currentSliceRange = sliceRange[activeSliceAxis]
  const currentSliceValue = clampSliceIndex(activeSliceAxis, sliceState[activeSliceAxis])
  const sliceSliderDisabled =
    !imagingEnabled || !hasVolume || currentSliceRange[0] === currentSliceRange[1]

  const imagingDisabledMessage = imagingEnabled
    ? null
    : 'Imaging disabled in lightweight mode.'

  useEffect(() => {
    if (!imagingEnabled) {
      setViewMode('3d')
    }
  }, [imagingEnabled])

  const slicePanelMessage =
    imagingDisabledMessage ??
    loadingMessage ??
    errorMessage ??
    (!volume?.url ? 'Provide a volume URL and format to visualise data.' : null)

  const stagePanelMessage =
    imagingDisabledMessage ??
    (!volume?.url ? 'Provide a volume URL and format to visualise data.' : null) ??
    (volume?.url && !hasVolume && !loadingMessage && !errorMessage
      ? 'Preparing viewer…'
      : null) ??
    loadingMessage ??
    errorMessage

  const activeMainOrientation = mainSliceOrientation[activeSliceAxis]

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
        <div className="dicom-viewer__viewport">
          <div
            ref={volumeContainerRef}
            className={clsx('dicom-viewer__stage', {
              light: useLightTheme,
              dark: !useLightTheme,
              hidden: viewMode === '2d',
            })}
          >
            {stagePanelMessage && (
              <div
                className={clsx('dicom-viewer__placeholder', {
                  'dicom-viewer__placeholder--error': Boolean(errorMessage),
                })}
              >
                {stagePanelMessage}
              </div>
            )}
          </div>

          <div
            className={clsx('dicom-viewer__slice-panel', {
              hidden: viewMode !== '2d',
            })}
          >
            <div className="dicom-viewer__slice-tabs">
              {sliceOrder.map((axis) => (
                <button
                  key={axis}
                  type="button"
                  className={clsx('dicom-viewer__slice-tab', {
                    active: axis === activeSliceAxis,
                  })}
                  onClick={() => setActiveSliceAxis(axis)}
                >
                  {sliceLabels[axis]}
                </button>
              ))}
            </div>

            {slicePanelMessage ? (
              <div
                className={clsx('dicom-viewer__placeholder', {
                  'dicom-viewer__placeholder--error': Boolean(errorMessage),
                })}
              >
                {slicePanelMessage}
              </div>
            ) : (
              <>
                <div className="dicom-viewer__slice-wrapper">
                  <div ref={sliceMainRef} className="dicom-viewer__slice-canvas" />
                </div>
                <div className="dicom-viewer__slice-sliderRow">
                  <span>{sliceLabels[activeSliceAxis]} slice</span>
                  <input
                    className="dicom-viewer__slice-slider"
                    type="range"
                    min={currentSliceRange[0]}
                    max={currentSliceRange[1]}
                    value={currentSliceValue}
                    onChange={(event) =>
                      handleSliceChange(activeSliceAxis, Number(event.target.value))
                    }
                    disabled={sliceSliderDisabled}
                  />
                  <span className="dicom-viewer__slice-value">
                    {currentSliceValue}
                    {currentSliceRange[1] > currentSliceRange[0]
                      ? ` / ${currentSliceRange[1]}`
                      : ''}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <section className="dicom-viewer__controls">
        <div className="dicom-viewer__control-group">
          <h3>Viewer Controls</h3>
          <div className="dicom-viewer__control-buttons">
            <button
              type="button"
              className="dicom-viewer__primary"
              onClick={() => volumeRendererRef.current?.resetCamera()}
              disabled={!imagingEnabled || !hasVolume}
            >
              Center View
            </button>
            <button
              type="button"
              className="dicom-viewer__secondary"
              onClick={() => setViewMode((prev) => (prev === '3d' ? '2d' : '3d'))}
              disabled={!imagingEnabled || !hasVolume || !hasSliceExtent}
            >
              {viewToggleLabel}
            </button>
            <button
              type="button"
              className="dicom-viewer__secondary"
              onClick={() => setShowVolume((prev) => !prev)}
              disabled={!imagingEnabled || !hasVolume}
            >
              {showVolume ? 'Hide Volume' : 'Show Volume'}
            </button>
            <button
              type="button"
              className="dicom-viewer__secondary"
              onClick={() => setUseLightTheme((prev) => !prev)}
            >
              {ambientLabel}
            </button>
          </div>
        </div>

        <div className="dicom-viewer__control-group">
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
                    onChange={() => toggleStructureVisibility(structure.id)}
                    disabled={!imagingEnabled}
                  />
                  <span>{structure.name}</span>
                </label>
                <button
                  type="button"
                  onClick={() => onExportStructure?.(structure.id)}
                  disabled={!imagingEnabled || !structure.meshUrl}
                >
                  Export
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {imagingEnabled && viewMode === '3d' && (
        <VolumeRenderer3D
          ref={volumeRendererRef}
          containerRef={volumeContainerRef}
          imageDataRef={imageDataRef}
          version={version}
          structures={structures}
          visibleStructures={visibleStructures}
          showVolume={showVolume}
          useLightTheme={useLightTheme}
        />
      )}
      {imagingEnabled && viewMode === '2d' && (
        <SliceViewer2D
          containerRef={sliceMainRef}
          imageDataRef={imageDataRef}
          axis={activeSliceAxis}
          slice={currentSliceValue}
          version={version}
          viewUp={activeMainOrientation?.viewUp}
          direction={activeMainOrientation?.direction}
        />
      )}
    </div>
  )
}

export default DicomViewer
