import { Route, Routes, useLocation } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import Dashboard from './pages/Dashboard'
import IBPTax from './pages/IBPTax'
import XMLValidation from './pages/XMLValidation'
import CNPJLookup from './pages/CNPJLookup'
import Clients from './pages/Clients'
import Settings from './pages/Settings'
import Logs from './pages/Logs'
import CosmosLookup from './pages/CosmosLookup'
import { useMemo, useState } from 'react'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import SpeedTest from './pages/SpeedTest'
import PortCheck from './pages/PortCheck'
import XMLConverter from './pages/XMLConverter'

export default function App() {
  const location = useLocation()
  const [mode, setMode] = useState<'light' | 'dark'>('light')
  const toggleMode = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'))

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#1976d2' },
          secondary: { main: '#00bcd4' },
          background: {
            default: mode === 'light' ? '#f5f7fb' : '#0b1324',
            paper: mode === 'light' ? '#ffffff' : '#111827',
          },
        },
        shape: { borderRadius: 12 },
      }),
    [mode],
  )

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes location={location}>
        <Route element={<AppLayout mode={mode} onToggleMode={toggleMode} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ibptax" element={<IBPTax />} />
          <Route path="/xml" element={<XMLValidation />} />
          <Route path="/cnpj" element={<CNPJLookup />} />
          <Route path="/speed" element={<SpeedTest />} />
          <Route path="/ports" element={<PortCheck />} />
          <Route path="/xml-converter" element={<XMLConverter />} />

          <Route path="/clientes" element={<Clients />} />
          <Route path="/config" element={<Settings />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/cosmos" element={<CosmosLookup />} />
        </Route>
      </Routes>
    </ThemeProvider>
  )
}