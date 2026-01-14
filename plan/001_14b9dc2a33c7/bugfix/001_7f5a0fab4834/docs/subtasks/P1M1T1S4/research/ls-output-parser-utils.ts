/**
 * ls -la Output Parsing Utilities for Symlink Detection
 *
 * @module ls-output-parser
 *
 * @remarks
 * Provides utilities for parsing `ls -la` command output to detect
 * symbolic links. Includes both parsing functions and spawn utilities.
 *
 * IMPORTANT: For production code, prefer native Node.js APIs (fs.lstat,
 * fs.readlink) over parsing ls output. These utilities are primarily
 * useful for debugging, legacy integration, or educational purposes.
 *
 * @example
 * ```typescript
 * import { spawnAndParseSymlinks, parseSymlinks } from './ls-output-parser-utils.js';
 *
 * // Check if node_modules/groundswell is a symlink
 * const symlinks = await spawnAndParseSymlinks('node_modules/groundswell');
 * const hasSymlink = symlinks.some(s => s.name === '.');
 *
 * // Or parse existing ls output
 * const output = `lrwxrwxrwx 1 user group 10 Jan 12 16:12 link -> /target`;
 * const parsed = parseSymlinks(output);
 * ```
 */

import { spawn } from 'node:child_process';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Represents a parsed symlink entry from ls -la output
 *
 * @example
 * ```typescript
 * const symlink: SymlinkInfo = {
 *   name: 'acorn',
 *   target: '../acorn/bin/acorn',
 *   rawLine: 'lrwxrwxrwx 1 dustin dustin   18 Jan 12 16:12 acorn -> ../acorn/bin/acorn'
 * };
 * ```
 */
export interface SymlinkInfo {
  /** Name of the symlink file/directory */
  name: string;

  /** Target path the symlink points to */
  target: string;

  /** Original raw ls -la output line */
  rawLine: string;
}

/**
 * Represents a complete ls -la entry
 *
 * @example
 * ```typescript
 * const entry: LsEntry = {
 *   permissions: 'lrwxrwxrwx',
 *   links: 1,
 *   owner: 'dustin',
 *   group: 'dustin',
 *   size: 18,
 *   date: 'Jan',
 *   time: '12',
 *   name: 'acorn',
 *   isSymlink: true,
 *   symlinkTarget: '../acorn/bin/acorn'
 * };
 * ```
 */
export interface LsEntry {
  /** Permission string (e.g., 'lrwxrwxrwx', '-rw-r--r--') */
  permissions: string;

  /** Number of hard links */
  links: number;

  /** Owner username */
  owner: string;

  /** Group name */
  group: string;

  /** File size in bytes */
  size: number;

  /** Last modified date (e.g., 'Jan', '12') */
  date: string;

  /** Last modified time (e.g., '16:12') or year */
  time: string;

  /** File/directory name */
  name: string;

  /** Whether this entry is a symbolic link */
  isSymlink: boolean;

  /** Symlink target path (only present if isSymlink is true) */
  symlinkTarget?: string;
}

/**
 * Result of spawning ls -la command
 *
 * @example
 * ```typescript
 * const result: LsSpawnResult = {
 *   stdout: 'total 8\nlrwxrwxrwx 1 user group 10 Jan 12 16:12 link -> /target',
 *   stderr: '',
 *   exitCode: 0,
 *   success: true
 * };
 * ```
 */
export interface LsSpawnResult {
  /** Standard output from ls command */
  stdout: string;

  /** Standard error from ls command */
  stderr: string;

  /** Exit code (0 = success) */
  exitCode: number | null;

