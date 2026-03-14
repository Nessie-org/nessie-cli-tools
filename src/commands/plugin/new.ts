import { join } from 'path';
import fsExtra from 'fs-extra';
const { pathExists } = fsExtra;
import * as clack from '@clack/prompts';
import chalk from 'chalk';
import { getConfig } from '../../utils/config.js';
import { logger } from '../../utils/logger.js';
import { requireProjectRoot, DIRS } from '../../utils/project.js';
import {
  deriveNames,
  ensureTemplatesCache,
  scaffoldFromTemplate,
} from '../../utils/templates.js';

export async function pluginNewCommand(rawName: string): Promise<void> {
  const projectRoot = await requireProjectRoot();
  const config = getConfig();

  const names = deriveNames(rawName);

  // TUI: pick plugin type
  const typeChoices = config.plugin_types.map((pt) => ({
    value: pt.template,
    label: pt.name,
    hint: pt.description,
  }));

  console.log(chalk.bold.cyan('\n🔌 New Nessie Plugin\n'));

  const selectedType = await clack.select<{
    value: string,
    label: string,
    hint: string,
  }[], unknown>({
    message: 'Select plugin type:',
    options: typeChoices,
  });

  if (clack.isCancel(selectedType)) {
    clack.cancel('Cancelled.');
    process.exit(0);
  }

  const pluginType = config.plugin_types.find(
    (pt) => pt.template === selectedType,
  )!;

  const pluginRoot = join(projectRoot, DIRS.myPlugins, names.plugin_name);

  if (await pathExists(pluginRoot)) {
    logger.error(
      `Plugin "${names.plugin_name}" already exists at my_plugins/${names.plugin_name}`,
    );
    process.exit(1);
  }

  const spin = clack.spinner();

  // Fetch / update templates cache from GitHub (~/.nessie/templates)
  spin.start('Fetching templates…');
  let templatesRoot: string;
  try {
    templatesRoot = await ensureTemplatesCache(config.templates_repo);
    spin.stop('Templates ready');
  } catch (err) {
    spin.stop('Failed to fetch templates');
    logger.error(String(err));
    process.exit(1);
  }

  // Scaffold from the selected template type
  spin.start(`Scaffolding plugin "${names.plugin_name}" (${pluginType.name})…`);
  try {
    await scaffoldFromTemplate(
      pluginType.template,
      pluginRoot,
      names,
      templatesRoot,
    );
    spin.stop(`Plugin "${names.plugin_name}" created at my_plugins/${names.plugin_name}`);
  } catch (err) {
    spin.stop('Scaffolding failed');
    logger.error(String(err));
    process.exit(1);
  }

  logger.info(
    `Run ${chalk.cyan(`nessie install ${names.plugin_name}`)} to install it.`,
  );
  logger.dim(`  plugin_name:        ${names.plugin_name}`);
  logger.dim(`  python_plugin_name: ${names.python_plugin_name}`);
}
