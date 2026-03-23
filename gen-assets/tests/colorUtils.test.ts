import {
  hexToRgb,
  rgbToHex,
  relativeLuminance,
  contrastRatio,
  buildContrastResult,
  getWcagGrade,
  parseColor,
  normalizeToHex,
  isUntestableColor,
  cssColorContrast,
} from '../src/analysis/colorUtils';

describe('hexToRgb', () => {
  it('parses 6-digit lowercase hex', () => {
    expect(hexToRgb('#ff9900')).toEqual({ r: 255, g: 153, b: 0 });
  });
  it('parses 6-digit uppercase hex', () => {
    expect(hexToRgb('#FF9900')).toEqual({ r: 255, g: 153, b: 0 });
  });
  it('expands 3-digit shorthand', () => {
    expect(hexToRgb('#f90')).toEqual({ r: 255, g: 153, b: 0 });
  });
  it('ignores alpha channel in 8-digit hex', () => {
    const result = hexToRgb('#ff990080');
    expect(result).toEqual({ r: 255, g: 153, b: 0 });
  });
  it('returns null for non-hex strings', () => {
    expect(hexToRgb('red')).toBeNull();
    expect(hexToRgb('#zzz')).toBeNull();
    expect(hexToRgb('')).toBeNull();
  });
  it('parses white and black correctly', () => {
    expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb('#000000')).toEqual({ r: 0,   g: 0,   b: 0   });
  });
});

describe('rgbToHex', () => {
  it('converts RgbColor to hex string', () => {
    expect(rgbToHex({ r: 255, g: 153, b: 0 })).toBe('#ff9900');
  });
  it('pads single-digit hex values', () => {
    expect(rgbToHex({ r: 0, g: 0, b: 0 })).toBe('#000000');
  });
});

describe('relativeLuminance', () => {
  it('returns 0 for pure black', () => {
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0, 5);
  });
  it('returns 1 for pure white', () => {
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1, 5);
  });
  it('is monotonically ordered: black < gray < white', () => {
    const black = relativeLuminance({ r: 0,   g: 0,   b: 0   });
    const gray  = relativeLuminance({ r: 128, g: 128, b: 128 });
    const white = relativeLuminance({ r: 255, g: 255, b: 255 });
    expect(black).toBeLessThan(gray);
    expect(gray).toBeLessThan(white);
  });
  it('applies linearization correctly below threshold', () => {
    // Channel value 10 → sRGB = 10/255 ≈ 0.0392, < 0.04045 → linear = sRGB/12.92
    const l = relativeLuminance({ r: 10, g: 0, b: 0 });
    const expected = 0.2126 * ((10 / 255) / 12.92);
    expect(l).toBeCloseTo(expected, 8);
  });
});

describe('contrastRatio', () => {
  it('returns 21:1 for black on white', () => {
    const white = relativeLuminance({ r: 255, g: 255, b: 255 });
    const black = relativeLuminance({ r: 0,   g: 0,   b: 0   });
    expect(contrastRatio(white, black)).toBeCloseTo(21, 1);
  });
  it('returns 1:1 for identical luminances', () => {
    const l = relativeLuminance({ r: 100, g: 100, b: 100 });
    expect(contrastRatio(l, l)).toBeCloseTo(1, 5);
  });
  it('is symmetric', () => {
    const l1 = relativeLuminance({ r: 200, g: 100, b: 50 });
    const l2 = relativeLuminance({ r: 50,  g: 50,  b: 50 });
    expect(contrastRatio(l1, l2)).toBeCloseTo(contrastRatio(l2, l1), 10);
  });
});

describe('getWcagGrade', () => {
  it('grades ≥7:1 as AAA', ()           => expect(getWcagGrade(7)).toBe('AAA'));
  it('grades ≥4.5:1 as AA', ()          => expect(getWcagGrade(4.5)).toBe('AA'));
  it('grades ≥3:1 as AA-Large', ()      => expect(getWcagGrade(3)).toBe('AA-Large'));
  it('grades <3:1 as Fail', ()          => expect(getWcagGrade(2.9)).toBe('Fail'));
  it('grades exactly 21:1 as AAA', ()   => expect(getWcagGrade(21)).toBe('AAA'));
  it('grades 1:1 as Fail', ()           => expect(getWcagGrade(1)).toBe('Fail'));
});

