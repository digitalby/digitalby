import path from 'path';
import { SizeConfig, ThemeConfig, Size, Theme, Layout } from './types';

export const SIZE_CONFIGS: Record<Size, SizeConfig> = {
  xs: { name: 'xs', height: 20, gap: 16, padding: 16, labelFontSize: 9, gridColumns: 7 },
  sm: { name: 'sm', height: 30, gap: 24, padding: 20, labelFontSize: 10, gridColumns: 7 },
  md: { name: 'md', height: 45, gap: 32, padding: 24, labelFontSize: 12, gridColumns: 5 },
  lg: { name: 'lg', height: 60, gap: 40, padding: 32, labelFontSize: 14, gridColumns: 4 },
  xl: { name: 'xl', height: 80, gap: 48, padding: 40, labelFontSize: 16, gridColumns: 3 },
};

export const THEME_CONFIGS: Record<Theme, ThemeConfig> = {
  light:       { name: 'light',       background: '#ffffff', labelColor: '#6b7280' },
  dark:        { name: 'dark',        background: '#111827', labelColor: '#9ca3af' },
  transparent: { name: 'transparent', background: 'transparent', labelColor: '#6b7280' },
};

export const DISPLAY_NAMES: Record<string, string> = {
  amazon:          'Amazon',
  bawag:           'BAWAG',
  ebay:            'eBay',
  eu:              'European Union',
  justeattakeaway: 'Just Eat Takeaway',
  lastminute:      'lastminute.com',
  papajohns:       "Papa John's",
  revolut:         'Revolut',
  ryanair:         'Ryanair',
  santander:       'Santander',
  temu:            'Temu',
  unicredit:       'UniCredit',
  velobank:        'VeloBank',
  xbox:            'Xbox',
};

export const DEFAULT_SIZES: Size[]   = ['xs', 'sm', 'md', 'lg', 'xl'];
export const DEFAULT_THEMES: Theme[] = ['light', 'dark', 'transparent'];
export const DEFAULT_LAYOUTS: Layout[] = ['inline', 'grid', 'compact'];

export const GENERATOR_VERSION = '1.0.0';

// Backgrounds used for WCAG contrast analysis
export const ANALYSIS_BACKGROUNDS = {
  white:     '#ffffff',
  black:     '#000000',
  darkGray:  '#1a1a1a',
  lightGray: '#f5f5f5',
} as const;

export function resolveOutputPaths(outputDir: string): {
  testimonials: string;
  reports: string;
  snippets: string;
} {
  return {
    testimonials: path.join(outputDir, 'testimonials'),
    reports:      path.join(outputDir, 'reports'),
    snippets:     path.join(outputDir, 'snippets'),
  };
}
