#!/usr/bin/env ts-node
import { Command } from 'commander';
import chalk from 'chalk';
import path from 'path';
import { loadLogos } from './generator/logoLoader';
import { runFullAnalysis } from './analysis/index';
import { writeAllOutputs } from './reporter/index';
import { DEFAULT_SIZES, DEFAULT_THEMES, DEFAULT_LAYOUTS } from './config';
import { Size, Theme, Layout, GeneratorConfig } from './types';

const VALID_SIZES:   Size[]   = ['xs', 'sm', 'md', 'lg', 'xl'];
const VALID_THEMES:  Theme[]  = ['light', 'dark', 'transparent'];
const VALID_LAYOUTS: Layout[] = ['inline', 'grid', 'compact'];

function parseList<T extends string>(value: string, valid: T[], name: string): T[] {
  const items = value.split(',').map(v => v.trim()) as T[];
  const invalid = items.filter(i => !valid.includes(i));
  if (invalid.length > 0) {
    console.error(chalk.red(`Invalid ${name}: ${invalid.join(', ')}. Valid values: ${valid.join(', ')}`));
    process.exit(1);
  }
  return items;
}

const program = new Command();

program
  .name('testimonials-generator')
  .description('Generate testimonial logo strips with WCAG legibility, accessibility and aesthetic analysis')
  .version('1.0.0');

const sharedOptions = (cmd: Command): Command =>
  cmd
    .option('--logos-dir <dir>',  'Directory containing SVG logo files', '../assets/logos')
    .option('--output-dir <dir>', 'Root output directory',               'output')
    .option('--sizes <list>',     `Comma-separated sizes (${VALID_SIZES.join(',')})`,   DEFAULT_SIZES.join(','))
    .option('--themes <list>',    `Comma-separated themes (${VALID_THEMES.join(',')})`, DEFAULT_THEMES.join(','))
    .option('--layouts <list>',   `Comma-separated layouts (${VALID_LAYOUTS.join(',')})`, DEFAULT_LAYOUTS.join(','));

async function run(opts: {
  logosDir: string;
  outputDir: string;
  sizes: string;
  themes: string;
  layouts: string;
}): Promise<void> {
  const sizes   = parseList(opts.sizes,   VALID_SIZES,   'size');
  const themes  = parseList(opts.themes,  VALID_THEMES,  'theme');
  const layouts = parseList(opts.layouts, VALID_LAYOUTS, 'layout');

  const config: GeneratorConfig = {
    logosDir:  path.resolve(opts.logosDir),
    outputDir: path.resolve(opts.outputDir),
    sizes,
    themes,
    layouts,
  };

  console.log(chalk.cyan('\n🎨  Testimonials Generator\n'));
  console.log(chalk.gray(`  Logos:   ${config.logosDir}`));
  console.log(chalk.gray(`  Output:  ${config.outputDir}`));
  console.log(chalk.gray(`  Sizes:   ${sizes.join(', ')}`));
  console.log(chalk.gray(`  Themes:  ${themes.join(', ')}`));
  console.log(chalk.gray(`  Layouts: ${layouts.join(', ')}\n`));

  // Load logos
  process.stdout.write(chalk.gray('  Loading logos...'));
  const logos = await loadLogos(config.logosDir);
  console.log(chalk.green(` ✓ ${logos.length} logos loaded`));

  // Analyse
  process.stdout.write(chalk.gray('  Running analysis...'));
  const report = await runFullAnalysis(logos, config.logosDir, sizes);
  console.log(chalk.green(' ✓ Done'));

  // Write outputs
  process.stdout.write(chalk.gray('  Writing outputs...'));
  const result = await writeAllOutputs(report, config);
  console.log(chalk.green(` ✓ ${result.assets.length} HTML files written`));

  // Summary
  console.log('\n' + chalk.bold('─'.repeat(50)));
  console.log(chalk.bold('  Report'));
  console.log(chalk.bold('─'.repeat(50)));
  for (const line of report.overallSummary) {
    console.log(`  ${chalk.white(line)}`);
  }

  const grade = report.overallGrade;
  const gradeColor =
    grade === 'AAA' ? chalk.green :
    grade === 'AA'  ? chalk.blue  :
    grade === 'AA-Large' ? chalk.yellow : chalk.red;

  console.log('\n' + chalk.bold('─'.repeat(50)));
  console.log(`  Overall grade: ${gradeColor.bold(grade)}`);
  console.log(`  Aesthetic:     ${report.aesthetic.overallScore}/100`);
  console.log(chalk.bold('─'.repeat(50)));

  if (report.legibility.summary.logosWithIssues.length > 0) {
    console.log(chalk.yellow(`\n  ⚠  Logos with issues: ${report.legibility.summary.logosWithIssues.join(', ')}`));
  }

  console.log(chalk.gray(`\n  HTML report: ${result.reportPaths.html}`));
  console.log(chalk.gray(`  JSON report: ${result.reportPaths.json}`));
  console.log(chalk.gray(`  Markdown:    ${result.reportPaths.markdown}\n`));
}

sharedOptions(
  program
    .command('all')
    .description('Generate strips, run analysis, and write all reports (default)')
    .action(function(this: Command) { void run(this.opts()); }),
);

sharedOptions(
  program
    .command('generate')
    .description('Alias for "all"')
    .action(function(this: Command) { void run(this.opts()); }),
);

program.parse(process.argv);
