export interface Theme {
  id: string
  name: string
  bg: string
  surface: string
  input: string
  border: string
  icon: string
  muted: string
  text2: string
  text: string
  accent: string
  accentH: string
  accentB: string
  accentT: string
  glow: string  // full rgba string for box-shadow glow
}

export const THEMES: Theme[] = [
  {
    id: 'midnight',
    name: 'Midnight Blue',
    bg: '#080c18', surface: '#0d1225', input: '#121930',
    border: '#1f2d52', icon: '#2d4080', muted: '#3a4d7a',
    text2: '#7b92c8', text: '#ffffff',
    accent: '#4d7cfe', accentH: '#7aa0ff', accentB: '#0a1a45', accentT: '#93b4ff',
    glow: 'rgba(77,124,254,0.35)',
  },
  {
    id: 'deepspace',
    name: 'Deep Space',
    bg: '#030509', surface: '#07090f', input: '#0c1018',
    border: '#131c2e', icon: '#1e2c44', muted: '#2e4060',
    text2: '#5070a0', text: '#ffffff',
    accent: '#00ccff', accentH: '#40dcff', accentB: '#001c28', accentT: '#60d8ff',
    glow: 'rgba(0,204,255,0.3)',
  },
  {
    id: 'forest',
    name: 'Forest',
    bg: '#060d09', surface: '#0a1410', input: '#0f1c14',
    border: '#1a2e20', icon: '#263e2e', muted: '#3a5840',
    text2: '#6a9070', text: '#ffffff',
    accent: '#2ed880', accentH: '#5ee898', accentB: '#082818', accentT: '#70e8a0',
    glow: 'rgba(46,216,128,0.3)',
  },
  {
    id: 'crimson',
    name: 'Crimson',
    bg: '#0d0608', surface: '#140a0c', input: '#1c0e12',
    border: '#35161e', icon: '#4a2030', muted: '#663040',
    text2: '#9a6070', text: '#ffffff',
    accent: '#e0305a', accentH: '#f05070', accentB: '#280818', accentT: '#f08090',
    glow: 'rgba(224,48,90,0.35)',
  },
  {
    id: 'graphite',
    name: 'Graphite',
    bg: '#0a0a0a', surface: '#121214', input: '#1a1a1e',
    border: '#2a2a2e', icon: '#3c3c44', muted: '#545460',
    text2: '#808090', text: '#ffffff',
    accent: '#f5a623', accentH: '#f8c060', accentB: '#1e1400', accentT: '#f8c060',
    glow: 'rgba(245,166,35,0.35)',
  },
]

export function applyTheme(theme: Theme): void {
  const r = document.documentElement.style
  r.setProperty('--bg',       theme.bg)
  r.setProperty('--surface',  theme.surface)
  r.setProperty('--input',    theme.input)
  r.setProperty('--border',   theme.border)
  r.setProperty('--icon',     theme.icon)
  r.setProperty('--muted',    theme.muted)
  r.setProperty('--text2',    theme.text2)
  r.setProperty('--text',     theme.text)
  r.setProperty('--accent',   theme.accent)
  r.setProperty('--accent-h', theme.accentH)
  r.setProperty('--accent-b', theme.accentB)
  r.setProperty('--accent-t', theme.accentT)
  r.setProperty('--glow',     theme.glow)
}
