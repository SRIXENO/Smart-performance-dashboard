'use client';

import { useMemo, useState } from 'react';
import { importAPI } from '@/lib/api';

type PreviewRow = {
  rowNumber: number;
  valid: boolean;
  errors: string[];
  source?: {
    studentId?: string;
    subjectCode?: string;
    attendancePercentage?: string;
    marks?: string;
    semester?: string;
  };
  normalized?: {
    studentId: string;
    studentName: string;
    subjectCode: string;
    subjectName: string;
    semester: string;
    attendancePercentage: number;
    marks: number;
  } | null;
};

export default function Import() {
  const [file, setFile] = useState<File | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingImport, setLoadingImport] = useState(false);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [validRows, setValidRows] = useState<any[]>([]);
  const [rejectReportCsv, setRejectReportCsv] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const summary = useMemo(() => ({
    totalRows: previewRows.length,
    validRows: previewRows.filter((row) => row.valid).length,
    invalidRows: previewRows.filter((row) => !row.valid).length,
  }), [previewRows]);

  const sampleCsv = `studentId,subjectCode,attendancePercentage,marks,semester
STU000001,CS301,88,74,Semester 5
STU000002,CS302,91,82,Semester 5`;

  const downloadText = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePreview = async () => {
    if (!file) {
      setError('Please choose a CSV file first.');
      return;
    }

    setLoadingPreview(true);
    setError('');
    setMessage('');
    try {
      const response = await importAPI.previewPerformanceCsv(file);
      const data = response.data?.data;
      setPreviewRows(data?.rows || []);
      setValidRows(data?.validRows || []);
      setRejectReportCsv(data?.invalidRows?.length ? data.invalidRows.map((row: PreviewRow) => [
        row.rowNumber,
        row.source?.studentId || '',
        row.source?.subjectCode || '',
        row.source?.attendancePercentage || '',
        row.source?.marks || '',
        row.source?.semester || '',
        row.errors.join(' | '),
      ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n') : '');
      setMessage(`Preview ready. ${data?.summary?.validRows || 0} valid row(s), ${data?.summary?.invalidRows || 0} invalid row(s).`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to preview CSV');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleImport = async () => {
    if (!validRows.length) {
      setError('No valid rows available to import.');
      return;
    }
    setLoadingImport(true);
    setError('');
    setMessage('');
    try {
      const response = await importAPI.commitPerformanceImport(validRows, true);
      const data = response.data?.data;
      setRejectReportCsv(data?.rejectReportCsv || '');
      setMessage(`Import completed. Imported ${data?.summary?.importedRows || 0} row(s), rejected ${data?.summary?.rejectedRows || 0} row(s).`);
    } catch (err: any) {
      const data = err.response?.data?.data;
      setRejectReportCsv(data?.rejectReportCsv || '');
      setError(err.response?.data?.error || 'Failed to import CSV');
    } finally {
      setLoadingImport(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Data Import</h1>
          <p className="text-sm text-gray-500 mt-1">Preview and import performance CSV files with row-level validation.</p>
        </div>
        <button
          onClick={() => downloadText('performance-import-sample.csv', sampleCsv)}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Download Sample CSV
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          Required columns: `studentId`, `subjectCode`, `attendancePercentage`, `marks`, `semester`
        </div>

        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handlePreview}
            disabled={loadingPreview || !file}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loadingPreview ? 'Previewing...' : 'Preview CSV'}
          </button>
          <button
            onClick={handleImport}
            disabled={loadingImport || validRows.length === 0}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loadingImport ? 'Importing...' : 'Import Valid Rows'}
          </button>
          {rejectReportCsv && (
            <button
              onClick={() => downloadText('performance-import-reject-report.csv', `rowNumber,studentId,subjectCode,attendancePercentage,marks,semester,errors\n${rejectReportCsv}`)}
              className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
            >
              Download Reject Report
            </button>
          )}
        </div>
      </div>

      {(message || error) && (
        <div className={`rounded-md border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {error || message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg bg-white shadow p-4">
          <p className="text-xs uppercase text-gray-500">Total Rows</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{summary.totalRows}</p>
        </div>
        <div className="rounded-lg bg-white shadow p-4">
          <p className="text-xs uppercase text-gray-500">Valid Rows</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{summary.validRows}</p>
        </div>
        <div className="rounded-lg bg-white shadow p-4">
          <p className="text-xs uppercase text-gray-500">Invalid Rows</p>
          <p className="mt-2 text-2xl font-semibold text-red-600">{summary.invalidRows}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-900">Preview</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Row</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Attendance</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Marks</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Semester</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {previewRows.map((row) => (
                <tr key={row.rowNumber} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">{row.rowNumber}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{row.normalized?.studentName || row.source?.studentId || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{row.normalized?.subjectName || row.source?.subjectCode || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{row.normalized?.attendancePercentage ?? row.source?.attendancePercentage ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{row.normalized?.marks ?? row.source?.marks ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{row.normalized?.semester || row.source?.semester || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    {row.valid ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Valid</span>
                    ) : (
                      <div className="space-y-1">
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">Invalid</span>
                        <p className="text-xs text-red-600">{row.errors.join(' | ')}</p>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {previewRows.length === 0 && (
          <div className="py-12 text-center text-gray-500">Upload a CSV and click Preview CSV to validate rows.</div>
        )}
      </div>
    </div>
  );
}
