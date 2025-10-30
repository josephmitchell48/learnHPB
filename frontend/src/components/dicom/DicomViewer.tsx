import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import clsx from 'clsx'
import '@kitware/vtk.js/Rendering/Profiles/Geometry'
import '@kitware/vtk.js/Rendering/Profiles/Volume'
import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow'
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume'
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper'
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction'
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction'
import vtkXMLImageDataReader from '@kitware/vtk.js/IO/XML/XMLImageDataReader'
import vtkXMLPolyDataReader from '@kitware/vtk.js/IO/XML/XMLPolyDataReader'
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor'
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper'
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper'
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice'
import vtkInteractorStyleImage from '@kitware/vtk.js/Interaction/Style/InteractorStyleImage'
import './DicomViewer.css'

export type ViewerStructure = {
  id: string
  name: string
  color: string
  meshUrl?: string
}

export type ViewerMetadata = {
  voxels?: string
  spacing?: string
  notes?: string
}

export type ViewerVolume = {
  url: string
  format?: 'vti'
}

type DicomViewerProps = {
  caseLabel: string
  volume?: ViewerVolume
  structures: ViewerStructure[]
  metadata?: ViewerMetadata
  onExportStructure?: (structureId: string) => void
}

type SliceAxis = 'i' | 'j' | 'k'

type VolumePipeline = {
  generic: vtkGenericRenderWindow
  renderer: ReturnType<vtkGenericRenderWindow['getRenderer']>
  renderWindow: ReturnType<vtkGenericRenderWindow['getRenderWindow']>
  mapper: vtkVolumeMapper
  volume: vtkVolume
}

type SlicePipeline = {
  generic: vtkGenericRenderWindow
  mapper: vtkImageMapper
  actor: vtkImageSlice
}

const sliceOrder: SliceAxis[] = ['k', 'j', 'i']
const sliceLabels: Record<SliceAxis, string> = {
  k: 'Axial',
  j: 'Coronal',
  i: 'Sagittal',
}
const sliceModes: Record<SliceAxis, number> = {
  i: vtkImageMapper.SlicingMode.I,
  j: vtkImageMapper.SlicingMode.J,
  k: vtkImageMapper.SlicingMode.K,
}

const defaultStructureVisibility = (structures: ViewerStructure[]) =>
  structures.reduce<Record<string, boolean>>(
    (acc, structure) => ({ ...acc, [structure.id]: true }),
    {},
  )

const toRgb = (hex: string): [number, number, number] => {
  const value = hex.trim().replace('#', '')
  if (value.length !== 6) {
    return [1, 1, 1]
  }
  const bigint = parseInt(value, 16)
  const r = ((bigint >> 16) & 255) / 255
  const g = ((bigint >> 8) & 255) / 255
  const b = (bigint & 255) / 255
  return [r, g, b]
}

const createVolumeColorTransferFunction = () => {
  const ctfun = vtkColorTransferFunction.newInstance()
  ctfun.addRGBPoint(-3024, 0, 0, 0)
  ctfun.addRGBPoint(-77, 0.55, 0.25, 0.15)
  ctfun.addRGBPoint(94, 0.88, 0.6, 0.29)
  ctfun.addRGBPoint(179, 1.0, 0.94, 0.95)
  ctfun.addRGBPoint(260, 0.62, 0, 0)
  ctfun.addRGBPoint(3071, 0.8, 0.8, 0.8)
  return ctfun
}

const createVolumeOpacityFunction = () => {
  const ofun = vtkPiecewiseFunction.newInstance()
  ofun.addPoint(-3024, 0)
  ofun.addPoint(-77, 0)
  ofun.addPoint(94, 0.29)
  ofun.addPoint(179, 0.55)
  ofun.addPoint(260, 0.84)
  ofun.addPoint(3071, 0.875)
  return ofun
}