describe('buildContrastResult', () => {
  it('sets all boolean flags correctly for ratio 5:1', () => {
    const result = buildContrastResult(5);
    expect(result.ratio).toBe(5);
    expect(result.wcagAA).toBe(true);
    expect(result.wcagAAA).toBe(false);
    expect(result.wcagAALargeText).toBe(true);
    expect(result.grade).toBe('AA');
  });
  it('rounds ratio to 2 decimal places', () => {
    const result = buildContrastResult(4.567890);
    expect(result.ratio).toBe(4.57);
  });
});

describe('parseColor', () => {
  it('parses hex strings', () => {
    expect(parseColor('#ea1d25')).toEqual({ r: 234, g: 29, b: 37 });
  });
  it('parses rgb() notation', () => {
    expect(parseColor('rgb(100, 150, 200)')).toEqual({ r: 100, g: 150, b: 200 });
  });
  it('parses rgba() notation (ignores alpha)', () => {
    expect(parseColor('rgba(100, 150, 200, 0.5)')).toEqual({ r: 100, g: 150, b: 200 });
  });
  it('parses named color "black"', () => {
    expect(parseColor('black')).toEqual({ r: 0, g: 0, b: 0 });
  });
  it('parses named color "navy"', () => {
    expect(parseColor('navy')).toEqual({ r: 0, g: 0, b: 128 });
  });
  it('returns null for "none"', () => {
    expect(parseColor('none')).toBeNull();
  });
  it('returns null for "currentColor"', () => {
    expect(parseColor('currentColor')).toBeNull();
  });
  it('returns null for url() references', () => {
    expect(parseColor('url(#gradient)')).toBeNull();
  });
  it('returns null for empty string', () => {
    expect(parseColor('')).toBeNull();
  });
  it('is case-insensitive for named colors', () => {
    expect(parseColor('BLACK')).toEqual(parseColor('black'));
    expect(parseColor('Navy')).toEqual(parseColor('navy'));
  });
});

describe('normalizeToHex', () => {
  it('normalizes named color to hex', () => {
    expect(normalizeToHex('black')).toBe('#000000');
    expect(normalizeToHex('white')).toBe('#ffffff');
  });
  it('normalizes rgb() to hex', () => {
    expect(normalizeToHex('rgb(255, 0, 0)')).toBe('#ff0000');
  });
  it('returns null for untestable colors', () => {
    expect(normalizeToHex('none')).toBeNull();
    expect(normalizeToHex('url(#foo)')).toBeNull();
  });
});

describe('isUntestableColor', () => {
  it('identifies url() as untestable', ()          => expect(isUntestableColor('url(#g)')).toBe(true));
  it('identifies currentColor as untestable', ()   => expect(isUntestableColor('currentColor')).toBe(true));
  it('identifies inherit as untestable', ()         => expect(isUntestableColor('inherit')).toBe(true));
  it('does not flag hex colors as untestable', ()   => expect(isUntestableColor('#ff0000')).toBe(false));
  it('does not flag named colors as untestable', () => expect(isUntestableColor('red')).toBe(false));
});

describe('cssColorContrast', () => {
  it('computes max contrast for black on white', () => {
    const result = cssColorContrast('#000000', '#ffffff');
    expect(result).not.toBeNull();
    expect(result!.ratio).toBeCloseTo(21, 0);
    expect(result!.grade).toBe('AAA');
  });
  it('computes Santander red on white', () => {
    // #EA1D25 on white — should fail AA for normal text but pass AA-Large
    const result = cssColorContrast('#EA1D25', '#ffffff');
    expect(result).not.toBeNull();
    expect(result!.ratio).toBeGreaterThan(3);
  });
  it('returns null when either color is unparseable', () => {
    expect(cssColorContrast('url(#g)', '#fff')).toBeNull();
    expect(cssColorContrast('#fff', 'url(#g)')).toBeNull();
  });
});
