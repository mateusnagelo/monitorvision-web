import axios from 'axios'

export type CosmosProduct = any
export type CosmosSearchResult = any

function baseForEnv(baseUrl: string) {
  const base = import.meta.env.DEV ? '/api/cosmos' : baseUrl
  return base.replace(/\/$/, '')
}

export async function fetchByEAN(baseUrl: string, token: string, ean: string) {
  const base = baseForEnv(baseUrl)
  const path = `${base}/gtins/${encodeURIComponent(ean)}.json`
  try {
    const res = await axios.get(path, {
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
        'X-Cosmos-Token': token,
      },
    })
    return res.data as CosmosProduct
  } catch (err: any) {
    if (err?.response) {
      const status = err.response.status
      if (status === 404) throw new Error('EAN/GTIN não encontrado (404)')
      if (status === 401) throw new Error('Token inválido ou ausente (401)')
      if (status === 403) throw new Error('Acesso negado (403)')
      if (status === 429) throw new Error('Limite de chamadas excedido (429)')
      throw new Error(`Falha na consulta (HTTP ${status})`)
    }
    throw new Error('Falha de rede ao consultar por EAN')
  }
}

export async function searchProducts(baseUrl: string, token: string, query: string, page = 1) {
  const base = baseForEnv(baseUrl)
  const path = `${base}/products.json?query=${encodeURIComponent(query)}&page=${page}`
  try {
    const res = await axios.get(path, {
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
        'X-Cosmos-Token': token,
      },
    })
    return res.data as CosmosSearchResult
  } catch (err: any) {
    if (err?.response) {
      const status = err.response.status
      if (status === 404) throw new Error('Nenhum produto encontrado (404)')
      if (status === 401) throw new Error('Token inválido ou ausente (401)')
      if (status === 403) throw new Error('Acesso negado (403)')
      if (status === 429) throw new Error('Limite de chamadas excedido (429)')
      throw new Error(`Falha na consulta (HTTP ${status})`)
    }
    throw new Error('Falha de rede ao pesquisar produtos')
  }
}

export type CosmosLog = {
  timestamp: string
  type: 'NCM' | 'EAN' | 'NOME'
  query: string
  success: boolean
  error?: string | null
}

export function appendCosmosLog(event: CosmosLog) {
  const key = 'cosmos.logs'
  try {
    const raw = localStorage.getItem(key)
    const list = raw ? JSON.parse(raw) : []
    const next = Array.isArray(list) ? [...list, event] : [event]
    localStorage.setItem(key, JSON.stringify(next))
  } catch {}
}