  /** Whether command succeeded */
  success: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default timeout for ls command in milliseconds
 */
const DEFAULT_LS_TIMEOUT = 5000;

/**
 * Regex pattern to detect symlink arrow notation in ls output
 * Matches ' -> ' followed by target path at end of line
 */
export const SYMLINK_ARROW_PATTERN = / -> .+$/;

/**
 * Regex pattern to detect symlink permission character
 * Matches lines starting with 'l' (symbolic link indicator)
 */
export const SYMLINK_PERMISSION_PATTERN = /^l/;

/**
 * Comprehensive regex for parsing ls -la output lines
 * Groups: permissions, links, owner, group, size, date, time, name+target
 */
export const LS_LINE_REGEX =
  /^(.{10})\s+(\d+)\s+(\S+)\s+(\S+)\s+(\d+)\s+([\w]{3}\s+\d+)\s+([\d:]+)\s+(.+)$/;

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

/**
 * Detects if an ls -la output line represents a symlink using arrow notation
 *
 * @param line - A single line from ls -la output
 * @returns true if the line contains ' -> ' pattern
 *
 * @example
 * ```typescript
 * isSymlinkByArrow('lrwxrwxrwx 1 user group 10 Jan 12 16:12 link -> /target');
 * // Returns: true
 *
 * isSymlinkByArrow('-rw-r--r-- 1 user group 10 Jan 12 16:12 file');
 * // Returns: false
 * ```
 */
export function isSymlinkByArrow(line: string): boolean {
  return SYMLINK_ARROW_PATTERN.test(line.trim());
}

/**
 * Detects if an ls -la output line represents a symlink using permission bit
 *
 * @param line - A single line from ls -la output
 * @returns true if the first character of permissions is 'l'
 *
 * @example
 * ```typescript
 * isSymlinkByPermission('lrwxrwxrwx 1 user group 10 Jan 12 16:12 link -> /target');
 * // Returns: true
 *
 * isSymlinkByPermission('-rw-r--r-- 1 user group 10 Jan 12 16:12 file');
 * // Returns: false
 * ```
 */
export function isSymlinkByPermission(line: string): boolean {
  const trimmed = line.trim();
  const parts = trimmed.split(/\s+/);
  return parts.length > 0 && parts[0].charAt(0) === 'l';
}

/**
 * Detects if an ls -la output line represents a symlink using both indicators
 *
 * This is the most reliable detection method as it requires both:
 * 1. Permission character 'l' at the start
 * 2. Arrow notation ' -> ' at the end
 *
 * @param line - A single line from ls -la output
 * @returns true if both symlink indicators are present
 *
 * @example
 * ```typescript
 * isSymlink('lrwxrwxrwx 1 user group 10 Jan 12 16:12 link -> /target');
 * // Returns: true
 *
 * isSymlink('-rw-r--r-- 1 user group 10 Jan 12 16:12 file');
 * // Returns: false
 * ```
 */
export function isSymlink(line: string): boolean {
  return isSymlinkByPermission(line) && isSymlinkByArrow(line);
}

/**
 * Extracts the symlink target path from an ls -la output line
 *
 * @param line - A single line from ls -la output containing a symlink
 * @returns The target path, or null if not found
 *
 * @example
 * ```typescript
 * extractSymlinkTarget('lrwxrwxrwx 1 user group 10 Jan 12 16:12 link -> /target');
 * // Returns: '/target'
 *
 * extractSymlinkTarget('-rw-r--r-- 1 user group 10 Jan 12 16:12 file');
 * // Returns: null
 * ```
 */
export function extractSymlinkTarget(line: string): string | null {
  const match = line.trim().match(/ -> (.+)$/);
  return match ? match[1].trim() : null;
}

// ============================================================================
// PARSING FUNCTIONS
// ============================================================================

/**
 * Parses a single line of ls -la output into a structured LsEntry object
 *
 * @param line - A single line from ls -la output
 * @returns Parsed entry, or null if line is empty or "total" line
 *
 * @example
 * ```typescript
 * const entry = parseLsLine('lrwxrwxrwx 1 dustin dustin 18 Jan 12 16:12 acorn -> ../acorn/bin/acorn');
 * console.log(entry);
 * // {
 * //   permissions: 'lrwxrwxrwx',
 * //   links: 1,
 * //   owner: 'dustin',
 * //   group: 'dustin',
 * //   size: 18,
 * //   date: 'Jan',
 * //   time: '12',
 * //   name: 'acorn',
 * //   isSymlink: true,
 * //   symlinkTarget: '../acorn/bin/acorn'
 * // }
 * ```
 */
export function parseLsLine(line: string): LsEntry | null {
  const trimmed = line.trim();

  // Skip empty lines and "total" lines
  if (!trimmed || trimmed.startsWith('total ')) {
    return null;
  }

  // Split by whitespace
  const parts = trimmed.split(/\s+/);

  // Basic validation - need at least 8 fields
  if (parts.length < 8) {
    return null;
  }

  const permissions = parts[0];
  const links = parseInt(parts[1], 10);
  const owner = parts[2];
  const group = parts[3];
  const size = parseInt(parts[4], 10);
  const date = parts[5];
  const time = parts[6];

  // Join remaining parts as name (handles names with spaces)
  let name = parts.slice(7).join(' ');
  const isLink = permissions.charAt(0) === 'l';
  let symlinkTarget: string | undefined;

  // Extract symlink target if present
  if (isLink) {
    const arrowIndex = name.indexOf(' -> ');
    if (arrowIndex !== -1) {
      symlinkTarget = name.slice(arrowIndex + 4).trim();
      name = name.slice(0, arrowIndex);
    }
  }

  return {
    permissions,
    links,
    owner,
    group,
    size,
    date,
    time,
    name,
    isSymlink: isLink,
    symlinkTarget,
  };
}

/**
 * Parses ls -la output and extracts all symlink entries
 *
 * @param lsOutput - Full output from `ls -la` command
 * @returns Array of symlink information objects
 *
 * @example
 * ```typescript
 * const output = `
 * total 8
 * lrwxrwxrwx 1 dustin dustin 18 Jan 12 16:12 acorn -> ../acorn/bin/acorn
 * lrwxrwxrwx 1 dustin dustin 22 Jan 12 15:27 esbuild -> ../esbuild/bin/esbuild
 * -rwxr-xr-x 1 dustin dustin 123 Jan 12 16:36 regular-file
 * `;
 *
 * const symlinks = parseSymlinks(output);
 * console.log(symlinks);
 * // [
 * //   { name: 'acorn', target: '../acorn/bin/acorn', rawLine: '...' },
 * //   { name: 'esbuild', target: '../esbuild/bin/esbuild', rawLine: '...' }
 * // ]
 * ```
 */
export function parseSymlinks(lsOutput: string): SymlinkInfo[] {
  const lines = lsOutput.trim().split('\n');
  const symlinks: SymlinkInfo[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and "total" lines
    if (!trimmed || trimmed.startsWith('total ')) {
      continue;
    }

    // Check if symlink using dual detection
    if (!isSymlink(trimmed)) {
      continue;
    }

    // Extract name and target
    const parts = trimmed.split(/\s+/);
    const nameAndTarget = parts.slice(7).join(' ');
    const match = nameAndTarget.match(/^(.+?) -> (.+)$/);

    if (match) {
      symlinks.push({
        name: match[1],
        target: match[2],
        rawLine: line,
      });
    }
  }

  return symlinks;
}

/**
 * Parses all entries from ls -la output
 *
 * @param lsOutput - Full output from `ls -la` command
 * @returns Array of parsed entry objects (excluding "total" line)
 *
 * @example
 * ```typescript
 * const output = `
 * total 8
 * lrwxrwxrwx 1 dustin dustin 18 Jan 12 16:12 link -> /target
 * -rw-r--r-- 1 dustin dustin 123 Jan 12 16:36 file
 * `;
 *
 * const entries = parseAllEntries(output);
 * console.log(entries);
 * // [
 * //   { permissions: 'lrwxrwxrwx', isSymlink: true, name: 'link', ... },
 * //   { permissions: '-rw-r--r--', isSymlink: false, name: 'file', ... }
 * // ]
 * ```
 */
export function parseAllEntries(lsOutput: string): LsEntry[] {
  const lines = lsOutput.trim().split('\n');
  const entries: LsEntry[] = [];

  for (const line of lines) {
    const entry = parseLsLine(line);
    if (entry) {
      entries.push(entry);
    }
  }

  return entries;
}

// ============================================================================
// SPAWN FUNCTIONS
// ============================================================================

/**
 * Spawns `ls -la` command for a given directory and returns the result
 *
 * @param directory - Directory path to run ls in (e.g., 'node_modules/groundswell')
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns Promise resolving to spawn result
 *
 * @example
 * ```typescript
 * const result = await spawnLsLa('node_modules/groundswell');
 *
 * if (result.success) {
 *   console.log('Output:', result.stdout);
 * } else {
 *   console.error('Error:', result.stderr);
 * }
 * ```
 */
export async function spawnLsLa(
  directory: string,
  timeout: number = DEFAULT_LS_TIMEOUT
): Promise<LsSpawnResult> {
  return new Promise(resolve => {
    const child = spawn('ls', ['-la', directory], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false, // CRITICAL: prevents shell injection
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let killed = false;

    // Timeout handler
    const timeoutId = setTimeout(() => {
      timedOut = true;
      killed = true;
      child.kill('SIGTERM');

      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGKILL');
        }
      }, 2000);
    }, timeout);

    // Capture stdout
    if (child.stdout) {
      child.stdout.on('data', (data: Buffer) => {
        if (killed) return;
        stdout += data.toString();
      });
    }

    // Capture stderr
    if (child.stderr) {
      child.stderr.on('data', (data: Buffer) => {
        if (killed) return;
        stderr += data.toString();
      });
    }

    // Handle close
    child.on('close', exitCode => {
      clearTimeout(timeoutId);
      resolve({
        stdout,
        stderr,
        exitCode,
        success: exitCode === 0 && !timedOut && !killed,
      });
    });

    // Handle spawn error
    child.on('error', () => {
      clearTimeout(timeoutId);
      resolve({
        stdout,
        stderr,
        exitCode: null,
        success: false,
      });
    });
  });
}

