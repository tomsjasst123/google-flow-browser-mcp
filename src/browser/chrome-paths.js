import path from 'path';
import fs from 'fs';
import os from 'os';
import { get } from '../utils/config.js';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');

/**
 * Locate the Chrome executable. `chromePath` in config wins; otherwise
 * check the standard install locations for the current platform.
 */
export function findChromePath() {
  const configured = get('chromePath');
  if (configured) return configured;

  const candidates = {
    win32: [
      path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google/Chrome/Application/chrome.exe'),
      path.join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google/Chrome/Application/chrome.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
    ],
    darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
    linux: ['/opt/google/chrome/chrome', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'],
  }[process.platform] || [];

  return candidates.find(p => fs.existsSync(p)) || candidates[0];
}

/** Chrome's user data dir: config `chromeUserDataDir`, or the platform default. */
export function getUserDataDir() {
  const configured = get('chromeUserDataDir');
  if (configured) return configured;

  const home = os.homedir();
  if (process.platform === 'win32') {
    return path.join(process.env.LOCALAPPDATA || path.join(home, 'AppData/Local'), 'Google/Chrome/User Data');
  }
  if (process.platform === 'darwin') {
    return path.join(home, 'Library/Application Support/Google/Chrome');
  }
  return path.join(home, '.config/google-chrome');
}

export function getProfileName() {
  return get('chromeProfile', 'Default');
}

export function getProfileSource() {
  return path.join(getUserDataDir(), getProfileName());
}

/**
 * How the automation profile is obtained:
 *  - "copy": copy the configured Chrome profile into a temp dir (Linux only in
 *    practice — on Windows/macOS cookies are encrypted with a key bound to the
 *    original profile, so a copy comes up signed out).
 *  - "persistent": a dedicated user-data-dir inside the project that is never
 *    deleted; sign in once and the session is kept.
 */
export function getProfileMode() {
  return get('profileMode', process.platform === 'linux' ? 'copy' : 'persistent');
}

export function getPersistentProfileDir() {
  const configured = get('persistentProfileDir');
  if (configured) return path.resolve(REPO_ROOT, configured);
  return path.join(REPO_ROOT, 'chrome-profile-kiara');
}

export function makeTempProfileDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-kiara-cdp-'));
}
