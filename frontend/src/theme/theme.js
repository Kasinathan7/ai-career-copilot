// file: frontend/src/theme/theme.js
import { alpha } from '@mui/material/styles';

const getAppTheme = (mode = 'dark') => {
  const isDark = mode === 'dark';

  return {
    palette: {
      mode,

      primary: {
        main: '#4F8CFF',
        light: '#7AA7FF',
        dark: '#2B5FD9',
        contrastText: '#FFFFFF'
      },

      secondary: {
        main: '#22D3EE',
        light: '#67E8F9',
        dark: '#0891B2',
        contrastText: '#0B1220'
      },

      success: { main: '#22C55E' },
      warning: { main: '#F59E0B' },
      error: { main: '#EF4444' },
      info: { main: '#38BDF8' },

      background: isDark
        ? {
            default: '#0B1020',
            paper: '#11172A'
          }
        : {
            default: '#F6F8FB',
            paper: '#FFFFFF'
          },

      text: isDark
        ? {
            primary: '#E6EBF5',
            secondary: '#9AA4BF',
            disabled: '#6B7280'
          }
        : {
            primary: '#0F172A',
            secondary: '#475569',
            disabled: '#9CA3AF'
          },

      divider: isDark
        ? 'rgba(255,255,255,0.06)'
        : 'rgba(15,23,42,0.08)',

      action: {
        hover: isDark
          ? 'rgba(255,255,255,0.05)'
          : 'rgba(79,140,255,0.08)',
        selected: isDark
          ? 'rgba(79,140,255,0.18)'
          : 'rgba(79,140,255,0.15)'
      }
    },

    shape: {
      borderRadius: 12
    },

    typography: {
      fontFamily: [
        'Inter',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        'Arial',
        'sans-serif'
      ].join(','),
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: 'none' }
    },

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            background: isDark
              ? 'radial-gradient(1200px 600px at 10% -10%, #1A2450 0%, #0B1020 40%)'
              : '#F6F8FB',
            scrollbarWidth: 'thin',
            scrollbarColor: isDark
              ? '#2A3566 #0B1020'
              : '#CBD5E1 #F6F8FB'
          }
        }
      },

      MuiAppBar: {
        styleOverrides: {
          root: {
            background: isDark
              ? 'linear-gradient(135deg, #0E1530 0%, #111B3D 100%)'
              : '#FFFFFF',
            borderBottom: isDark
              ? '1px solid rgba(255,255,255,0.06)'
              : '1px solid rgba(15,23,42,0.08)',
            boxShadow: 'none'
          }
        }
      },

      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: isDark ? '#11172A' : '#FFFFFF',
            border: isDark
              ? '1px solid rgba(255,255,255,0.06)'
              : '1px solid rgba(15,23,42,0.08)'
          }
        }
      },

      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            fontWeight: 600
          },
          contained: {
            background: 'linear-gradient(135deg, #4F8CFF 0%, #2563EB 100%)',
            boxShadow: 'none',
            '&:hover': {
              background: 'linear-gradient(135deg, #6EA0FF 0%, #3B82F6 100%)',
              boxShadow: 'none'
            }
          },
          outlined: {
            borderColor: isDark
              ? 'rgba(255,255,255,0.18)'
              : 'rgba(79,140,255,0.4)',
            color: isDark ? '#E6EBF5' : '#2563EB'
          }
        }
      },

      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: isDark
              ? 'rgba(79,140,255,0.12)'
              : 'rgba(79,140,255,0.08)',
            border: isDark
              ? '1px solid rgba(79,140,255,0.25)'
              : '1px solid rgba(79,140,255,0.3)'
          }
        }
      },

      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            background: isDark
              ? 'linear-gradient(180deg, #121A33 0%, #0F152B 100%)'
              : '#FFFFFF',
            border: isDark
              ? '1px solid rgba(255,255,255,0.06)'
              : '1px solid rgba(15,23,42,0.08)'
          }
        }
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            backgroundColor: isDark
              ? 'rgba(255,255,255,0.03)'
              : '#FFFFFF',
            '& fieldset': {
              borderColor: isDark
                ? 'rgba(255,255,255,0.12)'
                : 'rgba(15,23,42,0.15)'
            },
            '&:hover fieldset': {
              borderColor: '#4F8CFF'
            },
            '&.Mui-focused fieldset': {
              borderColor: '#4F8CFF',
              borderWidth: 2
            }
          }
        }
      },

      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isDark
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(15,23,42,0.08)'
          }
        }
      }
    }
  };
};

export default getAppTheme;