const DicomViewer = ({
  caseLabel,
  volume,
  structures,
  metadata,
  onExportStructure,
}: DicomViewerProps) => {
  const volumeContainerRef = useRef<HTMLDivElement | null>(null)
  const sliceContainerRef = useRef<HTMLDivElement | null>(null)

  const volumePipelineRef = useRef<VolumePipeline | null>(null)
  const slicePipelineRef = useRef<SlicePipeline | null>(null)
  const imageDataRef = useRef<any>(null)
  const structureActorsRef = useRef<Record<string, vtkActor>>({})

  const [visibleStructures, setVisibleStructures] = useState<Record<string, boolean>>(
    () => defaultStructureVisibility(structures),
  )
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d')
  const [showVolume, setShowVolume] = useState(true)
  const [useLightTheme, setUseLightTheme] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sliceState, setSliceState] = useState<Record<SliceAxis, number>>({
    i: 0,
    j: 0,
    k: 0,
  })
  const [sliceRange, setSliceRange] = useState<Record<SliceAxis, [number, number]>>({
    i: [0, 0],
    j: [0, 0],
    k: [0, 0],
  })
  const [activeSliceAxis, setActiveSliceAxis] = useState<SliceAxis>('k')

  const axisRefs: Record<SliceAxis, MutableRefObject<HTMLDivElement | null>> = {
    i: sliceContainerRef,
    j: sliceContainerRef,
    k: sliceContainerRef,
  }

  // volume render pipeline
  useEffect(() => {
    if (!volumeContainerRef.current) {
      return
    }

    const generic = vtkGenericRenderWindow.newInstance({
      background: useLightTheme ? [0.98, 0.97, 0.96] : [0.07, 0.09, 0.12],
    })
    generic.setContainer(volumeContainerRef.current)
    generic.resize()

    const mapper = vtkVolumeMapper.newInstance()
    mapper.setSampleDistance(0.7)

    const volumeActor = vtkVolume.newInstance()
    volumeActor.setMapper(mapper)
    volumeActor.getProperty().setRGBTransferFunction(0, createVolumeColorTransferFunction())
    volumeActor.getProperty().setScalarOpacity(0, createVolumeOpacityFunction())
    volumeActor.getProperty().setInterpolationTypeToLinear()
    volumeActor.getProperty().setShade(true)
    volumeActor.getProperty().setUseGradientOpacity(0, true)
    volumeActor.getProperty().setGradientOpacityMinimumValue(0, 2)
    volumeActor.getProperty().setGradientOpacityMaximumValue(0, 20)

    const renderer = generic.getRenderer()
    renderer.addVolume(volumeActor)
    renderer.getActiveCamera().setParallelProjection(false)

    volumePipelineRef.current = {
      generic,
      renderer,
      renderWindow: generic.getRenderWindow(),
      mapper,
      volume: volumeActor,
    }

    return () => {
      structureActorsRef.current = {}
      generic.delete()
      volumePipelineRef.current = null
    }
  }, [useLightTheme])

  // 2D slice pipeline
  useEffect(() => {
    if (!sliceContainerRef.current) {
      return
    }

    const generic = vtkGenericRenderWindow.newInstance({
      background: [0.07, 0.09, 0.12],
    })
    generic.setContainer(sliceContainerRef.current)
    generic.resize()

    const mapper = vtkImageMapper.newInstance()
    mapper.setSliceAtFocalPoint(false)
    mapper.setSlicingMode(sliceModes[activeSliceAxis])

    const actor = vtkImageSlice.newInstance()
    actor.setMapper(mapper)
    actor.getProperty().setColorWindow(1500)
    actor.getProperty().setColorLevel(-500)

    const renderer = generic.getRenderer()
    renderer.addViewProp(actor)
    const interactor = generic.getInteractor()
    interactor.setInteractorStyle(vtkInteractorStyleImage.newInstance())

    slicePipelineRef.current = { generic, mapper, actor }

    return () => {
      generic.delete()
      slicePipelineRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // load volume data
  const volumeLoader = useMemo(() => {
    if (!volume?.url) {
      return null
    }
    return { format: volume.format, url: volume.url }
  }, [volume])

  useEffect(() => {
    let canceled = false

    const cleanupStructures = () => {
      const volumePipeline = volumePipelineRef.current
      if (!volumePipeline) {
        return
      }
      Object.values(structureActorsRef.current).forEach((actor) => {
        volumePipeline.renderer.removeActor(actor)
        actor.delete()
      })
      structureActorsRef.current = {}
      volumePipeline.renderWindow.render()
    }

    const loadVolumeData = async () => {
      if (!volumeLoader || !volumePipelineRef.current) {
        imageDataRef.current = null
        setLoadingMessage(null)
        setErrorMessage(volume?.url ? 'Viewer not initialised' : null)
        cleanupStructures()
        return
      }

      try {
        setLoadingMessage('Loading volume data…')
        setErrorMessage(null)

        const response = await fetch(volumeLoader.url, { cache: 'force-cache' })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        if (canceled) {
          return
        }

        if (volumeLoader.format && volumeLoader.format !== 'vti') {
          throw new Error(
            `Unsupported volume format "${volumeLoader.format}". Please supply a .vti image.`,
          )
        }

        const imageReader = vtkXMLImageDataReader.newInstance()
        imageReader.parseAsArrayBuffer(arrayBuffer)
        const imageData = imageReader.getOutputData(0)
        imageDataRef.current = imageData

        const volumePipeline = volumePipelineRef.current
        if (!volumePipeline) {
          return
        }
        volumePipeline.mapper.setInputData(imageData)
        volumePipeline.renderWindow.render()
        volumePipeline.renderer.resetCamera()
        volumePipeline.renderWindow.render()

        const extent = imageData.getExtent()
        const ranges: Record<SliceAxis, [number, number]> = {
          i: [extent[0], extent[1]],
          j: [extent[2], extent[3]],
          k: [extent[4], extent[5]],
        }
        const initialSlices: Record<SliceAxis, number> = {
          i: Math.floor((ranges.i[0] + ranges.i[1]) / 2),
          j: Math.floor((ranges.j[0] + ranges.j[1]) / 2),
          k: Math.floor((ranges.k[0] + ranges.k[1]) / 2),
        }
        setSliceRange(ranges)
        setSliceState(initialSlices)

        // ensure slice pipeline shows data immediately
        renderSlice(activeSliceAxis, initialSlices[activeSliceAxis], true, ranges)

        cleanupStructures()
        setLoadingMessage(null)
      } catch (error) {
        if (!canceled) {
          console.error('Failed to load medical volume', error)
          setErrorMessage(
            'Unable to load the imaging volume. Please verify the file URL and format.',
          )
          setLoadingMessage(null)
          imageDataRef.current = null
          cleanupStructures()
        }
      }
    }

    loadVolumeData()

    return () => {
      canceled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volumeLoader?.url])

  // update structure actors in 3d
  useEffect(() => {
    const pipeline = volumePipelineRef.current
    if (!pipeline || !imageDataRef.current) {
      return
    }

    const renderer = pipeline.renderer
    const renderWindow = pipeline.renderWindow
    const actors = structureActorsRef.current

    const activeIds = new Set(structures.map((structure) => structure.id))

    Object.entries(actors).forEach(([id, actor]) => {
      if (!activeIds.has(id)) {
        renderer.removeActor(actor)
        actor.delete()
        delete actors[id]
      }
    })

    structures.forEach((structure) => {
      if (!structure.meshUrl || actors[structure.id]) {
        return
      }
      const reader = vtkXMLPolyDataReader.newInstance()
      fetch(structure.meshUrl, { cache: 'force-cache' })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
          return response.arrayBuffer()
        })
        .then((buffer) => {
          reader.parseAsArrayBuffer(buffer)
          const polyData = reader.getOutputData(0)
          const mapper = vtkMapper.newInstance()
          mapper.setInputData(polyData)
          const actor = vtkActor.newInstance()
          actor.setMapper(mapper)
          actor.getProperty().setColor(...toRgb(structure.color))
          actor.getProperty().setOpacity(0.92)
          renderer.addActor(actor)
          actor.setVisibility(visibleStructures[structure.id] ?? true)
          actors[structure.id] = actor
          renderWindow.render()
        })
        .catch((error) => {
          console.error(`Failed to load structure ${structure.name}`, error)
        })
    })

    renderWindow.render()
  }, [structures, visibleStructures, useLightTheme])

  // visibility toggle for volume
  useEffect(() => {
    const volumePipeline = volumePipelineRef.current
    if (!volumePipeline) {
      return
    }
    volumePipeline.volume.setVisibility(showVolume)
    volumePipeline.renderWindow.render()
  }, [showVolume])

  // resize on view mode change
  useEffect(() => {
    if (viewMode === '3d') {
      const volumePipeline = volumePipelineRef.current
      if (volumePipeline) {
        volumePipeline.generic.resize()
        volumePipeline.renderWindow.render()
      }
    } else {
      const slicePipeline = slicePipelineRef.current
      if (slicePipeline) {
        slicePipeline.generic.resize()
        slicePipeline.generic.getRenderWindow().render()
      }
    }
  }, [viewMode])

  // ensure slice pipeline renders when axis changes or data available
  useEffect(() => {
    if (!imageDataRef.current) {
      return
    }
    const slicePipeline = slicePipelineRef.current
    if (!slicePipeline) {
      return
    }
    slicePipeline.mapper.setInputData(imageDataRef.current)
    slicePipeline.mapper.setSlicingMode(sliceModes[activeSliceAxis])
    slicePipeline.mapper.setSlice(clampSliceIndex(activeSliceAxis, sliceState[activeSliceAxis]))
    slicePipeline.generic.getRenderer().resetCamera()
    slicePipeline.generic.getRenderWindow().render()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSliceAxis])

  const clampSliceIndex = (
    axis: SliceAxis,
    value: number,
    rangeOverride?: Record<SliceAxis, [number, number]>,
  ) => {
    const [min, max] = (rangeOverride ?? sliceRange)[axis]
    return Math.min(Math.max(value, min), max)
  }

  const renderSlice = (
    axis: SliceAxis,
    value: number,
    resetCamera = false,
    rangeOverride?: Record<SliceAxis, [number, number]>,
  ) => {
    const slicePipeline = slicePipelineRef.current
    const data = imageDataRef.current
    if (!slicePipeline || !data) {
      return
    }
    const clamped = clampSliceIndex(axis, value, rangeOverride)
    slicePipeline.mapper.setInputData(data)
    slicePipeline.mapper.setSlicingMode(sliceModes[axis])
    slicePipeline.mapper.setSlice(clamped)
    if (resetCamera) {
      slicePipeline.generic.getRenderer().resetCamera()
    }
    slicePipeline.generic.getRenderWindow().render()
  }

  const toggleStructureVisibility = (structureId: string) => {
    setVisibleStructures((prev) => {
      const next = { ...prev, [structureId]: !prev[structureId] }
      const actor = structureActorsRef.current[structureId]
      if (actor) {
        actor.setVisibility(next[structureId])
        volumePipelineRef.current?.renderWindow.render()
      }
      return next
    })
  }

  const handleSliceChange = (axis: SliceAxis, value: number) => {
    renderSlice(axis, value)
    setSliceState((prev) => ({ ...prev, [axis]: value }))
  }

  const hasVolume = !!imageDataRef.current
  const ambientLabel = useLightTheme ? 'Use Dark Theme' : 'Use Light Theme'
  const viewToggleLabel = viewMode === '3d' ? 'Switch to 2D View' : 'Switch to 3D View'
  const currentSliceRange = sliceRange[activeSliceAxis]
  const currentSliceValue = clampSliceIndex(activeSliceAxis, sliceState[activeSliceAxis])
  const sliceSliderDisabled =
    !hasVolume || currentSliceRange[0] === currentSliceRange[1]

  const slicePanelMessage =
    loadingMessage ??
    errorMessage ??
    (!volume?.url ? 'Provide a volume URL and format to visualise data.' : null)

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
            {!volume?.url && (
              <div className="dicom-viewer__placeholder">
                Provide a volume URL and format to visualise data.
              </div>
            )}
            {volume?.url && !hasVolume && !loadingMessage && !errorMessage && (
              <div className="dicom-viewer__placeholder">Preparing viewer…</div>
            )}
            {loadingMessage && (
              <div className="dicom-viewer__placeholder">{loadingMessage}</div>
            )}
            {errorMessage && (
              <div className="dicom-viewer__placeholder dicom-viewer__placeholder--error">
                {errorMessage}
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
                <div ref={axisRefs[activeSliceAxis]} className="dicom-viewer__slice-canvas" />
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
              onClick={() => volumePipelineRef.current?.renderer.resetCamera()}
            >
              Center View
            </button>
            <button
              type="button"
              className="dicom-viewer__secondary"
              onClick={() => setViewMode((prev) => (prev === '3d' ? '2d' : '3d'))}
            >
              {viewToggleLabel}
            </button>
            <button
              type="button"
              className="dicom-viewer__secondary"
              onClick={() => setShowVolume((prev) => !prev)}
              disabled={!hasVolume}
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
                  />
                  <span>{structure.name}</span>
                </label>
                <button
                  type="button"
                  onClick={() => onExportStructure?.(structure.id)}
                  disabled={!structure.meshUrl}
                >
                  Export
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

export default DicomViewer
