import { useEffect, useMemo, useRef, useState } from 'react'
import vtkXMLImageDataReader from '@kitware/vtk.js/IO/XML/XMLImageDataReader'
import type vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData'
import type { ViewerVolume } from './types'

type VolumeExtent = [number, number, number, number, number, number]

const defaultExtent: VolumeExtent = [0, 0, 0, 0, 0, 0]

export type UseVtkVolumeResult = {
  imageDataRef: React.MutableRefObject<vtkImageData | null>
  extent: VolumeExtent
  loadingMessage: string | null
  errorMessage: string | null
  hasVolume: boolean
  version: number
}

/**
 * Loads a VTK image dataset and exposes it via a shared ref for downstream renderers.
 * The hook keeps transport concerns outside of rendering components so they can
 * focus purely on drawing logic.
 */
export const useVtkVolume = (volume?: ViewerVolume): UseVtkVolumeResult => {
  const imageDataRef = useRef<vtkImageData | null>(null)
  const [extent, setExtent] = useState<VolumeExtent>(defaultExtent)
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [hasVolume, setHasVolume] = useState(false)
  const [version, setVersion] = useState(0)

  const sourceDescriptor = useMemo(() => {
    if (!volume?.url) {
      return null
    }
    return {
      url: volume.url,
      format: volume.format ?? 'vti',
    }
  }, [volume?.format, volume?.url])

  useEffect(() => {
    let canceled = false

    const markVersion = (nextHasVolume: boolean, nextExtent: VolumeExtent) => {
      setHasVolume(nextHasVolume)
      setExtent(nextExtent)
      setVersion((prev) => prev + 1)
    }

    const resetState = () => {
      imageDataRef.current = null
      markVersion(false, defaultExtent)
    }

    const loadVolume = async () => {
      if (!sourceDescriptor) {
        setLoadingMessage(null)
        setErrorMessage(null)
        resetState()
        return
      }

      if (sourceDescriptor.format !== 'vti') {
        setLoadingMessage(null)
        setErrorMessage(
          `Unsupported volume format "${sourceDescriptor.format}". Expected .vti`,
        )
        resetState()
        return
      }

      try {
        setLoadingMessage('Loading volume data…')
        setErrorMessage(null)

        const response = await fetch(sourceDescriptor.url, { cache: 'force-cache' })
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const buffer = await response.arrayBuffer()
        if (canceled) {
          return
        }

        const reader = vtkXMLImageDataReader.newInstance()
        reader.parseAsArrayBuffer(buffer)
        const imageData = reader.getOutputData(0)

        imageDataRef.current = imageData
        const nextExtent = imageData.getExtent() as VolumeExtent
        markVersion(true, nextExtent)

        setLoadingMessage(null)
      } catch (error) {
        if (!canceled) {
          console.error('vtk volume load failed', error)
          setLoadingMessage(null)
          setErrorMessage(
            'Unable to load the imaging volume. Verify the asset URL and format.',
          )
          resetState()
        }
      }
    }

    loadVolume()

    return () => {
      canceled = true
    }
  }, [sourceDescriptor])

  return {
    imageDataRef,
    extent,
    loadingMessage,
    errorMessage,
    hasVolume,
    version,
  }
}