/**
 * Convenience function that spawns ls -la and parses symlinks in one call
 *
 * @param directory - Directory path to check
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns Promise resolving to array of symlink info objects
 *
 * @example
 * ```typescript
 * const symlinks = await spawnAndParseSymlinks('node_modules/groundswell');
 *
 * if (symlinks.length > 0) {
 *   console.log('Found symlinks:', symlinks);
 * } else {
 *   console.log('No symlinks found');
 * }
 * ```
 */
export async function spawnAndParseSymlinks(
  directory: string,
  timeout: number = DEFAULT_LS_TIMEOUT
): Promise<SymlinkInfo[]> {
  const result = await spawnLsLa(directory, timeout);

  if (!result.success) {
    return [];
  }

  return parseSymlinks(result.stdout);
}

/**
 * Checks if a directory is a symlink by spawning ls -la
 *
 * @param directory - Directory path to check
 * @param timeout - Timeout in milliseconds (default: 5000)
 * @returns Promise resolving to true if directory is a symlink
 *
 * @example
 * ```typescript
 * const isLink = await isDirectorySymlink('node_modules/groundswell');
 *
 * if (isLink) {
 *   console.log('Groundswell is symlinked!');
 * }
 * ```
 */
export async function isDirectorySymlink(
  directory: string,
  timeout: number = DEFAULT_LS_TIMEOUT
): Promise<boolean> {
  const symlinks = await spawnAndParseSymlinks(directory, timeout);

  // Check if the '.' entry (current directory) is a symlink
  return symlinks.some(s => s.name === '.');
}

