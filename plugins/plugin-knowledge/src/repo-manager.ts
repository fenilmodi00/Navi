import { logger } from '@elizaos/core';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface RepoConfig {
  url: string;
  branch?: string;
  path: string;
  docsPath?: string;
}

/**
 * Check if git is installed
 */
async function isGitInstalled(): Promise<boolean> {
  try {
    await execAsync('git --version');
    return true;
  } catch (error) {
    logger.error('Git is not installed or not in PATH');
    return false;
  }
}

/**
 * Check if a directory is a git repository
 */
async function isGitRepository(dirPath: string): Promise<boolean> {
  try {
    if (!fs.existsSync(dirPath)) {
      return false;
    }
    
    const gitDir = path.join(dirPath, '.git');
    return fs.existsSync(gitDir);
  } catch (error) {
    logger.error(`Error checking if ${dirPath} is a git repository:`, error);
    return false;
  }
}

/**
 * Clone a git repository
 */
async function cloneRepository(repoConfig: RepoConfig): Promise<boolean> {
  try {
    const { url, branch, path: repoPath } = repoConfig;
    
    // Create parent directory if it doesn't exist
    const parentDir = path.dirname(repoPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    
    // Clone the repository
    const branchArg = branch ? `--branch ${branch}` : '';
    const cmd = `git clone ${branchArg} ${url} ${repoPath}`;
    
    logger.info(`Cloning repository: ${url} to ${repoPath}`);
    await execAsync(cmd);
    
    logger.info(`Repository cloned successfully: ${repoPath}`);
    return true;
  } catch (error) {
    logger.error(`Failed to clone repository:`, error);
    return false;
  }
}

/**
 * Pull latest changes from a git repository
 */
async function pullRepository(repoPath: string): Promise<boolean> {
  try {
    logger.info(`Pulling latest changes for repository: ${repoPath}`);
    
    // Change to repository directory
    const cwd = process.cwd();
    process.chdir(repoPath);
    
    // Pull the latest changes
    await execAsync('git pull');
    
    // Change back to original directory
    process.chdir(cwd);
    
    logger.info(`Repository updated successfully: ${repoPath}`);
    return true;
  } catch (error) {
    logger.error(`Failed to pull repository:`, error);
    return false;
  }
}

/**
 * Check if repository has changes
 */
async function hasRepositoryChanges(repoPath: string): Promise<boolean> {
  try {
    // Change to repository directory
    const cwd = process.cwd();
    process.chdir(repoPath);
    
    // Fetch the latest changes
    await execAsync('git fetch');
    
    // Check if there are changes
    const { stdout } = await execAsync('git rev-list HEAD...origin/HEAD --count');
    
    // Change back to original directory
    process.chdir(cwd);
    
    return parseInt(stdout.trim(), 10) > 0;
  } catch (error) {
    logger.error(`Failed to check repository changes:`, error);
    return false;
  }
}

/**
 * Get the docs path from a repository configuration
 */
function getRepoDocsPath(repoConfig: RepoConfig): string {
  if (repoConfig.docsPath) {
    return path.join(repoConfig.path, repoConfig.docsPath);
  }
  
  // Default to docs directory if it exists
  const docsPath = path.join(repoConfig.path, 'docs');
  if (fs.existsSync(docsPath)) {
    return docsPath;
  }
  
  // Otherwise use the repository root
  return repoConfig.path;
}

/**
 * Manage repository (clone if doesn't exist, pull if it does)
 */
export async function manageRepository(repoConfig: RepoConfig): Promise<string | null> {
  try {
    // Check if git is installed
    if (!(await isGitInstalled())) {
      logger.error('Git is not installed. Cannot manage repository.');
      return null;
    }
    
    // Check if repository already exists
    const repoExists = await isGitRepository(repoConfig.path);
    
    if (!repoExists) {
      // Clone the repository if it doesn't exist
      const cloned = await cloneRepository(repoConfig);
      if (!cloned) {
        return null;
      }
    } else {
      // Check for changes and pull if needed
      const hasChanges = await hasRepositoryChanges(repoConfig.path);
      if (hasChanges) {
        const pulled = await pullRepository(repoConfig.path);
        if (!pulled) {
          logger.warn(`Failed to pull latest changes for ${repoConfig.url}, using existing version`);
        }
      } else {
        logger.info(`Repository ${repoConfig.url} is already up to date`);
      }
    }
    
    // Return the docs path
    return getRepoDocsPath(repoConfig);
  } catch (error) {
    logger.error(`Error managing repository:`, error);
    return null;
  }
}

/**
 * Parse repository configurations from environment variables or settings
 */
export function parseRepoConfigs(config: Record<string, string>): RepoConfig[] {
  const repoConfigs: RepoConfig[] = [];
  
  // Check for DOCS_REPOS environment variable
  const docsReposEnv = process.env.DOCS_REPOS || config.DOCS_REPOS;
  
  if (docsReposEnv) {
    try {
      // Parse JSON array of repository configurations
      const repos = JSON.parse(docsReposEnv);
      
      if (Array.isArray(repos)) {
        repos.forEach((repo: any, index: number) => {
          if (repo.url && repo.path) {
            repoConfigs.push({
              url: repo.url,
              branch: repo.branch,
              path: path.resolve(repo.path),
              docsPath: repo.docsPath
            });
          } else {
            logger.warn(`Invalid repository configuration at index ${index}: missing url or path`);
          }
        });
      }
    } catch (error) {
      logger.error('Failed to parse DOCS_REPOS environment variable:', error);
    }
  }
  
  // Check for individual repository configurations
  for (let i = 1; ; i++) {
    const urlKey = `DOCS_REPO_${i}_URL`;
    const pathKey = `DOCS_REPO_${i}_PATH`;
    const branchKey = `DOCS_REPO_${i}_BRANCH`;
    const docsPathKey = `DOCS_REPO_${i}_DOCS_PATH`;
    
    const url = process.env[urlKey] || config[urlKey];
    const repoPath = process.env[pathKey] || config[pathKey];
    
    if (!url || !repoPath) {
      break;
    }
    
    repoConfigs.push({
      url,
      branch: process.env[branchKey] || config[branchKey],
      path: path.resolve(repoPath),
      docsPath: process.env[docsPathKey] || config[docsPathKey]
    });
  }
  
  return repoConfigs;
} 