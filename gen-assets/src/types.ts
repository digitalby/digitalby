export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type Theme = 'light' | 'dark' | 'transparent';
export type Layout = 'inline' | 'grid' | 'compact';
export type WcagGrade = 'AAA' | 'AA' | 'AA-Large' | 'Fail';

export interface SizeConfig {
  name: Size;
  height: number;
  gap: number;
  padding: number;
  labelFontSize: number;
  gridColumns: number;
}

export interface ThemeConfig {
  name: Theme;
  background: string;
  labelColor: string;
}

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ExtractedColor {
  hex: string;
  source: 'fill' | 'stroke' | 'stop-color' | 'style' | 'css-class';
  elementTag: string;
  frequency: number;
}

export interface LogoAsset {
  name: string;
  displayName: string;
  filePath: string;
  svgContent: string;
  viewBox: ViewBox | null;
  aspectRatio: number | null;
  colors: ExtractedColor[];
  dominantColor: string | null;
  hasGradients: boolean;
  hasExternalRefs: boolean;
  fileSize: number;
}

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface ContrastResult {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
  wcagAALargeText: boolean;
  grade: WcagGrade;
}

export interface LogoLegibilityReport {
  logoName: string;
  displayName: string;
  colorsAnalyzed: string[];
  onWhite: ContrastResult;
  onBlack: ContrastResult;
  onDarkGray: ContrastResult;
  onLightGray: ContrastResult;
  bestForLight: boolean;
  bestForDark: boolean;
  overallOnLight: WcagGrade;
  overallOnDark: WcagGrade;
  recommendation: string;
  issues: string[];
  hasUntestableColors: boolean;
}

export interface SizeLegibilityReport {
  size: Size;
  pixelHeight: number;
  isUsableOnLight: boolean;
  isUsableOnDark: boolean;
  minimumSizeCompliant: boolean;
  issues: string[];
  recommendation: string;
}

export interface AestheticScore {
  visualBalance: number;
  spacingConsistency: number;
  sizeHarmony: number;
  logoCountScore: number;
  overallScore: number;
  breakdown: {
    meanAspectRatio: number;
    aspectRatioCv: number;
    aspectRatioMin: number;
    aspectRatioMax: number;
    logoCount: number;
    suggestedLayout: Layout;
  };
  suggestions: string[];
}

export interface AccessibilityAudit {
  altTextCoverage: number;
  minimumSizeCompliance: Partial<Record<Size, boolean>>;
  contrastCompliance: {
    onLight: number;
    onDark: number;
  };
  wcagLevel: WcagGrade;
  issues: string[];
  recommendations: string[];
}

export interface LegibilitySummary {
  logosPassingOnLight: number;
  logosPassingOnDark: number;
  logosPassingBoth: number;
  logosWithIssues: string[];
}

export interface TestimonialsReport {
  meta: {
    generatedAt: string;
    generatorVersion: string;
    logosDir: string;
    totalLogos: number;
  };
  logos: LogoAsset[];
  legibility: {
    perLogo: LogoLegibilityReport[];
    perSize: SizeLegibilityReport[];
    summary: LegibilitySummary;
  };
  aesthetic: AestheticScore;
  accessibility: AccessibilityAudit;
  overallGrade: WcagGrade;
  overallSummary: string[];
}

export interface GeneratorConfig {
  logosDir: string;
  outputDir: string;
  sizes: Size[];
  themes: Theme[];
  layouts: Layout[];
}

export interface GeneratedAsset {
  size: Size;
  theme: Theme;
  layout: Layout;
  htmlPath: string;
  markdownSnippet: string;
}

export interface GenerationResult {
  assets: GeneratedAsset[];
  report: TestimonialsReport;
  reportPaths: {
    html: string;
    json: string;
    markdown: string;
    summary: string;
  };
}
