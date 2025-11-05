import { useState } from 'react'
import { Alert, Box, Button, Paper, Snackbar, Stack, TextField, Typography, Chip } from '@mui/material'

async function checkTcpLike(host: string, port: number, timeoutMs = 4000) {
  // Try HTTP and HTTPS fetch to common paths as a proxy for reachability
  const endpoints = [
    `http://${host}:${port}/`,
    `https://${host}:${port}/`,
  ]
  for (const url of endpoints) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const resp = await fetch(url, { mode: 'no-cors', signal: controller.signal })
      clearTimeout(timer)
      return { url, reachable: true }
    } catch {
      clearTimeout(timer)
      // continue to next scheme
    }
  }
  return { url: `http(s)://${host}:${port}/`, reachable: false }
}

async function checkWebSocket(host: string, port: number, timeoutMs = 4000) {
  return new Promise<{ reachable: boolean; url?: string }>((resolve) => {
    let settled = false
    const wsUrl = `ws://${host}:${port}`
    try {
      const ws = new WebSocket(wsUrl)
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true
          try { ws.close() } catch {}
          resolve({ reachable: false })
        }
      }, timeoutMs)
      ws.onopen = () => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          ws.close()
          resolve({ reachable: true, url: wsUrl })
        }
      }
      ws.onerror = () => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          resolve({ reachable: false })
        }
      }
    } catch {
      resolve({ reachable: false })
    }
  })
}

export default function PortCheck() {
  const [host, setHost] = useState('localhost')
  const [port, setPort] = useState<number>(5173)
  const [checking, setChecking] = useState(false)
  const [httpResult, setHttpResult] = useState<{ reachable: boolean; url?: string } | null>(null)
  const [wsResult, setWsResult] = useState<{ reachable: boolean; url?: string } | null>(null)
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'warning' | 'error' }>({ open: false, message: '', severity: 'success' })

  const commonPorts: { label: string; port: number }[] = [
    { label: 'FTP', port: 21 },
    { label: 'SSH', port: 22 },
    { label: 'Telnet', port: 23 },
    { label: 'DNS', port: 53 },
    { label: 'HTTP', port: 80 },
    { label: 'POP3', port: 110 },
    { label: 'IMAP', port: 143 },
    { label: 'HTTPS', port: 443 },
    { label: 'SMTP', port: 587 },
    { label: 'MySQL', port: 3306 },
  ]

  const runCheck = async () => {
    setChecking(true)
    setHttpResult(null)
    setWsResult(null)
    try {
      const http = await checkTcpLike(host, port)
      setHttpResult(http)
      const ws = await checkWebSocket(host, port)
      setWsResult(ws)
      setSnack({ open: true, message: 'Verificação concluída', severity: 'success' })
    } catch {
      setSnack({ open: true, message: 'Falha na verificação', severity: 'error' })
    } finally {
      setChecking(false)
    }
  }

  const isOpen = (httpResult?.reachable || wsResult?.reachable) ?? false

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Typography variant="h5" fontWeight={800}>Consulta de Porta</Typography>
      <Paper sx={{ p: 2 }} variant="outlined">
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField label="IP/Host" value={host} onChange={(e) => setHost(e.target.value)} sx={{ maxWidth: 280 }} />
            <TextField label="Porta" type="number" value={port} onChange={(e) => setPort(Number(e.target.value) || 0)} sx={{ maxWidth: 140 }} />
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" color="success" onClick={runCheck} disabled={checking}>Verificar</Button>
          </Stack>

          {(httpResult || wsResult) && (
            <Paper sx={{ p: 2 }} variant="outlined">
              <Typography sx={{ fontSize: 16 }} color={isOpen ? 'success.main' : 'error.main'}>
                A porta <strong>{port}</strong> no IP <strong>{host}</strong> está {isOpen ? 'aberta' : 'fechada'}!
              </Typography>
            </Paper>
          )}

          <Paper sx={{ p: 2 }} variant="outlined">
            <Typography variant="subtitle1" fontWeight={700}>Portas Comuns</Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
              {commonPorts.map((p) => (
                <Chip
                  key={p.port}
                  label={`${p.label}: ${p.port}`}
                  clickable
                  onClick={() => { if (!checking) { setPort(p.port); runCheck(); } }}
                  sx={{ m: 0.5 }}
                />
              ))}
            </Stack>
          </Paper>

          <Alert severity="info">
            Observação: navegadores não testam TCP puro. Este verificador tenta HTTP/HTTPS e WebSocket na porta indicada para inferir acessibilidade. Se ambos falharem, pode estar fechada, bloqueada por firewall ou o serviço não utiliza esses protocolos.
          </Alert>
        </Stack>
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Stack>
  )
}