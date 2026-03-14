import { join } from 'path';
import fsExtra from 'fs-extra';
const { readdir, pathExists } = fsExtra;
import chalk from 'chalk';
import { logger } from '../../utils/logger.js';
import { requireProjectRoot, DIRS } from '../../utils/project.js';
import { runPython } from '../../utils/python.js';

/**
 * Get the list of installed plugin names via Python entry_points.
 */
async function getInstalledPlugins(projectRoot: string): Promise<string[]> {
  const script = `
import importlib.metadata as m
import json
eps = []
try:
    for ep in m.entry_points(group='nessie_plugins'):
        eps.append(ep.name)
except Exception:
    pass
print(json.dumps(eps))
`.trim();

  try {
    const output = await runPython(projectRoot, script);
    return JSON.parse(output) as string[];
  } catch {
    return [];
  }
}

/**
 * List subdirectories inside a directory.
 */
async function listDirs(dir: string): Promise<string[]> {
  if (!(await pathExists(dir))) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

export async function pluginListCommand(): Promise<void> {
  const projectRoot = await requireProjectRoot();

  const installedPlugins = await getInstalledPlugins(projectRoot);
  const installedSet = new Set(installedPlugins);

  const nessiePlugins = await listDirs(
    join(projectRoot, DIRS.nessiePlugins),
  );
  const myPlugins = await listDirs(join(projectRoot, DIRS.myPlugins));

  console.log(chalk.bold.cyan('\n🔌 Nessie Plugins\n'));

  // nessie_plugins
  console.log(chalk.bold('nessie_plugins/'));
  if (nessiePlugins.length === 0) {
    console.log(chalk.dim('  (none)'));
  } else {
    for (const name of nessiePlugins) {
      const installed = installedSet.has(name);
      const badge = installed
        ? chalk.green('[installed]')
        : chalk.dim('[not installed]');
      console.log(`  ${chalk.white(name)} ${badge}`);
    }
  }

  console.log();

  // my_plugins
  console.log(chalk.bold('my_plugins/'));
  if (myPlugins.length === 0) {
    console.log(chalk.dim('  (none)'));
  } else {
    for (const name of myPlugins) {
      const installed = installedSet.has(name) || installedSet.has(name.replace(/-/g, '_'));
      const badge = installed
        ? chalk.green('[installed]')
        : chalk.dim('[not installed]');
      console.log(`  ${chalk.white(name)} ${badge}`);
    }
  }

  // Installed plugins not in either folder (external)
  const localNames = new Set([
    ...nessiePlugins,
    ...myPlugins,
    ...myPlugins.map((n) => n.replace(/-/g, '_')),
  ]);
  const external = installedPlugins.filter((p) => !localNames.has(p));
  if (external.length > 0) {
    console.log();
    console.log(chalk.bold('Externally installed:'));
    for (const name of external) {
      console.log(`  ${chalk.white(name)} ${chalk.green('[installed]')}`);
    }
  }

  console.log();
}
