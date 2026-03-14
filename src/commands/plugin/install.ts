import { join } from 'path';
import fsExtra from 'fs-extra';
const { pathExists } = fsExtra;
import * as clack from '@clack/prompts';
import { logger } from '../../utils/logger.js';
import { requireProjectRoot, DIRS } from '../../utils/project.js';
import { pipInstall } from '../../utils/python.js';

export async function pluginInstallCommand(pluginName: string): Promise<void> {
  const projectRoot = await requireProjectRoot();

  // Check my_plugins first
  const myPluginPath = join(projectRoot, DIRS.myPlugins, pluginName);
  const nessiePluginPath = join(projectRoot, DIRS.nessiePlugins, pluginName);

  const inMyPlugins = await pathExists(myPluginPath);
  const inNessiePlugins = await pathExists(nessiePluginPath);

  if (!inMyPlugins && !inNessiePlugins) {
    logger.error(
      `Plugin "${pluginName}" not found in my_plugins or nessie_plugins.`,
    );
    logger.info(
      `Use \`nessie plugin download <github_url>\` to fetch it first.`,
    );
    process.exit(1);
  }

  const sourcePath = inMyPlugins ? myPluginPath : nessiePluginPath;
  const sourceLabel = inMyPlugins ? 'my_plugins' : 'nessie_plugins';

  const spin = clack.spinner();
  spin.start(`Installing "${pluginName}" from ${sourceLabel}…`);

  try {
    // pip install -e <path> for editable install
    await pipInstall(projectRoot, ['-e', sourcePath]);
    spin.stop(`Plugin "${pluginName}" installed successfully`);
  } catch (err) {
    spin.stop('Installation failed');
    logger.error(String(err));
    process.exit(1);
  }
}
