const assert = require('node:assert/strict');
const { audit, parseRows } = require('./app.js');
const rows = parseRows('title,type,owner,publish_at,asset_url\nWinter Guide,magazine,Asha,2026-11-01,https://example.com/guide\nWinter Guide,video,,bad-date,');
const result = audit(rows);
assert.equal(result.rowCount, 2);
assert.ok(result.issues.some((issue) => issue.issue.includes('appears on rows')));
assert.ok(result.issues.some((issue) => issue.issue.includes('no asset URL')));
console.log('3 tests passed');
