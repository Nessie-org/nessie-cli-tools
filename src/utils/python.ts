import { join } from 'path';
import { execa } from 'execa';
import fsExtra from 'fs-extra';
const { pathExists } = fsExtra;
import { logger } from './logger.js';

/**
 * Resolve the python and pip executables inside a venv.
 */
export function venvBinaries(projectPath: string) {
  const isWindows = process.platform === 'win32';
  const binDir = isWindows
    ? join(projectPath, '.venv', 'Scripts')
    : join(projectPath, '.venv', 'bin');

  return {
    python: join(binDir, isWindows ? 'python.exe' : 'python'),
    pip: join(binDir, isWindows ? 'pip.exe' : 'pip'),
  };
}

/**
 * Create a Python virtual environment at <projectPath>/.venv
 */
export async function createVenv(projectPath: string): Promise<void> {
  const venvPath = join(projectPath, '.venv');
  if (await pathExists(venvPath)) {
    logger.warn('Virtual environment already exists — skipping creation.');
    return;
  }

  logger.step('Creating Python virtual environment…');
  await execa('python3', ['-m', 'venv', venvPath], { stdio: 'inherit' });
}

/**
 * Install one or more packages into the project venv.
 */
export async function pipInstall(
  projectPath: string,
  packages: string[],
): Promise<void> {
  const { pip } = venvBinaries(projectPath);
  logger.step(`Installing ${packages.join(', ')}…`);
  await execa(pip, ['install', ...packages], { stdio: 'inherit' });
}

/**
 * Uninstall a package from the project venv.
 */
export async function pipUninstall(
  projectPath: string,
  packageName: string,
): Promise<void> {
  const { pip } = venvBinaries(projectPath);
  logger.step(`Uninstalling ${packageName}…`);
  await execa(pip, ['uninstall', '-y', packageName], { stdio: 'inherit' });
}

/**
 * Run a Python script inside the project venv and return stdout.
 */
export async function runPython(
  projectPath: string,
  script: string,
): Promise<string> {
  const { python } = venvBinaries(projectPath);
  const result = await execa(python, ['-c', script]);
  return result.stdout;
}
