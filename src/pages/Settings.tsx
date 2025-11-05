import { useState, useEffect } from 'react'
import { Box, Paper, Typography, TextField, Button, Stack, Alert, Switch, FormControlLabel } from '@mui/material'
import { useConfig } from '../context/ConfigContext'
import { fetchByEAN } from '../services/cosmos'
import { useLocation } from 'react-router-dom'
import { initFirebase } from '../services/firebase'

export default function Settings() {
  const { config, setConfig } = useConfig()
  const [cosmosToken, setCosmosToken] = useState<string>(config.cosmosToken || '')
  const [cosmosApiBase, setCosmosApiBase] = useState<string>(config.cosmosApiBase || '')
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null)
  const isDev = import.meta.env.DEV
  const location = useLocation()

  // Firebase form state
  const [firebaseEnabled, setFirebaseEnabled] = useState<boolean>(!!config.firebaseEnabled)
  const [apiKey, setApiKey] = useState(config.firebaseConfig?.apiKey || '')
  const [authDomain, setAuthDomain] = useState(config.firebaseConfig?.authDomain || '')
  const [projectId, setProjectId] = useState(config.firebaseConfig?.projectId || '')
  const [storageBucket, setStorageBucket] = useState(config.firebaseConfig?.storageBucket || '')
  const [messagingSenderId, setMessagingSenderId] = useState(config.firebaseConfig?.messagingSenderId || '')
  const [appId, setAppId] = useState(config.firebaseConfig?.appId || '')
  const [measurementId, setMeasurementId] = useState(config.firebaseConfig?.measurementId || '')
  const [firebaseStatus, setFirebaseStatus] = useState<{ type: 'success' | 'error' | 'info'; msg: string } | null>(null)

  const firebaseConfig = {
    apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId,
  }

  // Cosmos token prefill via URL
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
    const nextBase = isDev ? '/api/cosmos' : (cosmosApiBase || 'https://api.cosmos.bluesoft.com.br')
    setConfig({
      ...config,
      cosmosToken,
      cosmosApiBase: nextBase,
      firebaseEnabled,
      firebaseConfig: firebaseEnabled ? firebaseConfig : null,
    })
    setStatus({ type: 'success', msg: 'Configurações salvas.' })
  }

  const handleValidate = async () => {
    setStatus(null)
    try {
      await fetchByEAN(config.cosmosApiBase, cosmosToken, '7894900011517')
      setStatus({ type: 'success', msg: 'Token aceito pela API Cosmos.' })
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

  const handleInitFirebase = () => {
    setFirebaseStatus(null)
    try {
      if (!firebaseEnabled) {
        setFirebaseStatus({ type: 'error', msg: 'Ative o Firebase para inicializar.' })
        return
      }
      initFirebase(firebaseConfig)
      setFirebaseStatus({ type: 'success', msg: 'Firebase inicializado com sucesso.' })
    } catch (e: any) {
      setFirebaseStatus({ type: 'error', msg: `Falha ao inicializar Firebase: ${e?.message || e}` })
    }
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Configurações</Typography>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Cosmos (Bluesoft)</Typography>
          <TextField label="Cosmos Token" value={cosmosToken} onChange={(e) => setCosmosToken(e.target.value)} placeholder="Cole aqui seu X-Cosmos-Token" fullWidth />
          <TextField label="Cosmos API Base" value={cosmosApiBase} onChange={(e) => setCosmosApiBase(e.target.value)} fullWidth disabled={isDev} helperText={isDev ? 'Em desenvolvimento, o app usa proxy /api/cosmos automaticamente.' : 'Ex.: https://api.cosmos.bluesoft.com.br'} />
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={handleSave}>Salvar</Button>
            <Button variant="outlined" onClick={handleValidate}>Validar token</Button>
          </Stack>
          {status && (<Alert severity={status.type}>{status.msg}</Alert>)}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, mt: 2 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Firebase</Typography>
          <FormControlLabel control={<Switch checked={firebaseEnabled} onChange={(e) => setFirebaseEnabled(e.target.checked)} />} label="Ativar Firebase" />
          <TextField label="apiKey" value={apiKey} onChange={(e) => setApiKey(e.target.value)} fullWidth />
          <TextField label="authDomain" value={authDomain} onChange={(e) => setAuthDomain(e.target.value)} fullWidth />
          <TextField label="projectId" value={projectId} onChange={(e) => setProjectId(e.target.value)} fullWidth />
          <TextField label="storageBucket" value={storageBucket} onChange={(e) => setStorageBucket(e.target.value)} fullWidth />
          <TextField label="messagingSenderId" value={messagingSenderId} onChange={(e) => setMessagingSenderId(e.target.value)} fullWidth />
          <TextField label="appId" value={appId} onChange={(e) => setAppId(e.target.value)} fullWidth />
          <TextField label="measurementId" value={measurementId} onChange={(e) => setMeasurementId(e.target.value)} fullWidth />
          <Stack direction="row" spacing={2}>
            <Button variant="contained" onClick={handleSave}>Salvar Firebase</Button>
            <Button variant="outlined" onClick={handleInitFirebase} disabled={!firebaseEnabled}>Inicializar Firebase</Button>
          </Stack>
          {firebaseStatus && (<Alert severity={firebaseStatus.type}>{firebaseStatus.msg}</Alert>)}
        </Stack>
      </Paper>
      <Box sx={{ mt: 2 }}>
        <Alert severity="info">Dica: Após configurar e salvar, você pode inicializar o Firebase e usar Firestore/Auth/Storage. Para integração .EXE, evitaremos expor chaves no código e usaremos esta tela de configuração para injetar as credenciais.</Alert>
      </Box>
    </Box>
  )
}