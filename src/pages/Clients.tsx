import { useEffect, useMemo, useState } from 'react'
import { Alert, Box, Button, IconButton, Paper, Snackbar, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import AddBusinessIcon from '@mui/icons-material/AddBusiness'
import CleaningServicesIcon from '@mui/icons-material/CleaningServices'
import SearchIcon from '@mui/icons-material/Search'
import { useNavigate } from 'react-router-dom'

function maskCNPJ(input: any) {
  const digits = String(input ?? '').replace(/\D/g, '').slice(0, 14)
  if (digits.length !== 14) return digits
  return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8,12)}-${digits.slice(12)}`
}

export default function Clients() {
  const [clients, setClients] = useState<any[]>([])
  const [filter, setFilter] = useState('')
  const [snack, setSnack] = useState<{ open: boolean, message: string, severity: 'success' | 'warning' | 'error' }>({ open: false, message: '', severity: 'success' })
  const navigate = useNavigate()

  useEffect(() => {
    try {
      const raw = localStorage.getItem('clients')
      const list = JSON.parse(raw || '[]')
      setClients(Array.isArray(list) ? list : [])
    } catch {
      setClients([])
    }
  }, [])

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return clients
    return clients.filter((c) =>
      String(c?.nome || '').toLowerCase().includes(q) ||
      String(c?.fantasia || '').toLowerCase().includes(q) ||
      String(c?.cnpj || '').toLowerCase().includes(q)
    )
  }, [clients, filter])

  const removeClient = (cnpj: string) => {
    const next = clients.filter((c) => String(c?.cnpj) !== String(cnpj))
    setClients(next)
    localStorage.setItem('clients', JSON.stringify(next))
    setSnack({ open: true, message: 'Cliente removido.', severity: 'success' })
  }

  const clearAll = () => {
    setClients([])
    localStorage.setItem('clients', JSON.stringify([]))
    setSnack({ open: true, message: 'Lista de clientes limpa.', severity: 'success' })
  }

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
          <Stack>
            <Typography variant="h6" fontWeight={700}>Clientes</Typography>
            <Typography variant="body2" color="text.secondary">Lista dos clientes cadastrados a partir da consulta de CNPJ.</Typography>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" startIcon={<AddBusinessIcon />} onClick={() => navigate('/cnpj')}>Consultar CNPJ</Button>
            <Button variant="outlined" color="warning" startIcon={<CleaningServicesIcon />} onClick={clearAll} disabled={!clients.length}>Limpar lista</Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            label="Buscar"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Nome, fantasia ou CNPJ"
            InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1 }} /> }}
            fullWidth
          />
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        {filtered.length === 0 ? (
          <Typography variant="body2" color="text.secondary">Nenhum cliente encontrado.</Typography>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>CNPJ</TableCell>
                <TableCell>Razão Social</TableCell>
                <TableCell>Fantasia</TableCell>
                <TableCell>IE</TableCell>
                <TableCell>Regime</TableCell>
                <TableCell>Situação</TableCell>
                <TableCell>Município/UF</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.cnpj} hover>
                  <TableCell>{maskCNPJ(c.cnpj)}</TableCell>
                  <TableCell>{c.nome}</TableCell>
                  <TableCell>{c.fantasia}</TableCell>
                  <TableCell>{c.inscricaoEstadual || '-'}</TableCell>
                  <TableCell>{c.regimeTributario || '-'}</TableCell>
                  <TableCell>{c.situacao || '-'}</TableCell>
                  <TableCell>{`${c.municipio || ''}/${c.uf || ''}`}</TableCell>
                  <TableCell align="right">
                    <IconButton color="error" size="small" onClick={() => removeClient(c.cnpj)}>
                      <DeleteOutlineIcon />
                    </IconButton>
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