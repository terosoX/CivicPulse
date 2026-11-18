import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileText } from 'lucide-react';
import { Complaint } from '../../types';
import { exportComplaintsToPDF } from '../../utils/pdfExport';
import { translateStatus } from '../../utils/i18n';

interface ReportGenerationProps {
  complaints: Complaint[];
}

export default function ReportGeneration({ complaints }: ReportGenerationProps) {
  const { t, i18n } = useTranslation();
  const [department, setDepartment] = useState('All');
  const [status, setStatus] = useState('All');

  const handleExportPDF = () => {
    let list = complaints;
    if (department !== 'All') list = list.filter(c => c.departmentAssigned === department);
    if (status !== 'All') list = list.filter(c => c.status === status);

    exportComplaintsToPDF(list, `Municipal_Executive_Audit_${department}_${status}`);
  };

  const handleExportCSV = () => {
    let list = complaints;
    if (department !== 'All') list = list.filter(c => c.departmentAssigned === department);
    if (status !== 'All') list = list.filter(c => c.status === status);

    const headers = ['Ticket #', 'Title', 'Category', 'Priority', 'Status', 'Ward', 'Created At'];
    const rows = list.map(c => [
      c.ticketNumber,
      `"${c.title.replace(/"/g, '""')}"`,
      c.category,
      c.priority,
      c.status,
      c.location.ward,
      c.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Municipal_Grievance_Data_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 max-w-2xl mx-auto shadow-xs text-left">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-blue-600" />
        <h3 className="font-bold text-base text-slate-900 dark:text-white">
          {i18n.language === 'hi' ? 'नगर निगम लेखा परीक्षा व प्रदर्शन रिपोर्ट जनरेटर' : 'Municipal Audit & Performance Report Generator'}
        </h3>
      </div>
      <p className="text-xs text-slate-500 mb-6">
        {i18n.language === 'hi'
          ? 'बोर्ड बैठकों, आरटीआई ऑडिट और विभागीय समीक्षा के लिए मुद्रण योग्य पीडीएफ रिपोर्ट या सीएसवी स्प्रेडशीट तैयार करें।'
          : 'Generate printable PDF reports or CSV spreadsheets for municipal board meetings, RTI audits, and department review sessions.'}
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {i18n.language === 'hi' ? 'विभागीय दायरा' : 'Department Scope'}
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-slate-50 dark:bg-slate-900"
          >
            <option value="All">{i18n.language === 'hi' ? 'सभी विभाग' : 'All Departments'}</option>
            <option value="Department of Roads & Infrastructure">{i18n.language === 'hi' ? 'सड़क व बुनियादी ढांचा' : 'Roads & Infrastructure'}</option>
            <option value="Department of Solid Waste Management">{i18n.language === 'hi' ? 'ठोस कचरा प्रबंधन' : 'Solid Waste'}</option>
            <option value="Department of Water & Hydro Works">{i18n.language === 'hi' ? 'जल आपूर्ति व जलकार्य' : 'Water Works'}</option>
            <option value="Department of Urban Electrical & Lighting">{i18n.language === 'hi' ? 'विद्युत व प्रकाश व्यवस्था' : 'Electrical & Lighting'}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {i18n.language === 'hi' ? 'स्थिति का दायरा' : 'Status Scope'}
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold bg-slate-50 dark:bg-slate-900"
          >
            <option value="All">{i18n.language === 'hi' ? 'सभी स्थितियाँ' : 'All Statuses'}</option>
            <option value="Submitted">{translateStatus('Submitted')}</option>
            <option value="Work Started">{translateStatus('Work Started')}</option>
            <option value="Resolved">{translateStatus('Resolved')}</option>
          </select>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExportPDF}
            className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{i18n.language === 'hi' ? 'फॉर्मेटेड पीडीएफ डाउनलोड करें' : 'Download Formatted PDF Audit'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{i18n.language === 'hi' ? 'रॉ सीएसवी डेटासेट एक्सपोर्ट करें' : 'Export Raw CSV Dataset'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
