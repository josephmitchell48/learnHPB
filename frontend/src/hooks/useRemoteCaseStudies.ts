import { useEffect, useState } from 'react'
import type { CaseStudy } from '../types/learning'
import { loadRemoteCaseStudies } from '../services/remoteCases'
import { supportsCaseAssetListing } from '../config/assets'

export const useRemoteCaseStudies = (enabled: boolean) => {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !supportsCaseAssetListing) {
      setCaseStudies([])
      setLoading(false)
      setError(null)
      return
    }

    let canceled = false
    setLoading(true)
    loadRemoteCaseStudies()
      .then((cases) => {
        if (!canceled) {
          setCaseStudies(cases)
          setError(null)
        }
      })
      .catch((err) => {
        if (!canceled) {
          console.error('Unable to load remote cases', err)
          setCaseStudies([])
          setError(err instanceof Error ? err.message : 'Failed to load remote cases')
        }
      })
      .finally(() => {
        if (!canceled) {
          setLoading(false)
        }
      })

    return () => {
      canceled = true
    }
  }, [enabled])

  return { caseStudies, loading, error }
}
