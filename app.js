(function (root) {
  function parseCsv(text) {
    const lines = String(text || '').trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const cells = line.split(',').map((cell) => cell.trim());
      return Object.fromEntries(headers.map((header, index) => [header, cells[index] || '']));
    });
  }
  function parseRows(text) {
    const input = String(text || '').trim();
    if (!input) return [];
    try { const parsed = JSON.parse(input); return Array.isArray(parsed) ? parsed.filter((row) => row && typeof row === 'object') : []; } catch (_) { return parseCsv(input); }
  }
  function audit(rows) {
    const issues = [];
    const seen = new Map();
    rows.forEach((row, index) => {
      const line = index + 1;
      const title = String(row.title || '').trim();
      const type = String(row.type || row.format || '').trim().toLowerCase();
      const publishAt = Date.parse(row.publish_at || row.release_date || '');
      const owner = String(row.owner || '').trim();
      const assetUrl = String(row.asset_url || row.video_url || row.magazine_url || '').trim();
      if (!title) issues.push({ severity: 'high', issue: `Row ${line} is missing a title`, action: 'Block launch until the catalog record is named.' });
      if (!['magazine', 'marketplace', 'stream'].includes(type)) issues.push({ severity: 'medium', issue: `Row ${line} type "${type || 'missing'}" is not magazine, marketplace or stream`, action: 'Map the item to a supported Holiday World surface.' });
      if (!owner) issues.push({ severity: 'medium', issue: `Row ${line} has no owner`, action: 'Assign editorial or marketplace ownership before release.' });
      if (!assetUrl) issues.push({ severity: 'high', issue: `Row ${line} has no asset URL`, action: 'Attach the magazine, product or stream asset before publishing.' });
      if (String(row.publish_at || row.release_date || '').trim() && Number.isNaN(publishAt)) issues.push({ severity: 'medium', issue: `Row ${line} release date is invalid`, action: 'Normalize the date before scheduling.' });
      if (title) {
        const key = title.toLowerCase();
        if (seen.has(key)) issues.push({ severity: 'medium', issue: `Title "${title}" appears on rows ${seen.get(key)} and ${line}`, action: 'Check whether this is a duplicate catalog entry.' });
        seen.set(key, line);
      }
    });
    const score = Math.max(0, 100 - issues.reduce((sum, issue) => sum + (issue.severity === 'high' ? 18 : 8), 0));
    return { rowCount: rows.length, score, issues };
  }
  function render(result) {
    const output = document.querySelector('#results');
    if (!output) return;
    if (!result.rowCount) { output.innerHTML = '<p class="empty-state">Paste launch items to audit the catalog.</p>'; return; }
    const issueItems = result.issues.length ? result.issues.map((issue) => `<li><strong>${issue.severity.toUpperCase()}:</strong> ${issue.issue}<br><span>${issue.action}</span></li>`).join('') : '<li>No blocking launch issues found.</li>';
    output.innerHTML = `<article><div class="score-row"><h4>Launch readiness</h4><span class="score">${result.score}/100</span></div><p>${result.rowCount} catalog items inspected.</p><ul>${issueItems}</ul></article>`;
  }
  function boot() {
    const input = document.querySelector('#recordInput');
    const button = document.querySelector('#auditButton');
    if (input && button) button.addEventListener('click', () => render(audit(parseRows(input.value))));
  }
  const api = { audit, parseRows, parseCsv };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root.document) root.HolidayContentLaunch = api;
  if (root.document) root.addEventListener('DOMContentLoaded', boot);
})(typeof window !== 'undefined' ? window : globalThis);
