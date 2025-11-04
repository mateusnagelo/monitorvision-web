import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, Chip, Paper, Snackbar, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import CleaningServicesIcon from '@mui/icons-material/CleaningServices'
import SearchIcon from '@mui/icons-material/Search'

function formatDateTime(iso?: string) {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`
  } catch { return iso || '-' }
}

export default function Logs() {
  const [logs, setLogs] = useState<any[]>([])
  const [filter, setFilter] = useState('')
  const [snack, setSnack] = useState<{ open: boolean, message: string, severity: 'success' | 'warning' | 'error' }>({ open: false, message: '', severity: 'success' })

  useEffect(() => {
    try {
      const raw = localStorage.getItem('monitorVision.logs')
      const list = JSON.parse(raw || '[]')
      setLogs(Array.isArray(list) ? list.reverse() : [])
    } catch {
      setLogs([])
    }
  }, [])

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
                <TableCell>Resultado</TableCell>
                <TableCell>Mensagem</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((l, idx) => (
                <TableRow key={`${l.timestamp}-${l.cnpj}-${idx}`} hover>
                  <TableCell>{formatDateTime(l.timestamp)}</TableCell>
                  <TableCell>{l.cnpj}</TableCell>
                  <TableCell>{l.empresa || '-'}</TableCell>
                  <TableCell>{l.computer || '-'}</TableCell>
                  <TableCell>{l.ip || '-'}</TableCell>
                  <TableCell>
                    <Chip label={l.success ? 'Sucesso' : 'Falha'} color={l.success ? 'success' : 'error'} size="small" />
                  </TableCell>
                  <TableCell>{l.error || '-'}</TableCell>
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