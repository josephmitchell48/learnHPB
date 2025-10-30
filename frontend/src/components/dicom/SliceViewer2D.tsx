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
}

const sliceModes: Record<SliceAxis, number> = {
  i: vtkImageMapper.SlicingMode.I,
  j: vtkImageMapper.SlicingMode.J,
  k: vtkImageMapper.SlicingMode.K,
}

const SliceViewer2D = forwardRef<SliceViewer2DHandle, SliceViewer2DProps>(
  ({ containerRef, imageDataRef, axis, slice, version }, ref) => {
    const slicePipelineRef = useRef<SlicePipeline | null>(null)

    const applySlice = (targetAxis: SliceAxis, targetSlice: number, resetCamera: boolean) => {
      const pipeline = slicePipelineRef.current
      const data = imageDataRef.current
      if (!pipeline || !data) {
        return
      }

      pipeline.mapper.setInputData(data)
      pipeline.mapper.setSlicingMode(sliceModes[targetAxis])
      pipeline.mapper.setSlice(targetSlice)
      if (resetCamera) {
        pipeline.generic.getRenderer().resetCamera()
      }
      pipeline.generic.getRenderWindow().render()
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

    return null
  },
)

SliceViewer2D.displayName = 'SliceViewer2D'

export default SliceViewer2D
