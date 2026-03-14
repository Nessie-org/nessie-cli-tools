import simpleGit from 'simple-git';
import { logger } from './logger.js';

/**
 * Clone a repository into destPath.
 */
export async function cloneRepo(
  repoUrl: string,
  destPath: string,
): Promise<void> {
  logger.step(`Cloning ${repoUrl} → ${destPath}`);
  const git = simpleGit();
  await git.clone(repoUrl, destPath);
}
