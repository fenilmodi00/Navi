import { logger } from '@elizaos/core';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Configuration for GitHub repository syncing
 */
export interface GitHubRepoConfig {
  url: string;
  path: string;
  branch?: string;
  docsPath?: string;
}

/**
 * Get GitHub repository configurations from environment variables
 * Supports multiple repositories using DOCS_REPO_1_*, DOCS_REPO_2_*, etc.
 */
export function getGitHubRepoConfigs(): GitHubRepoConfig[] {
  const configs: GitHubRepoConfig[] = [];
  
  // Check for up to 10 repository configurations
  for (let i = 1; i <= 10; i++) {
    const url = process.env[`DOCS_REPO_${i}_URL`];
    const repoPath = process.env[`DOCS_REPO_${i}_PATH`];
    
    if (url && repoPath) {
      configs.push({
        url,
        path: path.resolve(repoPath),
        branch: process.env[`DOCS_REPO_${i}_BRANCH`] || 'main',
        docsPath: process.env[`DOCS_REPO_${i}_DOCS_PATH`]
      });
    }
  }
  
  return configs;
}

/**
 * Clone or update a GitHub repository
 * @param config Repository configuration
 * @returns True if successful, false otherwise
 */
export async function syncGitHubRepo(config: GitHubRepoConfig): Promise<boolean> {
  try {
    const { url, path: repoPath, branch, docsPath } = config;
    
    logger.info(`Syncing GitHub repository: ${url}`);
    
    // Check if directory exists and has .git folder
    const gitDir = path.join(repoPath, '.git');
    const isExistingRepo = fs.existsSync(gitDir);
    
    if (isExistingRepo) {
      logger.info(`Repository exists at ${repoPath}, pulling latest changes...`);
      
      // Change to the repository directory and pull
      try {
        execSync(`cd "${repoPath}" && git fetch origin && git reset --hard origin/${branch}`, {
          stdio: 'pipe',
          timeout: 60000 // 60 second timeout
        });
        
        logger.info(`Successfully updated repository at ${repoPath}`);
      } catch (pullError) {
        logger.error(`Failed to pull repository at ${repoPath}:`, pullError);
        return false;
      }
    } else {
      logger.info(`Cloning repository to ${repoPath}...`);
      
      // Ensure parent directory exists
      const parentDir = path.dirname(repoPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      
      // Clone the repository
      try {
        execSync(`git clone --branch ${branch} --single-branch "${url}" "${repoPath}"`, {
          stdio: 'pipe',
          timeout: 120000 // 2 minute timeout for cloning
        });
        
        logger.info(`Successfully cloned repository to ${repoPath}`);
      } catch (cloneError) {
        logger.error(`Failed to clone repository from ${url}:`, cloneError);
        return false;
      }
    }
    
    // Verify the repository is in a good state
    if (!fs.existsSync(repoPath)) {
      logger.error(`Repository directory does not exist after sync: ${repoPath}`);
      return false;
    }
    
    // If docsPath is specified, verify it exists within the repository
    if (docsPath) {
      const fullDocsPath = path.join(repoPath, docsPath);
      if (!fs.existsSync(fullDocsPath)) {
        logger.warn(`Specified docs path does not exist in repository: ${fullDocsPath}`);
      } else {
        logger.info(`Verified docs path exists: ${fullDocsPath}`);
      }
    }
    
    return true;
  } catch (error) {
    logger.error(`Unexpected error syncing GitHub repository:`, error);
    return false;
  }
}

/**
 * Sync all configured GitHub repositories
 * @returns Number of successfully synced repositories
 */
export async function syncAllGitHubRepos(): Promise<number> {
  const configs = getGitHubRepoConfigs();
  
  if (configs.length === 0) {
    logger.debug('No GitHub repository configurations found in environment variables');
    return 0;
  }
  
  logger.info(`Found ${configs.length} GitHub repository configuration(s)`);
  
  let successCount = 0;
  
  for (const config of configs) {
    const success = await syncGitHubRepo(config);
    if (success) {
      successCount++;
    }
  }
  
  logger.info(`Successfully synced ${successCount}/${configs.length} repositories`);
  return successCount;
}

/**
 * Check if Git is available on the system
 * @returns True if Git is available, false otherwise
 */
export function isGitAvailable(): boolean {
  try {
    execSync('git --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    logger.warn('Git is not available on this system. GitHub repository syncing will be disabled.');
    return false;
  }
}
