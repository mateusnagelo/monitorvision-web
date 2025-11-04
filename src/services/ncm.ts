import axios from 'axios'

export type NCMResponse = any

function baseForEnv(baseUrl: string) {
  const base = import.meta.env.DEV ? '/api/cosmos' : baseUrl
  return base.replace(/\/$/, '')
}

export async function fetchNCM(baseUrl: string, token: string, code: string) {
  const base = baseForEnv(baseUrl)
  const encoded = encodeURIComponent(code)
  const endpoints = [
    `${base}/ncms/${encoded}/products`, // base geral
    `${base}/retailers/ncms/${encoded}`, // varejista (alguns tokens/contas usam este)
    `${base}/ncms/${encoded}/products.json`, // fallback legacy
  ]

  const axiosCfg = {
    timeout: 20000,
    headers: {
      'Content-Type': 'application/json',
      'X-Cosmos-Token': token,
    },
  } as const

  let lastError: any = null

  for (const path of endpoints) {
    try {
      if (import.meta.env.DEV) console.log(`[NCM] tentando: ${path}`)
      const res = await axios.get(path, axiosCfg)
      if (import.meta.env.DEV) console.log(`[NCM] sucesso: ${path}`)
      return res.data as NCMResponse
    } catch (err: any) {
      lastError = err
      if (err?.response) {
        const status = err.response.status
        if (import.meta.env.DEV) console.warn(`[NCM] falha (${status}) em: ${path}`)
        // Se for 404, tenta próximo endpoint
        if (status === 404) continue
        if (status === 401) throw new Error('Autenticação requerida ou token inválido (401)')
        if (status === 403) throw new Error('Acesso negado (403)')
        if (status === 429) throw new Error('Limite de chamadas excedido (429). Tente novamente mais tarde.')
        throw new Error(`Falha na consulta (HTTP ${status})`)
      }
      // Erro de rede: aborta
      throw new Error('Falha de rede ao consultar NCM')
    }
  }

  // Se todos retornarem 404
  throw new Error('NCM não encontrado (404)')
}

export type NCMLog = {
  timestamp: string
  ncm: string
  success: boolean
  error?: string | null
}

export function appendNcmLog(event: NCMLog) {
  const key = 'ncm.logs'
  try {
    const raw = localStorage.getItem(key)
    const list = raw ? JSON.parse(raw) : []
    const next = Array.isArray(list) ? [...list, event] : [event]
    localStorage.setItem(key, JSON.stringify(next))
  } catch {}
}