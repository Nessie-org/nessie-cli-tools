import { join, basename } from 'path';
import fsExtra from 'fs-extra';
const { pathExists } = fsExtra;
import * as clack from '@clack/prompts';
import { logger } from '../../utils/logger.js';
import { requireProjectRoot, DIRS } from '../../utils/project.js';
import { cloneRepo } from '../../utils/git.js';
import { getConfig } from '../../utils/config.js';

/**
 * Determine if the given URL belongs to the official nessie-plugins org.
 * The prefix in config looks like "github.com/nessie-plugins".
 */
function isOfficialPlugin(repoUrl: string, prefix: string): boolean {
  // Normalise: strip protocol, trailing slashes
  const normalised = repoUrl
    .replace(/^https?:\/\//, '')
    .replace(/^git@github\.com:/, 'github.com/')
    .replace(/\.git$/, '')
    .replace(/\/$/, '');

  const normPrefix = prefix.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return normalised.startsWith(normPrefix);
}

export async function pluginDownloadCommand(repoUrl: string): Promise<void> {
  const projectRoot = await requireProjectRoot();
  const config = getConfig();

  const spin = clack.spinner();

  // Derive folder name from the last segment of the URL
  const repoName = basename(repoUrl.replace(/\.git$/, ''));

  const isOfficial = isOfficialPlugin(repoUrl, config.nessie_plugins_prefix);
  const targetDir = isOfficial ? DIRS.nessiePlugins : DIRS.myPlugins;
  const destPath = join(projectRoot, targetDir, repoName);

  if (await pathExists(destPath)) {
    logger.warn(
      `"${repoName}" already exists at ${targetDir}/${repoName}. Skipping clone.`,
    );
    return;
  }

  logger.info(
    isOfficial
      ? `Official Nessie plugin detected → cloning into nessie_plugins/`
      : `Third-party plugin → cloning into my_plugins/`,
  );

  spin.start(`Downloading "${repoName}"…`);
  try {
    await cloneRepo(repoUrl, destPath);
    spin.stop(`Plugin "${repoName}" downloaded to ${targetDir}/${repoName}`);
    logger.info(`Run \`nessie install ${repoName}\` to install it.`);
  } catch (err) {
    spin.stop('Download failed');
    logger.error(String(err));
    process.exit(1);
  }
}
