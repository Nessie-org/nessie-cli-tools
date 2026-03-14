import { join } from 'path';
import { homedir } from 'os';
import { readFile, writeFile, readdir, rename } from 'fs/promises';
import fsExtra from 'fs-extra';
const { ensureDir, copy, pathExists } = fsExtra;
import simpleGit from 'simple-git';
import { logger } from './logger.js';

const TEMPLATES_CACHE_DIR = join(homedir(), '.nessie', 'templates');

/**
 * Derived name variants from a raw plugin name.
 */
export interface PluginNames {
  /** Original as given by user, sanitised: e.g. "my-auth-plugin" */
  plugin_name: string;
  /** Snake_case Python module name: e.g. "my_auth_plugin" */
  python_plugin_name: string;
}

export function deriveNames(rawName: string): PluginNames {
  const plugin_name = rawName
    .replace(/[^a-z0-9-_]/gi, '-')
    .toLowerCase();

  const python_plugin_name = plugin_name
    .replace(/[-\s]+/g, '_');   // replace hyphens AND spaces with _

  return { plugin_name, python_plugin_name };
}

/**
 * Apply {{plugin_name}} and {{python_plugin_name}} substitutions to a string.
 */
export function applySubstitutions(content: string, names: PluginNames): string {
  return content
    .replace(/\{\{plugin_name\}\}/g, names.plugin_name)
    .replace(/\{\{plugin_python_name\}\}/g, names.python_plugin_name);
}

/**
 * Ensure the templates repo is cloned/up-to-date in ~/.nessie/templates.
 * Returns the local cache path.
 */
export async function ensureTemplatesCache(repoUrl: string): Promise<string> {
  await ensureDir(TEMPLATES_CACHE_DIR);

  const git = simpleGit();

  if (await pathExists(join(TEMPLATES_CACHE_DIR, '.git'))) {
    logger.step('Updating templates cache…');
    try {
      await simpleGit(TEMPLATES_CACHE_DIR).pull();
    } catch {
      logger.warn('Could not pull latest templates — using cached version.');
    }
  } else {
    logger.step('Fetching templates for the first time…');
    await git.clone(repoUrl, TEMPLATES_CACHE_DIR);
  }

  return TEMPLATES_CACHE_DIR;
}

/**
 * Copy a template type folder into destDir, applying substitutions to
 * all file contents and renaming any file/folder named
 * "{{python_plugin_name}}" appropriately.
 */
export async function scaffoldFromTemplate(
  templateType: string,
  destDir: string,
  names: PluginNames,
  templatesRoot: string,
): Promise<void> {
  const templateSrc = join(templatesRoot, templateType);

  if (!(await pathExists(templateSrc))) {
    throw new Error(
      `Template "${templateType}" not found in templates repo at ${templateSrc}`,
    );
  }

  // Copy raw template tree into dest
  await copy(templateSrc, destDir);

  // Walk every file and apply substitutions to content + rename paths
  await processDir(destDir, names);
}

async function processDir(dir: string, names: PluginNames): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const oldPath = join(dir, entry.name);

    // Rename the entry itself if its name contains a placeholder
    const newName = applySubstitutions(entry.name, names);
    const newPath = join(dir, newName);
    if (newName !== entry.name) {
      await rename(oldPath, newPath);
    }

    if (entry.isDirectory()) {
      await processDir(newPath, names);
    } else {
      // Apply substitutions to file content
      const raw = await readFile(newPath, 'utf8');
      const substituted = applySubstitutions(raw, names);
      await writeFile(newPath, substituted, 'utf8');
    }
  }
}
