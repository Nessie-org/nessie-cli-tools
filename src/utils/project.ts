import { join } from 'path';
import fsExtra from 'fs-extra';
const { pathExists, readJson } = fsExtra;
import { logger } from './logger.js';

const NESSIE_MARKER = '.nessie';

/**
 * Walk up from cwd to find the nearest Nessie project root.
 * Returns the path or null if not found.
 */
export async function findProjectRoot(
  startDir = process.cwd(),
): Promise<string | null> {
  let current = startDir;
  while (true) {
    if (await pathExists(join(current, NESSIE_MARKER))) {
      return current;
    }
    const parent = join(current, '..');
    if (parent === current) return null;
    current = parent;
  }
}

/**
 * Assert that we are inside a Nessie project and return its root.
 * Exits the process with a friendly message if not.
 */
export async function requireProjectRoot(): Promise<string> {
  const root = await findProjectRoot();
  if (!root) {
    logger.error(
      'No Nessie project found. Run `nessie setup <folder>` first.',
    );
    process.exit(1);
  }
  return root;
}

/**
 * Read the stored project metadata from <root>/.nessie/meta.json
 */
export async function readProjectMeta(
  root: string,
): Promise<Record<string, unknown>> {
  const metaPath = join(root, NESSIE_MARKER, 'meta.json');
  if (!(await pathExists(metaPath))) return {};
  return readJson(metaPath);
}

export const DIRS = {
  venv: '.venv',
  core: 'core',
  nessiePlugins: 'nessie_plugins',
  myPlugins: 'my_plugins',
  nessieMarker: NESSIE_MARKER,
};
