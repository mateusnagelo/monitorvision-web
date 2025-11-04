import { useState, useEffect } from 'react'
import { Box, Paper, Typography, TextField, Button, Stack, Alert } from '@mui/material'
import { useConfig } from '../context/ConfigContext'
import { fetchByEAN } from '../services/cosmos'
import { useLocation } from 'react-router-dom'

export default function Settings() {
  const { config, setConfig } = useConfig()
  const [cosmosToken, setCosmosToken] = useState<string>(config.cosmosToken || '')
  const [cosmosApiBase, setCosmosApiBase] = useState<string>(config.cosmosApiBase || '')
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null)
  const isDev = import.meta.env.DEV
  const location = useLocation()

  useEffect(() => {
    // Pré-preencher token via query string: /config?cosmosToken=...
    const params = new URLSearchParams(location.search)
    const t = params.get('cosmosToken')
    if (t) {
      setCosmosToken(t)
      setStatus({ type: 'info', msg: 'Token pré-preenchido a partir da URL. Clique Validar e depois Salvar.' })
    }
  }, [location.search])

  const handleSave = () => {
    const nextBase = isDev ? '/cosmos' : (cosmosApiBase || 'https://api.cosmos.bluesoft.com.br')
    setConfig({ ...config, cosmosToken, cosmosApiBase: nextBase })
    setStatus({ type: 'success', msg: 'Configurações salvas. Tente novamente sua consulta por Nome ou NCM.' })
  }

  const handleValidate = async () => {
    setStatus(null)
    try {
      // Validação simples: tentar consultar um GTIN popular. 401 indica token inválido/ausente.
      await fetchByEAN(config.cosmosApiBase, cosmosToken, '7894900011517')
      setStatus({
        type: 'success',
        msg: 'Token aceito pela API. Se um produto não aparecer, pode ser apenas um 404 específico da consulta.'
      })
    } catch (e: any) {
      const message = e?.message || String(e)
      if (message.includes('401')) {
        setStatus({ type: 'error', msg: 'Token inválido ou ausente (401). Verifique o valor e salve novamente.' })
      } else if (message.includes('403') || message.includes('429')) {
        setStatus({ type: 'error', msg: `Erro da API: ${message}` })
      } else {
        setStatus({ type: 'info', msg: `Resposta da API: ${message}` })
      }
    }
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Configurações</Typography>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Cosmos (Bluesoft)</Typography>
          <TextField
            label="Cosmos Token"
            value={cosmosToken}
            onChange={(e) => setCosmosToken(e.target.value)}
            placeholder="Cole aqui seu X-Cosmos-Token"
            fullWidth
          />
          <TextField
            label="Cosmos API Base"
            value={cosmosApiBase}
            onChange={(e) => setCosmosApiBase(e.target.value)}
            fullWidth
            disabled={isDev}
            helperText={isDev ? 'Em desenvolvimento, o app usa proxy /cosmos automaticamente.' : 'Ex.: https://api.cosmos.bluesoft.com.br'}
          />
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={handleSave}>Salvar</Button>
            <Button variant="outlined" onClick={handleValidate}>Validar token</Button>
          </Stack>
          {status && (
            <Alert severity={status.type}>
              {status.msg}
            </Alert>
          )}
        </Stack>
      </Paper>
      <Box sx={{ mt: 2 }}>
        <Alert severity="info">
          Dica: Após salvar o token, volte para "Consulta Cosmos" e tente novamente a busca por Nome (ex.: "arroz") ou por NCM (8 dígitos).
        </Alert>
      </Box>
    </Box>
  )
}