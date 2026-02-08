// file: frontend/src/App.jsx
import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { CssBaseline, Box, Typography, Container, AppBar, Toolbar, IconButton, Tooltip, useMediaQuery, Paper } from '@mui/material'
import { LightMode, DarkMode } from '@mui/icons-material'
import { Toaster } from 'react-hot-toast'
import BotRouter from './components/BotRouter'
import getAppTheme from './theme/theme'

function App() {
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)')
  const [mode, setMode] = React.useState(() => localStorage.getItem('themeMode') || (prefersDark ? 'dark' : 'light'))
  const theme = React.useMemo(() => createTheme(getAppTheme(mode)), [mode])

  const toggleMode = () => {
    const next = mode === 'light' ? 'dark' : 'light'
    setMode(next)
    localStorage.setItem('themeMode', next)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: theme.palette.mode === 'dark' ? '#1e293b' : '#fff',
            color: theme.palette.mode === 'dark' ? '#fff' : '#000',
          },
          success: {
            iconTheme: {
              primary: theme.palette.success.main,
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: theme.palette.error.main,
              secondary: '#fff',
            },
          },
        }}
      />
      <Router>
        <AppBar
          position="sticky"
          color="default"
          elevation={0}
          sx={{
            background: (t) => t.palette.background.paper,
            borderBottom: '1px solid',
            borderColor: 'divider',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Toolbar sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  background: (t) =>
                    `linear-gradient(135deg, ${t.palette.primary.main} 0%, ${t.palette.primary.dark} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '1rem',
                  boxShadow: '0 2px 8px rgba(120, 134, 107, 0.2)',
                }}
              >
                A
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  letterSpacing: -0.5,
                  fontSize: '1rem',
                  color: 'text.primary',
                }}
              >
                AI Resume Assistant
              </Typography>
              {/* "Coding Practice" label intentionally removed */}
            </Box>

            <Tooltip title={mode === 'light' ? 'Dark mode' : 'Light mode'}>
              <IconButton
                color="inherit"
                onClick={toggleMode}
                size="small"
                sx={{
                  opacity: 0.8,
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  width: 36,
                  height: 36,
                  '&:hover': {
                    opacity: 1,
                    backgroundColor: (t) =>
                      t.palette.mode === 'dark'
                        ? 'rgba(161, 181, 163, 0.08)'
                        : 'rgba(120, 134, 107, 0.08)',
                  },
                }}
              >
                {mode === 'light' ? <DarkMode fontSize="small" /> : <LightMode fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Box
          sx={{
            minHeight: 'calc(100vh - 72px)',
            display: 'flex',
            alignItems: 'flex-start',
            py: { xs: 3, md: 4 },
          }}
        >
          <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: '1.875rem', sm: '2.25rem', md: '2.5rem' },
                  letterSpacing: -1,
                  mb: 1,
                  background: (t) =>
                    t.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, #f5f5f4 0%, #a1b5a3 100%)'
                      : 'linear-gradient(135deg, #0a0a0a 0%, #78866b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Your AI Career Partner
              </Typography>
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{
                  fontSize: { xs: '0.9375rem', md: '1rem' },
                  maxWidth: '42rem',
                  lineHeight: 1.65,
                }}
              >
                Build standout resumes, ace interviews, and find your next role faster with AI-powered tools.
              </Typography>
            </Box>

            <Paper
              elevation={0}
              sx={{
                height: { xs: '68vh', md: '72vh' },
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                background: (t) => t.palette.background.paper,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: (t) =>
                  t.palette.mode === 'dark'
                    ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                    : '0 2px 8px rgba(0, 0, 0, 0.06)',
              }}
            >
              <BotRouter />
            </Paper>
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  )
}

export default App
