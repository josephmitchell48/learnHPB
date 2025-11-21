import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow'
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume'
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper'
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction'
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction'
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor'
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper'
import vtkXMLPolyDataReader from '@kitware/vtk.js/IO/XML/XMLPolyDataReader'
import type vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData'
import type vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData'
import type { ViewerStructure } from './types'
import { logCaseAssetDebug } from '../../config/assets'

type VolumePipeline = {
  generic: vtkGenericRenderWindow
  renderer: ReturnType<vtkGenericRenderWindow['getRenderer']>
  renderWindow: ReturnType<vtkGenericRenderWindow['getRenderWindow']>
  mapper: vtkVolumeMapper
  volume: vtkVolume
}

export type VolumeRenderer3DHandle = {
  resetCamera: () => void
}

type VolumeRenderer3DProps = {
  containerRef: React.MutableRefObject<HTMLDivElement | null>
  imageDataRef: React.MutableRefObject<vtkImageData | null>
  version: number
  structures: ViewerStructure[]
  visibleStructures: Record<string, boolean>
  showVolume: boolean
  useLightTheme: boolean
}

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

const VolumeRenderer3D = forwardRef<VolumeRenderer3DHandle, VolumeRenderer3DProps>(
  (
    {
      containerRef,
      imageDataRef,
      version,
      structures,
      visibleStructures,
      showVolume,
      useLightTheme,
    },
    ref,
  ) => {
    const volumePipelineRef = useRef<VolumePipeline | null>(null)
    const structureActorsRef = useRef<Record<string, vtkActor>>({})
    const mountedRef = useRef(false)

    const cleanupStructures = () => {
      const pipeline = volumePipelineRef.current
      if (!pipeline) {
        structureActorsRef.current = {}
        return
      }
      Object.values(structureActorsRef.current).forEach((actor) => {
        pipeline.renderer.removeActor(actor)
        actor.delete()
      })
      structureActorsRef.current = {}
      pipeline.renderWindow.render()
    }

    useImperativeHandle(ref, () => ({
      resetCamera: () => {
        const pipeline = volumePipelineRef.current
        if (!pipeline) {
          return
        }
        pipeline.renderer.resetCamera()
        pipeline.renderWindow.render()
      },
    }))

    useEffect(() => {
      if (mountedRef.current) {
        return
      }
      const container = containerRef.current
      if (!container) {
        return
      }
      mountedRef.current = true

      const generic = vtkGenericRenderWindow.newInstance({
        background: useLightTheme ? [0.98, 0.97, 0.96] : [0.07, 0.09, 0.12],
      })
      generic.setContainer(container)
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

      if (imageDataRef.current) {
        mapper.setInputData(imageDataRef.current)
        renderer.resetCamera()
      }
      generic.getRenderWindow().render()

      return () => {
        cleanupStructures()
        generic.delete()
        volumePipelineRef.current = null
        mountedRef.current = false
      }
    }, [])

    useEffect(() => {
      const pipeline = volumePipelineRef.current
      if (!pipeline) {
        return
      }
      const data = imageDataRef.current
      if (!data) {
        pipeline.volume.setVisibility(false)
        pipeline.renderWindow.render()
        return
      }
      pipeline.mapper.setInputData(data)
      pipeline.renderer.resetCamera()
      pipeline.renderWindow.render()
    }, [version])

    useEffect(() => {
      const pipeline = volumePipelineRef.current
      if (!pipeline) {
        return
      }
      const backgroundColor: [number, number, number] = useLightTheme
        ? [0.98, 0.97, 0.96]
        : [0.07, 0.09, 0.12]
      pipeline.generic.setBackground(backgroundColor)
      pipeline.renderWindow.render()
    }, [useLightTheme])

    const meshCache = useRef<Map<string, vtkPolyData>>(new Map())
    const meshPromiseCache = useRef<Map<string, Promise<vtkPolyData>>>(new Map())

    const loadPolyData = (meshUrl: string) => {
      const existing = meshCache.current.get(meshUrl)
      if (existing) {
        logCaseAssetDebug('Mesh cache hit:', meshUrl)
        return Promise.resolve(existing)
      }
      const pending = meshPromiseCache.current.get(meshUrl)
      if (pending) {
        logCaseAssetDebug('Mesh fetch already in progress:', meshUrl)
        return pending
      }
      const promise = fetch(meshUrl, { cache: 'force-cache' })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`)
          }
          return response.arrayBuffer()
        })
        .then((buffer) => {
          const reader = vtkXMLPolyDataReader.newInstance()
          reader.parseAsArrayBuffer(buffer)
          const polyData = reader.getOutputData(0) as vtkPolyData
          meshCache.current.set(meshUrl, polyData)
          meshPromiseCache.current.delete(meshUrl)
          logCaseAssetDebug('Mesh loaded:', meshUrl)
          return polyData
        })
        .catch((error) => {
          meshPromiseCache.current.delete(meshUrl)
          logCaseAssetDebug('Mesh fetch failed:', meshUrl, error)
          throw error
        })
      logCaseAssetDebug('Fetching mesh data:', meshUrl)
      meshPromiseCache.current.set(meshUrl, promise)
      return promise
    }

    useEffect(() => {
      const pipeline = volumePipelineRef.current
      if (!pipeline) {
        cleanupStructures()
        return
      }

      const renderer = pipeline.renderer
      const renderWindow = pipeline.renderWindow
      const actors = structureActorsRef.current
      let canceled = false

      const activeIds = new Set(structures.map((structure) => structure.id))
      Object.entries(actors).forEach(([id, actor]) => {
        if (!activeIds.has(id)) {
          renderer.removeActor(actor)
          actor.delete()
          delete actors[id]
        }
      })

      const tasks = structures.map(async (structure) => {
        if (!structure.meshUrl) {
          return
        }
        try {
          const polyData = await loadPolyData(structure.meshUrl)
          if (canceled || !volumePipelineRef.current) {
            return
          }
          let actor = actors[structure.id]
          if (!actor) {
            const mapper = vtkMapper.newInstance()
            mapper.setInputData(polyData)
            actor = vtkActor.newInstance()
            actor.setMapper(mapper)
            actors[structure.id] = actor
            renderer.addActor(actor)
          } else {
            const mapper = actor.getMapper()
            if (mapper) {
              mapper.setInputData(polyData)
            }
          }
          actor.getProperty().setColor(...toRgb(structure.color))
          actor.getProperty().setOpacity(0.92)
          actor.setVisibility(visibleStructures[structure.id] ?? true)
        } catch (error) {
          if (!canceled) {
            console.error(`Failed to load structure ${structure.name}`, error)
          }
        }
      })

      Promise.all(tasks).then(() => {
        if (!canceled) {
          if (!imageDataRef.current && structures.length > 0) {
            renderer.resetCamera()
          }
          renderWindow.render()
        }
      })

      return () => {
        canceled = true
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [structures, version])

    useEffect(() => {
      const actors = structureActorsRef.current
      const pipeline = volumePipelineRef.current
      if (!pipeline) {
        return
      }
      Object.entries(visibleStructures).forEach(([id, visible]) => {
        const actor = actors[id]
        if (actor) {
          actor.setVisibility(visible)
        }
      })
      pipeline.renderWindow.render()
    }, [visibleStructures])

    useEffect(() => {
      const pipeline = volumePipelineRef.current
      if (!pipeline) {
        return
      }
      const hasData = Boolean(imageDataRef.current)
      pipeline.volume.setVisibility(showVolume && hasData)
      pipeline.renderWindow.render()
    }, [showVolume, version])

    return null
  },
)

VolumeRenderer3D.displayName = 'VolumeRenderer3D'

export default VolumeRenderer3D
