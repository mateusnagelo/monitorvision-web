import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Paper, Snackbar, Stack, TextField, Typography, Chip } from '@mui/material'
import { motion } from 'framer-motion'
import { useTheme, alpha } from '@mui/material/styles'
import { createDownloadStream } from '../services/download';

function calcStats(samples: number[]) {
  const n = samples.length
  if (n === 0) return { avg: 0, min: 0, max: 0, jitter: 0 }
  const min = Math.min(...samples)
  const max = Math.max(...samples)
  const avg = samples.reduce((a, b) => a + b, 0) / n
  const variance = samples.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / n
  const jitter = Math.sqrt(variance)
  return { avg, min, max, jitter }
}

async function measureLatency(url: string, count = 10, timeoutMs = 3000) {
  // Usar endpoints com CORS e fallback para evitar bloqueios (gstatic pode ser negado em alguns ambientes)
  const candidates = [
    url,
    'https://dummyjson.com/quotes/1',
    'https://dummyjson.com/products/1',
    'https://jsonplaceholder.typicode.com/todos/1',
    'https://api.ipify.org?format=json',
  ]
  const results: number[] = []
  for (let i = 0; i < count; i++) {
    let attemptOk = false
    for (const candidate of candidates) {
      const controller = new AbortController()
      const t0 = performance.now()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const resp = await fetch(`${candidate}?t=${Math.random()}`, { cache: 'no-store', signal: controller.signal })
        // Consideramos o tempo até resposta, independente do corpo
        const t1 = performance.now()
        results.push(t1 - t0)
        clearTimeout(timer)
        attemptOk = true
        break
      } catch (e) {
        clearTimeout(timer)
        console.warn(`Ping failed for ${candidate}`, e)
        continue
      }
    }
    if (!attemptOk) throw new Error('Todas as tentativas de ping falharam.')
  }
  if (results.length === 0) throw new Error('Nenhuma amostra de latência foi coletada.')
  return calcStats(results)
}

async function measureDownload(urls: string[], timeoutMs = 12000) {
  // Baixa fluxos de bytes em paralelo e contabiliza o total lido
  const t0 = performance.now()
  let totalBytes = 0
  await Promise.all(
    urls.map(async (url) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        // Usar o serviço local para criar o stream de download
        const resp = createDownloadStream(5); // Gera 5MB de dados
        if (!resp.body) return;
        const reader = resp.body.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          totalBytes += value.byteLength;
        }
      } catch (e) {
        console.error(`Download stream failed for ${url}`, e);
        // Lança o erro para ser pego pelo Promise.all e depois pelo catch principal
        throw e;
      } finally {
        clearTimeout(timer);
      }
    })
  );
  const seconds = Math.max((performance.now() - t0) / 1000, 0.001)
  if (totalBytes === 0) throw new Error('A medição de download não transferiu dados.')
  const mbps = (totalBytes * 8) / seconds / 1_000_000
  return { totalBytes, seconds, mbps }
}

async function measureUpload(attempts = 3, sizeMB = 2, timeoutMs = 8000) {
  let totalBytes = 0
  const t0 = performance.now()
  for (let i = 0; i < attempts; i++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const size = Math.max(1, sizeMB) * 1024 * 1024
      const payload = new Uint8Array(size)
      crypto.getRandomValues(payload)
      const resp = await fetch('https://postman-echo.com/post', {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/octet-stream' },
        cache: 'no-store',
        signal: controller.signal,
      })
      if (resp.ok) totalBytes += size
      else throw new Error(`Server responded with status ${resp.status}`)
    } catch (e) {
      console.error(`Upload attempt ${i + 1} failed`, e)
      // Não relança para permitir outras tentativas, mas se todas falharem, o totalBytes será 0
    } finally {
      clearTimeout(timer)
    }
  }
  const t1 = performance.now()
  const seconds = Math.max((t1 - t0) / 1000, 0.001)
  if (totalBytes === 0) throw new Error('A medição de upload não transferiu dados.')
  const mbps = (totalBytes * 8) / seconds / 1_000_000
  return { totalBytes, seconds, mbps }
}

