import { join } from 'path';
import fsExtra from 'fs-extra';
const { pathExists } = fsExtra;
import * as clack from '@clack/prompts';
import chalk from 'chalk';
import { getConfig } from '../utils/config.js';
import { cloneRepo } from '../utils/git.js';
import { logger } from '../utils/logger.js';
import { requireProjectRoot } from '../utils/project.js';
import { venvBinaries } from '../utils/python.js';
import { execa } from 'execa';

export async function startCommand(serverName?: string): Promise<void> {
  const projectRoot = await requireProjectRoot();
  const config = getConfig();

  console.log(chalk.bold.cyan('\n🚀 Nessie Start\n'));

  // If no server argument, show TUI selector
  let resolvedName = serverName;
  if (!resolvedName) {
    const selected = await clack.select<{
    value: string,
    label: string,
    hint: string,
  }[], unknown>({
      message: 'Select a server to start:',
      options: config.servers.map((s) => ({
        value: s.name,
        label: s.name,
        hint: s.description,
      })),
    });

    if (clack.isCancel(selected)) {
      clack.cancel('Cancelled.');
      process.exit(0);
    }

    resolvedName = selected as string;
  }

  const serverDef = config.servers.find(
    (s) => s.name.toLowerCase() === resolvedName!.toLowerCase(),
  );

  if (!serverDef) {
    logger.error(
      `Unknown server "${resolvedName}". Available: ${config.servers.map((s) => s.name).join(', ')}`,
    );
    process.exit(1);
  }

  const serverPath = join(projectRoot, 'servers', resolvedName);
  const spin = clack.spinner();

  // Clone server repo if it doesn't exist
  if (!(await pathExists(serverPath))) {
    spin.start(`Cloning server "${resolvedName}"…`);
    try {
      await cloneRepo(serverDef.repo, serverPath);
      spin.stop(`Server "${resolvedName}" cloned`);
    } catch (err) {
      spin.stop('Clone failed');
      logger.error(String(err));
      process.exit(1);
    }
  } else {
    logger.info(`Server "${resolvedName}" already exists — skipping clone.`);
  }

  // Install server dependencies into venv if requirements.txt exists
  const requirementsPath = join(serverPath, 'requirements.txt');
  if (await pathExists(requirementsPath)) {
    const { pip } = venvBinaries(projectRoot);
    spin.start('Installing server dependencies…');
    try {
      await execa(pip, ['install', '-r', requirementsPath], { stdio: 'inherit' });
      spin.stop('Server dependencies installed');
    } catch (err) {
      spin.stop('Failed to install server dependencies');
      logger.warn(String(err));
    }
  }

  // Start the server
  console.log(chalk.bold.cyan(`\n▶  Starting ${resolvedName} server…\n`));
  const { python } = venvBinaries(projectRoot);
  const mainPy = join(serverPath, 'main.py');

  if (await pathExists(mainPy)) {
    await execa(python, [mainPy], { stdio: 'inherit', cwd: serverPath });
  } else {
    logger.error(`No main.py found in ${serverPath}. Don't know how to start the server.`);
    process.exit(1);
  }
}
