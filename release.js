/**
 * Vista Changelog Generator
 *
 * Official: https://github.com/vercel/release (npm: release)
 * Install:  pnpm add -Dw release
 * Run:      pnpm release
 *
 * Generates categorized changelogs from GitHub Pull Requests.
 * Used with `release` npm package for automated releases.
 *
 * PR Label → Section mapping:
 *   type: vista    → Core Changes
 *   documentation  → Documentation Changes
 *   bug            → Bug Fixes
 *   performance    → Performance Improvements
 *   (unlabeled)    → Misc Changes
 */

const SECTION_LABEL_MAP = {
  'Core Changes': 'type: vista',
  'Bug Fixes': 'bug',
  'Performance Improvements': 'performance',
  'Documentation Changes': 'documentation',
  Infrastructure: 'infrastructure',
};
const FALLBACK_SECTION = 'Misc Changes';
const IGNORED_LABELS = ['skip-changelog', 'dependencies'];

/**
 * Extract PR number from a commit message.
 * Matches patterns like "(#123)" at the end of the first line.
 */
function extractPRNumber(commitMessage) {
  const match = commitMessage.match(/\(#(\d+)\)\s*$/m);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Categorize a PR into a changelog section based on its labels.
 */
function categorize(prLabels) {
  for (const [section, label] of Object.entries(SECTION_LABEL_MAP)) {
    if (prLabels.some((l) => l.name === label || l === label)) {
      return section;
    }
  }
  return FALLBACK_SECTION;
}

/**
 * Generate changelog from commit + PR metadata.
 *
 * @param {string} _markdown - Existing markdown (unused, required by `release` API)
 * @param {object} metadata  - { commits, authors, githubConnection, repoDetails }
 * @returns {string} Formatted changelog markdown
 */
module.exports = async function generateChangelog(_markdown, metadata) {
  const { commits, authors, githubConnection, repoDetails } = metadata;

  if (!commits || commits.length === 0) {
    return '> No changes recorded.';
  }

  // Group commits by section
  const sections = {};
  const creditSet = new Set();

  for (const commit of commits) {
    const prNumber = extractPRNumber(commit.subject || commit.message || '');
    const firstLine = (commit.subject || commit.message || '').split('\n')[0].trim();

    // Skip merge commits
    if (firstLine.startsWith('Merge ')) continue;

    let section = FALLBACK_SECTION;
    let prUrl = '';

    // If we can fetch PR details from GitHub
    if (prNumber && githubConnection) {
      try {
        const { owner, repo } = repoDetails;
        const pr = await githubConnection.pulls.get({
          owner,
          repo,
          pull_number: prNumber,
        });

        const labels = pr.data.labels || [];

        // Skip ignored labels
        if (labels.some((l) => IGNORED_LABELS.includes(l.name))) continue;

        section = categorize(labels);
        prUrl = pr.data.html_url;

        // Collect contributors
        if (pr.data.user?.login) {
          creditSet.add(`@${pr.data.user.login}`);
        }
      } catch (e) {
        // PR fetch failed — use commit info
      }
    }

    if (!sections[section]) sections[section] = [];

    const prRef = prNumber ? (prUrl ? `[#${prNumber}](${prUrl})` : `#${prNumber}`) : '';
    sections[section].push(`- ${firstLine} ${prRef}`.trim());
  }

  // Build markdown output
  const lines = [];

  // Ordered sections
  const orderedSections = [...Object.keys(SECTION_LABEL_MAP), FALLBACK_SECTION];

  for (const sectionName of orderedSections) {
    const items = sections[sectionName];
    if (!items || items.length === 0) continue;

    lines.push(`### ${sectionName}`);
    lines.push('');
    items.forEach((item) => lines.push(item));
    lines.push('');
  }

  // Credits
  if (creditSet.size > 0) {
    const sortedCredits = Array.from(creditSet).sort();
    lines.push('### Credits');
    lines.push('');
    lines.push(`Huge thanks to ${sortedCredits.join(', ')} for helping!`);
    lines.push('');
  }

  return lines.join('\n') || '> No notable changes.';
};
