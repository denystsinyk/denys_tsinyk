// src/hooks/useData.ts
import { useEffect, useState } from 'react'
import type { SiteData } from '../types/data'

interface UseDataResult {
  data: SiteData | null
  loading: boolean
  error: string | null
  isStale: boolean
}

export function useData(): UseDataResult {
  const [data, setData] = useState<SiteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data.json`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<SiteData>
      })
      .then(d => { setData(d); setLoading(false) })
      .catch(e => { setError(String(e)); setLoading(false) })
  }, [])

  const isStale = data
    ? Date.now() - new Date(data.updated_at).getTime() > 30 * 60 * 1000
    : false

  return { data, loading, error, isStale }
}