function angleForSpeed(speed: number, max: number) {
  // Map speed [0..max] to dial angle [-120..+120]
  const clamped = Math.max(0, Math.min(max, speed))
  return -120 + (clamped / max) * 240
}

function GaugeDial({ value = 0, max = 1000, color = '#00e0ff' }: { value?: number; max?: number; color?: string }) {
  const angle = angleForSpeed(value, max)
  const ticks = [0, 5, 10, 50, 100, 250, 500, 1000]
  const theme = useTheme()
  const arcColor = alpha(theme.palette.text.primary, 0.18)
  const tickColor = alpha(theme.palette.text.primary, 0.38)
  const labelColor = theme.palette.text.secondary
  return (
    <Box sx={{ position: 'relative', width: 320, height: 240 }}>
      <svg width={320} height={240} viewBox="0 0 320 240">
        {/* Arc background */}
        <path d="M40,200 A120,120 0 1,1 280,200" fill="none" stroke={arcColor} strokeWidth={20} />
        {/* Pointer */}
        <g transform={`translate(160,200)`}>
          <motion.line
            x1={0}
            y1={0}
            x2={0}
            y2={-100}
            stroke={color}
            strokeWidth={6}
            strokeLinecap="round"
            animate={{ rotate: angle }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
          <circle cx={0} cy={0} r={8} fill={color} />
        </g>
        {/* Ticks */}
        {ticks.map(t => {
          const a = angleForSpeed(t, max)
          const rad = (a - 90) * Math.PI / 180
          const x1 = 160 + Math.cos(rad) * 100
          const y1 = 200 + Math.sin(rad) * 100
          const x2 = 160 + Math.cos(rad) * 120
          const y2 = 200 + Math.sin(rad) * 120
          return (
            <g key={t}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={tickColor} strokeWidth={2} />
              <text x={160 + Math.cos(rad) * 135} y={200 + Math.sin(rad) * 135} fill={labelColor} fontSize={12} textAnchor="middle" dominantBaseline="central">{t}</text>
            </g>
          )
        })}
      </svg>
      <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h3" fontWeight={900} sx={{ color }}>{value.toFixed(2)}</Typography>
        <Typography variant="h6" sx={{ ml: 1, color: labelColor }}>Mbps</Typography>
      </Box>
    </Box>
  )
}

export default function SpeedTest() {
  const [latencySamples, setLatencySamples] = useState(8)
  const [downloadAttempts, setDownloadAttempts] = useState(4)
  const [running, setRunning] = useState(false)
  const [latency, setLatency] = useState<{ avg: number; min: number; max: number; jitter: number } | null>(null)
  const [download, setDownload] = useState<{ totalBytes: number; seconds: number; mbps: number } | null>(null)
  const [upload, setUpload] = useState<{ totalBytes: number; seconds: number; mbps: number } | null>(null)
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'warning' | 'error' }>({ open: false, message: '', severity: 'success' })
  const [ip, setIp] = useState<string>('—')
  const [serverIdx, setServerIdx] = useState(0)
  const [phase, setPhase] = useState<'idle' | 'ping' | 'download' | 'upload' | 'done'>('idle')
  const [gaugeSpeed, setGaugeSpeed] = useState(0)
  const theme = useTheme()

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json')
        const data = await res.json()
        setIp(data?.ip || '—')
      } catch { setIp('—') }
    })()
  }, [])

  const servers = [
    { name: 'Micks Fibra', location: 'Guanambi', pingUrl: 'https://dummyjson.com/quotes/1', dlUrl: 'https://httpbin.org/stream-bytes/5242880' },
    { name: 'Global', location: 'CDN', pingUrl: 'https://jsonplaceholder.typicode.com/todos/1', dlUrl: 'https://httpbin.org/stream-bytes/10485760' },
  ]
  const currentServer = servers[serverIdx % servers.length]

  const animateGaugeTo = (target: number, colorPhase: 'download' | 'upload') => {
    // Smooth animate gauge value toward target
    const durationMs = 1500
    const steps = 30
    const stepVal = (target - gaugeSpeed) / steps
    const color = colorPhase === 'download' ? '#00e0ff' : '#c951ff'
    let i = 0
    const id = setInterval(() => {
      i++
      setGaugeSpeed(prev => prev + stepVal)
      if (i >= steps) {
        clearInterval(id)
        setGaugeSpeed(target)
      }
    }, durationMs / steps)
    return color
  }

  const startTest = async () => {
    setRunning(true)
    setPhase('ping')
    setLatency(null)
    setDownload(null)
    setUpload(null)
    setGaugeSpeed(0)

    try {
      const latencyStats = await measureLatency(currentServer.pingUrl, latencySamples, 3000)
      setLatency(latencyStats)
    } catch (e: any) {
      console.error('Latency test failed:', e)
      setSnack({ open: true, message: `Falha no Ping: ${e.message}`, severity: 'error' })
      setPhase('idle')
      setRunning(false)
      return
    }

    try {
      setPhase('download')
      const urls = Array.from({ length: downloadAttempts }, () => currentServer.dlUrl)
      const downloadStats = await measureDownload(urls, 8000)
      setDownload(downloadStats)
      animateGaugeTo(downloadStats.mbps, 'download')
    } catch (e: any) {
      console.error('Download test failed:', e)
      setSnack({ open: true, message: `Falha no Download: ${e.message}`, severity: 'error' })
      setPhase('idle')
      setRunning(false)
      return
    }

    try {
      setPhase('upload')
      const uploadStats = await measureUpload(2, 2, 8000)
      setUpload(uploadStats)
      animateGaugeTo(uploadStats.mbps, 'upload')
    } catch (e: any) {
      console.error('Upload test failed:', e)
      setSnack({ open: true, message: `Falha no Upload: ${e.message}`, severity: 'error' })
      setPhase('idle')
      setRunning(false)
      return
    }

    setPhase('done')
    setSnack({ open: true, message: 'Teste concluído', severity: 'success' })
    setRunning(false)
  }

  const formatMbps = (v?: number) => (v && isFinite(v) ? v.toFixed(2) : '—')
  const formatMs = (v?: number) => (v && isFinite(v) ? `${v.toFixed(0)}` : '—')
  const formatBytes = (b?: number) => {
    if (!b || !isFinite(b)) return '—'
    if (b < 1024) return `${b} B`
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
    return `${(b / (1024 * 1024)).toFixed(2)} MB`
  }

  const isRunningOrDone = phase !== 'idle'
  const gaugeColor = phase === 'upload' ? theme.palette.primary.main : theme.palette.secondary.main

  return (
    <Stack spacing={2} sx={{ p: 2 }}>
      <Paper elevation={0} sx={{ p: 2, bgcolor: 'transparent', borderRadius: 0 }}>
        {/* Top pseudo-nav */}
        <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
          <Typography sx={{ color: 'text.primary', fontWeight: 700 }}>RESULTADOS</Typography>
          <Typography sx={{ color: 'text.primary', fontWeight: 700 }}>CONFIGURAÇÕES</Typography>
        </Stack>

        {/* Center start button or gauge */}
        {!isRunningOrDone ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
            <motion.div initial={{ scale: 0.98 }} animate={{ scale: 1 }} transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.8 }}>
              <Button
                onClick={startTest}
                disabled={running}
                sx={{
                  width: 220,
                  height: 220,
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: (theme) => theme.palette.mode === 'light' ? alpha(theme.palette.secondary.main, 0.06) : alpha(theme.palette.secondary.main, 0.12),
                  color: 'text.primary',
                  fontSize: 28,
                  fontWeight: 900,
                  '&:hover': {
                    backgroundColor: (theme) => theme.palette.mode === 'light' ? alpha(theme.palette.secondary.main, 0.1) : alpha(theme.palette.secondary.main, 0.18),
                  },
                }}
              >INICIAR</Button>
            </motion.div>
          </Box>
        ) : (
          <Stack spacing={3}>
            <Stack direction="row" spacing={4} alignItems="center" justifyContent="space-between" sx={{ flexWrap: 'wrap' }}>
              <Stack>
                <Typography sx={{ color: 'text.secondary' }}>DOWNLOAD Mbps</Typography>
                <Typography variant="h4" fontWeight={900} sx={{ color: (theme) => theme.palette.secondary.main }}>{formatMbps(download?.mbps)}</Typography>
              </Stack>
              <Stack>
                <Typography sx={{ color: 'text.secondary' }}>UPLOAD Mbps</Typography>
                <Typography variant="h4" fontWeight={900} sx={{ color: (theme) => theme.palette.primary.main }}>{formatMbps(upload?.mbps)}</Typography>
              </Stack>
              <Stack>
                <Typography sx={{ color: 'text.secondary' }}>Ping ms</Typography>
                <Stack direction="row" spacing={1}>
                  <Chip label={`${formatMs(latency?.avg)}`} variant="outlined" sx={{ color: 'text.secondary' }} />
                  <Chip label={`${formatMs(latency?.min)}`} variant="outlined" sx={{ color: 'text.secondary' }} />
                  <Chip label={`${formatMs(latency?.jitter)}`} variant="outlined" sx={{ color: 'text.secondary' }} />
                </Stack>
              </Stack>
            </Stack>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <GaugeDial value={gaugeSpeed} max={1000} color={gaugeColor} />
            </Box>
          </Stack>
        )}

        {/* Provider & server section */}
        <Stack direction="row" spacing={6} sx={{ mt: 4, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Stack alignItems="center" sx={{ minWidth: 200 }}>
            <Typography sx={{ color: 'text.secondary' }}>Seu Provedor</Typography>
            <Typography fontWeight={700}>IP Público</Typography>
            <Typography sx={{ color: 'text.secondary' }}>{ip}</Typography>
          </Stack>
          <Stack alignItems="center" sx={{ minWidth: 200 }}>
            <Typography sx={{ color: 'text.secondary' }}>{currentServer.name}</Typography>
            <Typography fontWeight={700}>{currentServer.location}</Typography>
            <Button variant="text" sx={{ color: (theme) => theme.palette.primary.main }} onClick={() => setServerIdx((i) => i + 1)}>Mudar de Servidor</Button>
          </Stack>
        </Stack>

        {/* Controls panel */}
        <Stack spacing={2} sx={{ mt: 4 }}>
          <Alert icon={false} sx={{ bgcolor: (theme) => alpha(theme.palette.text.primary, 0.06), color: 'text.secondary' }}>
            Este teste roda no navegador e pode subestimar/variar devido a caches, CORS e políticas de rede. Para upload usamos POST com payload aleatório em um endpoint de eco (postman-echo).
          </Alert>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Amostras de Latência"
              type="number"
              value={latencySamples}
              onChange={(e) => setLatencySamples(Math.max(1, Number(e.target.value) || 1))}
              inputProps={{ min: 1 }}
              sx={{ maxWidth: 220 }}
            />
            <TextField
              label="Tentativas de Download"
              type="number"
              value={downloadAttempts}
              onChange={(e) => setDownloadAttempts(Math.max(1, Number(e.target.value) || 1))}
              inputProps={{ min: 1 }}
              sx={{ maxWidth: 220 }}
            />
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" onClick={startTest} disabled={running || phase !== 'idle'}>Iniciar teste</Button>
          </Stack>
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