const escapeCsv = (value) => {
  const text = String(value ?? '');
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
};

function buildReportRows(issues = []) {
  return issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    category: issue.category,
    status: issue.status,
    ward: issue.wards?.name || issue.ward_number || '',
    city: issue.city || issue.wards?.city || '',
    created_at: issue.created_at,
    resolved_at: issue.resolved_at || '',
    upvotes: issue.upvote_count || 0,
    escalated: issue.escalated_at ? 'yes' : 'no',
  }));
}

function buildCsv({ request, identity, stats, issues }) {
  const summary = [
    ['report_id', request.id],
    ['representative', identity.display_name || request.rep_type],
    ['role', request.rep_type],
    ['month', request.month],
    ['year', request.year],
    ['total_issues', stats.total_issues],
    ['resolved_issues', stats.resolved_issues],
    ['in_progress_issues', stats.in_progress_issues],
    ['escalated_issues', stats.escalated_issues],
    ['sla_breaches', stats.sla_breaches],
    ['resolution_rate', `${stats.resolution_rate}%`],
    ['avg_resolution_days', stats.avg_resolution_days],
    [],
  ];

  const headers = ['id', 'title', 'category', 'status', 'ward', 'city', 'created_at', 'resolved_at', 'upvotes', 'escalated'];
  const rows = buildReportRows(issues);
  return [
    ...summary.map((row) => row.map(escapeCsv).join(',')),
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(',')),
  ].join('\n');
}

const escapePdf = (value) => String(value ?? '')
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)');

function simplePdf(lines) {
  const safeLines = lines.slice(0, 42).map((line) => escapePdf(line).slice(0, 110));
  const stream = [
    'BT',
    '/F1 18 Tf',
    '50 790 Td',
    `(${safeLines[0] || 'CivicsPulse report card'}) Tj`,
    '/F1 11 Tf',
    '0 -28 Td',
    ...safeLines.slice(1).flatMap((line) => [`(${line}) Tj`, '0 -16 Td']),
    'ET',
  ].join('\n');

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];

  let body = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    body += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(body);
}

function buildPdf({ request, identity, stats, issues }) {
  const topIssues = issues.slice(0, 12).map((issue, index) => (
    `${index + 1}. ${issue.title} | ${issue.status} | ${issue.wards?.name || issue.city || 'Mapped area'}`
  ));

  return simplePdf([
    `CivicsPulse Report Card - ${request.month}/${request.year}`,
    `Representative: ${identity.display_name || request.rep_type}`,
    `Role: ${request.rep_type}`,
    `Total issues: ${stats.total_issues}`,
    `Resolved: ${stats.resolved_issues}`,
    `In progress: ${stats.in_progress_issues}`,
    `Escalated: ${stats.escalated_issues}`,
    `SLA breaches: ${stats.sla_breaches}`,
    `Resolution rate: ${stats.resolution_rate}%`,
    `Average resolution days: ${stats.avg_resolution_days}`,
    '',
    'Tagged posts',
    ...topIssues,
  ]);
}

module.exports = { buildCsv, buildPdf };
