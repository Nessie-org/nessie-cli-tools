import * as clack from '@clack/prompts';
import { logger } from '../../utils/logger.js';
import { requireProjectRoot } from '../../utils/project.js';
import { runPython, pipUninstall } from '../../utils/python.js';

async function getInstalledPlugins(projectRoot: string): Promise<string[]> {
  const script = `
import importlib.metadata as m, json
eps = [ep.name for ep in m.entry_points(group='nessie_plugins')]
print(json.dumps(eps))
`.trim();

  try {
    const output = await runPython(projectRoot, script);
    return JSON.parse(output) as string[];
  } catch {
    return [];
  }
}

export async function pluginRemoveCommand(pluginName: string): Promise<void> {
  const projectRoot = await requireProjectRoot();

  const installedPlugins = await getInstalledPlugins(projectRoot);
  const isInstalled =
    installedPlugins.includes(pluginName) ||
    installedPlugins.includes(pluginName.replace(/-/g, '_'));

  if (!isInstalled) {
    logger.error(
      `Plugin "${pluginName}" is not currently installed in this Nessie project.`,
    );
    logger.info(`Run \`nessie plugin list\` to see installed plugins.`);
    process.exit(1);
  }

  const spin = clack.spinner();
  spin.start(`Removing "${pluginName}"…`);

  try {
    await pipUninstall(projectRoot, pluginName);
    spin.stop(`Plugin "${pluginName}" removed`);
  } catch (err) {
    spin.stop('Removal failed');
    logger.error(String(err));
    process.exit(1);
  }
}
