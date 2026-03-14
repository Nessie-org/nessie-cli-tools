import { join, resolve } from 'path';
import fsExtra from 'fs-extra';
const { ensureDir, writeJson, pathExists } = fsExtra;
import { writeFile } from 'fs/promises';
import * as clack from '@clack/prompts';
import chalk from 'chalk';
import { getConfig } from '../utils/config.js';
import { createVenv, pipInstall } from '../utils/python.js';
import { cloneRepo } from '../utils/git.js';
import { logger } from '../utils/logger.js';
import { DIRS } from '../utils/project.js';

export async function setupCommand(folder: string): Promise<void> {
  const projectPath = resolve(process.cwd(), folder);
  const config = getConfig();

  console.log(chalk.bold.cyan('\n🐉 Nessie Project Setup\n'));

  // Check if folder already exists
  if (await pathExists(projectPath)) {
    const cont = await clack.confirm({
      message: `Folder ${chalk.yellow(folder)} already exists. Continue setup inside it?`,
    });
    if (clack.isCancel(cont) || !cont) {
      clack.cancel('Setup cancelled.');
      process.exit(0);
    }
  }

  // TUI: select plugins — all selected by default
  const pluginChoices = config.plugins.map((p) => ({
    value: p.name,
    label: p.name,
    hint: p.description,
  }));

  const selectedPlugins = await clack.multiselect<{
    value: string,
    label: string,
    hint: string,
  }[], unknown>({
    message: 'Select plugins to include (all selected by default — deselect to skip):',
    options: pluginChoices,
    // initialValues selects all by default
    initialValues: config.plugins.map((p) => p.name),
    required: false,
  });

  if (clack.isCancel(selectedPlugins)) {
    clack.cancel('Setup cancelled.');
    process.exit(0);
  }

  clack.intro(chalk.bold('Setting up your Nessie project…'));
  const spin = clack.spinner();

  // 1. Create directory structure
  spin.start('Creating project directories');
  await ensureDir(projectPath);
  await ensureDir(join(projectPath, DIRS.core));
  await ensureDir(join(projectPath, DIRS.nessiePlugins));
  await ensureDir(join(projectPath, DIRS.myPlugins));
  await ensureDir(join(projectPath, DIRS.nessieMarker));
  spin.stop('Directories created');

  // 2. Create venv
  spin.start('Creating Python virtual environment');
  try {
    await createVenv(projectPath);
    spin.stop('Virtual environment ready');
  } catch (err) {
    spin.stop('Failed to create virtual environment');
    logger.error(String(err));
    process.exit(1);
  }

  // 3. Clone and install core packages (nessie_api + nessie_platform)
  for (const [key, pkg] of Object.entries(config.packages) as [string, { pip_name: string; repo: string }][]) {
    const coreDest = join(projectPath, DIRS.core, pkg.pip_name);

    spin.start(`Cloning ${pkg.pip_name}…`);
    try {
      if (await pathExists(coreDest)) {
        spin.stop(`${pkg.pip_name} already cloned — skipping`);
      } else {
        await cloneRepo(pkg.repo, coreDest);
        spin.stop(`Cloned ${pkg.pip_name}`);
      }
    } catch (err) {
      spin.stop(`Failed to clone ${pkg.pip_name}`);
      logger.error(String(err));
      process.exit(1);
    }

    spin.start(`Installing ${pkg.pip_name}…`);
    try {
      await pipInstall(projectPath, ['-e', coreDest]);
      spin.stop(`Installed ${pkg.pip_name}`);
    } catch (err) {
      spin.stop(`Failed to install ${pkg.pip_name}`);
      logger.error(String(err));
      process.exit(1);
    }
  }

  // 4. Clone and install selected plugins into nessie_plugins/
  const chosen = selectedPlugins as string[];
  for (const pluginName of chosen) {
    const pluginDef = config.plugins.find((p) => p.name === pluginName);
    if (!pluginDef) continue;

    const destPath = join(projectPath, DIRS.nessiePlugins, pluginName);
    spin.start(`Cloning plugin: ${pluginName}`);
    try {
      if (await pathExists(destPath)) {
        spin.stop(`Plugin already exists: ${pluginName} — skipping`);
      } else {
        await cloneRepo(pluginDef.repo, destPath);
        spin.stop(`Plugin cloned: ${pluginName}`);
      }
    } catch (err) {
      spin.stop(`Failed to clone plugin: ${pluginName}`);
      logger.warn(String(err));
      continue;
    }

    spin.start(`Installing plugin: ${pluginName}`);
    try {
      await pipInstall(projectPath, ['-e', destPath]);
      spin.stop(`Plugin installed: ${pluginName}`);
    } catch (err) {
      spin.stop(`Failed to install plugin: ${pluginName}`);
      logger.warn(String(err));
    }
  }

  // 5. Write marker metadata
  await writeJson(join(projectPath, DIRS.nessieMarker, 'meta.json'), {
    created: new Date().toISOString(),
    plugins: chosen,
  });

  // 6. Write .gitignore
  const gitignore = ['.venv/', '__pycache__/', '*.pyc', '*.pyo', '.env'].join('\n');
  await writeFile(join(projectPath, '.gitignore'), gitignore + '\n');

  clack.outro(chalk.green(`✔ Nessie project ready at ${chalk.bold(folder)}`));
  const isWindows = process.platform === 'win32';
  const activateCmd = isWindows
    ? '.venv\\Scripts\\activate'
    : 'source .venv/bin/activate';
  clack.outro(
    chalk.green(
      `Run ${chalk.bold(`cd ${folder} && ${activateCmd}`)} to activate the virtual environment.`
    )
  );
}