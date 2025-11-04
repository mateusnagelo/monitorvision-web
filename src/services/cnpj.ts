import axios from 'axios'

export type CNPJData = any // Estrutura completa será definida após integração real

export async function fetchCNPJ(baseUrl: string, cnpj: string) {
  const base = import.meta.env.DEV ? '/cnpj' : baseUrl
  const url = `${base.replace(/\/$/, '')}/${cnpj}`
  try {
    const res = await axios.get(url, { timeout: 15000 })
    return res.data as CNPJData
  } catch (err: any) {
    if (err?.response) {
      const status = err.response.status
      if (status === 404) throw new Error('CNPJ não encontrado (404)')
      if (status === 429) throw new Error('Muitas consultas em pouco tempo (429). Tente novamente mais tarde.')
      throw new Error(`Falha na consulta (HTTP ${status})`)
    }
    throw new Error('Falha de rede ao consultar CNPJ')
  }
}