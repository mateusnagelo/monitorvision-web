import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Chip, Paper, Snackbar, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import CleaningServicesIcon from '@mui/icons-material/CleaningServices'
import SearchIcon from '@mui/icons-material/Search'
import { useConfig } from '../context/ConfigContext'
import { initFirebase, getFirebase, clearLogsFromFirestore } from '../services/firebase'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'

function formatDateTime(iso?: string) {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
  } catch { return iso || '-' }
}

export default function Logs() {
  const { config } = useConfig()
  const [logs, setLogs] = useState<any[]>([])
  const [filter, setFilter] = useState('')
  const [snack, setSnack] = useState<{ open: boolean, message: string, severity: 'success' | 'warning' | 'error' }>({ open: false, message: '', severity: 'success' })

  useEffect(() => {
    if (config.firebaseEnabled && (config.firebaseConfig as any)?.apiKey) {
      try { getFirebase() } catch { initFirebase(config.firebaseConfig as any) }
      const { db } = getFirebase()
      const q = query(collection(db!, 'logs'), orderBy('createdAt', 'desc'))
      const unsub = onSnapshot(q, (snap) => {
        const list: any[] = []
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }))
        setLogs(list)
      }, () => {
        // Fallback para localStorage em caso de erro
        try {
          const raw = localStorage.getItem('monitorVision.logs')
          const list = JSON.parse(raw || '[]')
          setLogs(Array.isArray(list) ? list.reverse() : [])
        } catch {
          setLogs([])
        }
      })
      return () => unsub()
    }

    // Fallback localStorage
    try {
      const raw = localStorage.getItem('monitorVision.logs')
      const list = JSON.parse(raw || '[]')
      setLogs(Array.isArray(list) ? list.reverse() : [])
    } catch {
      setLogs([])
    }
  }, [config.firebaseEnabled])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return logs
    return logs.filter((l) =>
      String(l?.cnpj || '').toLowerCase().includes(q) ||
      String(l?.empresa || '').toLowerCase().includes(q) ||
      String(l?.computer || '').toLowerCase().includes(q) ||
      String(l?.ip || '').toLowerCase().includes(q)
    )
  }, [logs, filter])

  const clearAll = () => {
    if (config.firebaseEnabled && (config.firebaseConfig as any)?.apiKey) {
      try { getFirebase() } catch { initFirebase(config.firebaseConfig as any) }
      clearLogsFromFirestore()
        .then(() => setSnack({ open: true, message: 'Logs limpos.', severity: 'success' }))
        .catch(() => setSnack({ open: true, message: 'Falha ao limpar logs no Firebase.', severity: 'error' }))
      return
    }
    localStorage.setItem('monitorVision.logs', JSON.stringify([]))
    setLogs([])
    setSnack({ open: true, message: 'Logs limpos.', severity: 'success' })
  }

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
          <Stack>
            <Typography variant="h6" fontWeight={700}>Logs</Typography>
            <Typography variant="body2" color="text.secondary">Registro de consultas de CNPJ com nome do computador, IP e data/hora.</Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" color="warning" startIcon={<CleaningServicesIcon />} onClick={clearAll} disabled={!logs.length}>Limpar logs</Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="Buscar"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="CNPJ, empresa, computador ou IP"
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
            fullWidth
          />
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        {filtered.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Nenhum log encontrado.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data/Hora</TableCell>
                <TableCell>CNPJ</TableCell>
                <TableCell>Empresa</TableCell>
                <TableCell>Computador</TableCell>
                <TableCell>IP</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((l: any) => (
                <TableRow key={l.id || `${l.timestamp}-${l.cnpj}`}>
                  <TableCell>{formatDateTime(l.timestamp)}</TableCell>
                  <TableCell>{l.cnpj}</TableCell>
                  <TableCell>{l.empresa || '-'}</TableCell>
                  <TableCell>{l.computer || '-'}</TableCell>
                  <TableCell>{l.ip || '-'}</TableCell>
                  <TableCell>
                    <Chip label={l.success ? 'SUCESSO' : 'ERRO'} color={l.success ? 'success' : 'error'} size="small" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Snackbar
        open={snack.open}
        autoHideDuration={2500}
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