// ============================================================================
// SPECIALIZED FUNCTIONS
// ============================================================================

/**
 * Checks if node_modules/groundswell is an npm link symlink
 *
 * This is a specialized helper for the Groundswell npm link detection use case.
 * It checks both the package directory and the binary symlink.
 *
 * @returns Promise resolving to symlink status details
 *
 * @example
 * ```typescript
 * const status = await checkGroundswellSymlink();
 *
 * console.log(`Package exists: ${status.packageExists}`);
 * console.log(`Package is symlink: ${status.packageIsSymlink}`);
 * if (status.packageTarget) {
 *   console.log(`Package target: ${status.packageTarget}`);
 * }
 * ```
 */
export async function checkGroundswellSymlink(): Promise<{
  packageExists: boolean;
  packageIsSymlink: boolean;
  packageTarget?: string;
  binExists: boolean;
  binIsSymlink: boolean;
  binTarget?: string;
}> {
  const result = {
    packageExists: false,
    packageIsSymlink: false,
    binExists: false,
    binIsSymlink: false,
  };

  // Check package symlink
  try {
    const pkgSymlinks = await spawnAndParseSymlinks('node_modules/groundswell');
    result.packageExists = true;

    const pkgEntry = pkgSymlinks.find(s => s.name === '.');
    if (pkgEntry) {
      result.packageIsSymlink = true;
      result.packageTarget = pkgEntry.target;
    }
  } catch {
    result.packageExists = false;
  }

  // Check bin symlink
  try {
    const binSymlinks = await spawnAndParseSymlinks('node_modules/.bin/groundswell');
    result.binExists = true;

    if (binSymlinks.length > 0) {
      result.binIsSymlink = true;
      result.binTarget = binSymlinks[0].target;
    }
  } catch {
    result.binExists = false;
  }

  return result;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Formats a symlink info object as a human-readable string
 *
 * @param symlink - Symlink info object
 * @returns Formatted string representation
 *
 * @example
 * ```typescript
 * const symlink = { name: 'acorn', target: '../acorn/bin/acorn', rawLine: '...' };
 * console.log(formatSymlink(symlink));
 * // Output: "acorn -> ../acorn/bin/acorn"
 * ```
 */
export function formatSymlink(symlink: SymlinkInfo): string {
  return `${symlink.name} -> ${symlink.target}`;
}

/**
 * Formats multiple symlink info objects as a table
 *
 * @param symlinks - Array of symlink info objects
 * @returns Formatted table string
 *
 * @example
 * ```typescript
 * const symlinks = [
 *   { name: 'acorn', target: '../acorn/bin/acorn', rawLine: '...' },
 *   { name: 'esbuild', target: '../esbuild/bin/esbuild', rawLine: '...' }
 * ];
 * console.log(formatSymlinkTable(symlinks));
 * // Output:
 * // Name      Target
 * // --------  ------------------------
 * // acorn     ../acorn/bin/acorn
 * // esbuild   ../esbuild/bin/esbuild
 * ```
 */
export function formatSymlinkTable(symlinks: SymlinkInfo[]): string {
  if (symlinks.length === 0) {
    return 'No symlinks found';
  }

  const maxNameLength = Math.max(...symlinks.map(s => s.name.length), 4);
  const namePadding = maxNameLength + 2;

  const header = `Name${' '.repeat(namePadding - 4)}Target\n`;
  const separator = `${'-'.repeat(namePadding)}  ${'-'.repeat(40)}\n`;
  const rows = symlinks
    .map(s => {
      const namePadded = s.name.padEnd(namePadding);
      const targetTruncated =
        s.target.length > 40 ? s.target.slice(0, 37) + '...' : s.target;
      return `${namePadded}  ${targetTruncated}\n`;
    })
    .join('');

  return header + separator + rows;
}
