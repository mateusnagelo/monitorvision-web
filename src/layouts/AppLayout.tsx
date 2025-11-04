import React, { useMemo } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
  TextField,
  InputAdornment,
  Avatar,
  Tooltip,
  Alert,
  Button,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import TableChart from '@mui/icons-material/TableChart'
import CodeIcon from '@mui/icons-material/Code'
import Business from '@mui/icons-material/Business'
import People from '@mui/icons-material/People'
import SettingsIcon from '@mui/icons-material/Settings'
import ListAlt from '@mui/icons-material/ListAlt'
import SearchIcon from '@mui/icons-material/Search'
import Brightness4 from '@mui/icons-material/Brightness4'
import Brightness7 from '@mui/icons-material/Brightness7'

const drawerWidth = 280

// Error boundary para evitar tela preta em caso de erro de renderização
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: any }> {
  state = { error: null as any }
  static getDerivedStateFromError(error: any) {
    return { error }
  }
  componentDidCatch(error: any, info: any) {
    console.error('[UI ErrorBoundary] caught error:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            Ocorreu um erro ao renderizar esta página: {String(this.state.error?.message || this.state.error)}
          </Alert>
          <Button variant="outlined" onClick={() => this.setState({ error: null })}>Tentar novamente</Button>
        </Box>
      )
    }
    return this.props.children as any
  }
}

type AppLayoutProps = {
  mode: 'light' | 'dark'
  onToggleMode: () => void
}

export default function AppLayout({ mode, onToggleMode }: AppLayoutProps) {
  const { pathname } = useLocation()

  const navItems = useMemo(
    () => [
      { to: '/', label: 'Dashboard', icon: <DashboardIcon /> },
      { to: '/ibptax', label: 'Tabela IBPTax', icon: <TableChart /> },
      { to: '/xml', label: 'Validação XML', icon: <CodeIcon /> },
      { to: '/cnpj', label: 'Consulta CNPJ', icon: <Business /> },
      { to: '/cosmos', label: 'Consulta Cosmos', icon: <TableChart /> },
      { to: '/clientes', label: 'Clientes', icon: <People /> },
      { to: '/config', label: 'Configurações', icon: <SettingsIcon /> },
      { to: '/logs', label: 'Logs', icon: <ListAlt /> },
    ],
    [],
  )

  const isSelected = (to: string) => {
    if (to === '/') return pathname === '/'
    return pathname.startsWith(to)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          ml: `${drawerWidth}px`,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundImage:
            mode === 'light'
              ? 'linear-gradient(90deg, #1976d2 0%, #00bcd4 100%)'
              : 'linear-gradient(90deg, #111827 0%, #0b1324 100%)',
        }}
      >
        <Toolbar>
          <Avatar sx={{ mr: 1, bgcolor: 'background.paper', color: 'text.primary' }}>MV</Avatar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Monitor Vision App
          </Typography>
          <Tooltip title={mode === 'light' ? 'Tema escuro' : 'Tema claro'}>
            <IconButton color="inherit" onClick={onToggleMode}>
              {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: 'none',
            bgcolor: 'background.paper',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Pesquisar"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        <Divider />
        <List sx={{ px: 1 }}>
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} style={{ textDecoration: 'none', color: 'inherit' }} end>
              <ListItemButton selected={isSelected(item.to)} sx={{ borderRadius: 2, mb: 0.5 }}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </NavLink>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: `${drawerWidth}px` }}>
        <Toolbar />
        {/* Envolve o conteúdo principal com o ErrorBoundary para capturar erros */}
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </Box>
    </Box>
  )
}