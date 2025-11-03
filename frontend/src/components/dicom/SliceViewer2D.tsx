import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow'
import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper'
import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice'
import vtkInteractorStyleImage from '@kitware/vtk.js/Interaction/Style/InteractorStyleImage'
import type vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData'
import type { SliceAxis } from './types'

type SlicePipeline = {
  generic: vtkGenericRenderWindow
  mapper: vtkImageMapper
  actor: vtkImageSlice
}

export type SliceViewer2DHandle = {
  setSlice: (axis: SliceAxis, value: number) => void
}

type SliceViewer2DProps = {
  containerRef: React.MutableRefObject<HTMLDivElement | null>
  imageDataRef: React.MutableRefObject<vtkImageData | null>
  axis: SliceAxis
  slice: number
  version: number
  viewUp?: [number, number, number]
  focalPoint?: [number, number, number]
  position?: [number, number, number]
  direction?: [number, number, number]
}

const sliceModes: Record<SliceAxis, number> = {
  i: vtkImageMapper.SlicingMode.I,
  j: vtkImageMapper.SlicingMode.J,
  k: vtkImageMapper.SlicingMode.K,
}

const SliceViewer2D = forwardRef<SliceViewer2DHandle, SliceViewer2DProps>(
  (
    {
      containerRef,
      imageDataRef,
      axis,
      slice,
      version,
      viewUp = [0, 1, 0],
      focalPoint,
      position,
      direction,
    },
    ref,
  ) => {
    const slicePipelineRef = useRef<SlicePipeline | null>(null)

    const configureCamera = (resetPosition: boolean) => {
      const pipeline = slicePipelineRef.current
      const data = imageDataRef.current
      if (!pipeline || !data) {
        return
      }

      const renderer = pipeline.generic.getRenderer()
      const camera = renderer.getActiveCamera()

      camera.setParallelProjection(true)
      if (resetPosition) {
        renderer.resetCamera()
      }

      camera.setViewUp(...viewUp)

      const bounds = pipeline.mapper.getBounds()
      const hasBounds =
        Array.isArray(bounds) && bounds.length === 6 && bounds.every((value) => Number.isFinite(value))

      const center = hasBounds
        ? ([
            (bounds[0] + bounds[1]) / 2,
            (bounds[2] + bounds[3]) / 2,
            (bounds[4] + bounds[5]) / 2,
          ] as [number, number, number])
        : (data.getCenter() as [number, number, number])

      const span = hasBounds
        ? [
            Math.abs(bounds[1] - bounds[0]),
            Math.abs(bounds[3] - bounds[2]),
            Math.abs(bounds[5] - bounds[4]),
          ]
        : [1, 1, 1]

      const target = (focalPoint ?? center) as [number, number, number]
      camera.setFocalPoint(...target)

      let distance = camera.getDistance()
      if (!Number.isFinite(distance) || distance === 0) {
        distance = Math.max(...span, 1) * 1.5
      }

      if (position) {
        camera.setPosition(...position)
      } else {
        const defaultDirection = (() => {
          switch (axis) {
            case 'i':
              return [1, 0, 0] as [number, number, number]
            case 'j':
              return [0, -1, 0] as [number, number, number]
            default:
              return [0, 0, 1] as [number, number, number]
          }
        })()

        const [dx, dy, dz] = direction ?? defaultDirection
        const magnitude = Math.hypot(dx, dy, dz) || 1
        const nx = dx / magnitude
        const ny = dy / magnitude
        const nz = dz / magnitude

        const [cx, cy, cz] = target
        camera.setPosition(cx - nx * distance, cy - ny * distance, cz - nz * distance)
      }

      renderer.resetCameraClippingRange()
      pipeline.generic.getRenderWindow().render()
    }

    const applySlice = (targetAxis: SliceAxis, targetSlice: number, resetCamera: boolean) => {
      const pipeline = slicePipelineRef.current
      const data = imageDataRef.current
      if (!pipeline || !data) {
        return
      }

      pipeline.mapper.setInputData(data)
      pipeline.mapper.setSlicingMode(sliceModes[targetAxis])
      pipeline.mapper.setSlice(targetSlice)
      configureCamera(resetCamera)
    }

    useImperativeHandle(ref, () => ({
      setSlice: (targetAxis, value) => applySlice(targetAxis, value, false),
    }))

    useEffect(() => {
      const container = containerRef.current
      if (!container) {
        return
      }

      const generic = vtkGenericRenderWindow.newInstance({
        background: [0.07, 0.09, 0.12],
      })
      generic.setContainer(container)
      generic.resize()

      const mapper = vtkImageMapper.newInstance()
      mapper.setSliceAtFocalPoint(false)
      mapper.setSlicingMode(sliceModes[axis])

      const actor = vtkImageSlice.newInstance()
      actor.setMapper(mapper)
      actor.getProperty().setColorWindow(1500)
      actor.getProperty().setColorLevel(-500)

      const renderer = generic.getRenderer()
      renderer.addViewProp(actor)
      const interactor = generic.getInteractor()
      interactor.setInteractorStyle(vtkInteractorStyleImage.newInstance())

      slicePipelineRef.current = { generic, mapper, actor }
      configureCamera(true)

      return () => {
        generic.delete()
        slicePipelineRef.current = null
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
      applySlice(axis, slice, true)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [axis, version])

    useEffect(() => {
      applySlice(axis, slice, false)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slice])

    useEffect(() => {
      configureCamera(false)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewUp, focalPoint, position, direction])

    return null
  },
)

SliceViewer2D.displayName = 'SliceViewer2D'

export default SliceViewer2D
