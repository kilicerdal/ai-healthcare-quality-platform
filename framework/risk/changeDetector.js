const { execFileSync } = require('child_process');

class ChangeDetector {
  getChangedFiles(baseRef = 'HEAD') {
    const committed = execFileSync(
      'git',
      ['diff', '--name-only', baseRef],
      { encoding: 'utf8' }
    ).trim();

    const untracked = execFileSync(
      'git',
      ['ls-files', '--others', '--exclude-standard'],
      { encoding: 'utf8' }
    ).trim();

    return [...new Set(
      [...committed.split('\n'), ...untracked.split('\n')]
        .filter(Boolean)
    )];
  }
}

module.exports = { ChangeDetector };
