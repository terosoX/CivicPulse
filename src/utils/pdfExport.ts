import { Complaint } from '../types';

function escapeHtml(value: string | undefined | null): string {
  if (!value) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function triggerIframePrintOrDownload(html: string, downloadFileName: string): void {
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc && iframe.contentWindow) {
      doc.open();
      doc.write(html);
      doc.close();

      const cleanup = () => {
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 1200);
      };

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          cleanup();
        } catch {
          cleanup();
          downloadHtmlFallback(html, downloadFileName);
        }
      }, 250);
      return;
    }
  } catch {
    // Fallback to clean HTML download
  }

  downloadHtmlFallback(html, downloadFileName);
}

function downloadHtmlFallback(html: string, fileName: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportComplaintsToCSV(complaints: Complaint[]) {
  const headers = [
    'Ticket Number',
    'Title',
    'Category',
    'Priority',
    'Status',
    'Ward',
    'Address',
    'Assigned Department',
    'Assigned Officer',
    'Citizen Name',
    'Date Reported',
    'Estimated Resolution'
  ];

  const rows = complaints.map(c => [
    `"${c.ticketNumber}"`,
    `"${c.title.replace(/"/g, '""')}"`,
    `"${c.category}"`,
    `"${c.priority}"`,
    `"${c.status}"`,
    `"${c.location.ward}"`,
    `"${c.location.address.replace(/"/g, '""')}"`,
    `"${c.departmentAssigned || 'Unassigned'}"`,
    `"${c.officerAssigned || 'Unassigned'}"`,
    `"${c.isAnonymous ? 'Anonymous' : c.citizenName}"`,
    `"${new Date(c.createdAt).toLocaleDateString()}"`,
    `"${c.estimatedResolutionDate ? new Date(c.estimatedResolutionDate).toLocaleDateString() : 'N/A'}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Civic_Complaints_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportResolutionCertificatePDF(complaint: Complaint) {
  const resolutionTime = complaint.updatedAt ? new Date(complaint.updatedAt).toLocaleString() : new Date().toLocaleString();
  const createdTime = new Date(complaint.createdAt).toLocaleString();
  const refId = `REF-${Math.floor(100000 + Math.random() * 900000)}`;

  const beforeImg = complaint.beforeImage || complaint.images[0] || '';
  const afterImg = complaint.afterImage || '';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Resolution Certificate - ${escapeHtml(complaint.ticketNumber)}</title>
        <style>
          @page { size: A4 portrait; margin: 20mm; }
          body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; margin: 0; padding: 25px; color: #0f172a; background: #fff; }
          .certificate-container { border: 8px double #1e3a8a; padding: 30px; border-radius: 12px; position: relative; background: #ffffff; }
          .watermark { position: absolute; top: 35%; left: 20%; right: 20%; opacity: 0.04; font-size: 80px; font-weight: 900; text-align: center; color: #1e3a8a; transform: rotate(-25deg); pointer-events: none; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 25px; }
          .crest { font-size: 26px; font-weight: 800; color: #1e3a8a; letter-spacing: 2px; }
          .sub-header { font-size: 13px; font-weight: 600; color: #3b82f6; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }
          .cert-title { font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 15px; text-decoration: underline; text-underline-offset: 6px; }
          .grid-details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 25px; font-size: 13px; }
          .detail-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; }
          .label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 4px; }
          .value { font-size: 14px; font-weight: 700; color: #0f172a; }
          .photos-heading { font-size: 14px; font-weight: 700; margin-top: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; color: #1e293b; }
          .photo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 12px; }
          .photo-card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; background: #f1f5f9; text-align: center; }
          .photo-card img { width: 100%; height: 160px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; }
          .photo-placeholder { width: 100%; height: 160px; display: flex; align-items: center; justify-content: center; background: #e2e8f0; color: #475569; font-size: 12px; font-weight: 600; border-radius: 6px; }
          .photo-label { font-size: 11px; font-weight: 700; color: #475569; margin-top: 6px; }
          .seal-section { display: flex; justify-content: space-between; align-items: center; margin-top: 35px; border-top: 2px dashed #cbd5e1; padding-top: 20px; }
          .qr-box { display: flex; align-items: center; gap: 12px; }
          .qr-code { width: 70px; height: 70px; border: 1px solid #1e293b; padding: 4px; background: #fff; }
          .digital-seal { text-align: right; }
          .seal-badge { display: inline-block; padding: 8px 16px; background: #dcfce7; border: 2px solid #166534; color: #14532d; font-weight: 800; font-size: 12px; border-radius: 50px; text-transform: uppercase; letter-spacing: 1px; }
          .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 25px; }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <div class="watermark">CIVICPULSE VERIFIED</div>
          
          <div class="header">
            <div class="crest">SMART CITY MUNICIPAL CORPORATION</div>
            <div class="sub-header">Department of Urban Infrastructure &amp; Public Quality</div>
            <div class="cert-title">OFFICIAL CIVIC RESOLUTION CERTIFICATE</div>
          </div>

          <p style="text-align: center; font-size: 13px; color: #475569;">
            This document officially certifies that the civic grievance logged under ticket reference <strong>${escapeHtml(complaint.ticketNumber)}</strong> has been inspected, remediated, and verified by assigned municipal officers in accordance with Municipal Quality SLA Standards.
          </p>

          <div class="grid-details">
            <div class="detail-box">
              <div class="label">Complaint Ticket #</div>
              <div class="value">${escapeHtml(complaint.ticketNumber)}</div>
            </div>
            <div class="detail-box">
              <div class="label">Issue Category</div>
              <div class="value">${escapeHtml(complaint.category)}</div>
            </div>
            <div class="detail-box">
              <div class="label">Assigned Department</div>
              <div class="value">${escapeHtml(complaint.departmentAssigned || 'Municipal Public Works')}</div>
            </div>
            <div class="detail-box">
              <div class="label">Inspecting Field Officer</div>
              <div class="value">${escapeHtml(complaint.officerAssigned || 'Eng. Field Inspector')}</div>
            </div>
            <div class="detail-box">
              <div class="label">Reported Timestamp</div>
              <div class="value">${escapeHtml(createdTime)}</div>
            </div>
            <div class="detail-box">
              <div class="label">Resolution Timestamp</div>
              <div class="value">${escapeHtml(resolutionTime)}</div>
            </div>
          </div>

          <div class="photos-heading">Field Remediation Evidence Audit</div>
          <div class="photo-grid">
            <div class="photo-card">
              ${beforeImg ? `<img src="${escapeHtml(beforeImg)}" alt="Before Work" />` : '<div class="photo-placeholder">Reported Defect Logged</div>'}
              <div class="photo-label">BEFORE: Reported Defect State</div>
            </div>
            <div class="photo-card">
              ${afterImg ? `<img src="${escapeHtml(afterImg)}" alt="After Work" />` : '<div class="photo-placeholder">Verified Resolution State</div>'}
              <div class="photo-label">AFTER: Verified Resolution State</div>
            </div>
          </div>

          <div class="seal-section">
            <div class="qr-box">
              <svg class="qr-code" viewBox="0 0 100 100">
                <rect width="100" height="100" fill="#ffffff" />
                <path d="M10,10 h30 v30 h-30 z M15,15 v20 h20 v-20 z M20,20 h10 v10 h-10 z" fill="#0f172a" />
                <path d="M60,10 h30 v30 h-30 z M65,15 v20 h20 v-20 z M70,20 h10 v10 h-10 z" fill="#0f172a" />
                <path d="M10,60 h30 v30 h-30 z M15,65 v20 h20 v-20 z M20,70 h10 v10 h-10 z" fill="#0f172a" />
                <rect x="50" y="50" width="10" height="10" fill="#2563eb" />
                <rect x="70" y="50" width="10" height="20" fill="#0f172a" />
                <rect x="50" y="70" width="20" height="10" fill="#0f172a" />
              </svg>
              <div>
                <div style="font-weight: 700; font-size: 12px;">Verification Reference</div>
                <div style="font-size: 10px; color: #64748b;">Ref: ${refId}</div>
              </div>
            </div>

            <div class="digital-seal">
              <div class="seal-badge">MUNICIPAL SEAL VERIFIED</div>
              <div style="font-size: 11px; color: #475569; margin-top: 6px; font-weight: 600;">Smart City Chief Municipal Engineer</div>
            </div>
          </div>

          <div class="footer">
            Digital Certificate issued under the authority of Smart City Municipal Corporation • Audit Ref: AL-${Date.now()}
          </div>
        </div>
      </body>
    </html>
  `;

  triggerIframePrintOrDownload(html, `Resolution_Certificate_${complaint.ticketNumber}.html`);
}

export function exportComplaintsToPDF(complaints: Complaint[], reportTitle: string = 'Municipal Civic Issue Report') {
  const refId = `REF-${Math.floor(100000 + Math.random() * 900000)}`;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${escapeHtml(reportTitle)} - Smart City Municipal Portal</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; margin: 30px; color: #1e293b; background: #fff; }
          .header { border-bottom: 2px solid #2563eb; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 22px; font-weight: bold; color: #0f172a; }
          .subtitle { font-size: 13px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
          th { background: #f1f5f9; font-weight: 600; color: #334155; }
          tr:nth-child(even) { background: #f8fafc; }
          .badge { padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 10px; display: inline-block; }
          .badge-critical { background: #fee2e2; color: #991b1b; }
          .badge-resolved { background: #dcfce7; color: #166534; }
          .badge-pending { background: #fef3c7; color: #92400e; }
          .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">SMART CITY MUNICIPAL CORPORATION</div>
            <div class="subtitle">${escapeHtml(reportTitle)}</div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #64748b;">
            Generated Date: ${escapeHtml(new Date().toLocaleDateString())}<br>
            Time: ${escapeHtml(new Date().toLocaleTimeString())}
          </div>
        </div>

        <h3>Logged Civic Incidents &amp; Field Resolutions (${complaints.length} Records)</h3>
        <table>
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Issue Title</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Ward</th>
              <th>Assigned Department</th>
              <th>Officer</th>
            </tr>
          </thead>
          <tbody>
            ${complaints.map(c => `
              <tr>
                <td><strong>${escapeHtml(c.ticketNumber)}</strong></td>
                <td>${escapeHtml(c.title)}</td>
                <td>${escapeHtml(c.category)}</td>
                <td><span class="badge ${c.priority === 'Critical' ? 'badge-critical' : ''}">${escapeHtml(c.priority)}</span></td>
                <td><span class="badge ${c.status === 'Resolved' || c.status === 'Closed' ? 'badge-resolved' : 'badge-pending'}">${escapeHtml(c.status)}</span></td>
                <td>${escapeHtml(c.location.ward)}</td>
                <td>${escapeHtml(c.departmentAssigned || 'Unassigned')}</td>
                <td>${escapeHtml(c.officerAssigned || 'Unassigned')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Official Municipal Record • Smart City Civic Issue &amp; Resolution System • Document Ref ID: ${refId}
        </div>
      </body>
    </html>
  `;

  triggerIframePrintOrDownload(html, `CivicPulse_Report_${new Date().toISOString().slice(0, 10)}.html`);
}
