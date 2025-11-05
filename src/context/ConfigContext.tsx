import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type FirebaseConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket?: string
  messagingSenderId?: string
  appId: string
  measurementId?: string
} | null

export type AppConfig = {
  cnpjApiBase: string
  ibptPageUrl: string
  ibptCsvUrl: string
  cosmosApiBase: string
  cosmosToken: string
  firebaseEnabled: boolean
  firebaseConfig: FirebaseConfig
}

const DEFAULT_CONFIG: AppConfig = {
  cnpjApiBase: 'https://publica.cnpj.ws/cnpj',
  ibptPageUrl: 'https://www.concity.com.br/tabela-ibpt',
  ibptCsvUrl: '/ibpt-csv',
  cosmosApiBase: 'https://api.cosmos.bluesoft.com.br',
  // Token inicial fornecido pelo usuário; pode ser alterado nas Configurações
  cosmosToken: 'Ts9bLK2j2nyrnaxyZ-0_HQ',
  firebaseEnabled: false,
  firebaseConfig: null,
}

const ConfigContext = createContext<{
  config: AppConfig
  setConfig: (next: AppConfig) => void
} | null>(null)

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(() => {
    try {
      const raw = localStorage.getItem('monitorVision.config')
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppConfig>
        const merged = { ...DEFAULT_CONFIG, ...parsed } as AppConfig
        // Em desenvolvimento, usar proxies locais quando disponíveis
        if (import.meta.env.DEV) {
          merged.ibptCsvUrl = DEFAULT_CONFIG.ibptCsvUrl
          merged.cosmosApiBase = '/api/cosmos'
        }
        return merged
      }
    } catch {}
    // Em desenvolvimento, usar proxies locais quando disponíveis
    if (import.meta.env.DEV) {
      return { ...DEFAULT_CONFIG, ibptCsvUrl: '/ibpt-csv', cosmosApiBase: '/api/cosmos' }
    }
    return DEFAULT_CONFIG
  })

  useEffect(() => {
    try {
      localStorage.setItem('monitorVision.config', JSON.stringify(config))
    } catch {}
  }, [config])

  const value = useMemo(() => ({ config, setConfig }), [config])
  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
}

export function useConfig() {
  const ctx = useContext(ConfigContext)
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider')
  return ctx
}