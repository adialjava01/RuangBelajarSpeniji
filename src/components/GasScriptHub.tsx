import { useState } from 'react';
import { CODE_GS, UJIAN_CONTROLLER_GS, FRONTEND_INDEX_HTML, FRONTEND_GURU_HTML, SPREADSHEET_STRUCTURE } from '../data/gasCode';
import { Clipboard, Check, Database, FileCode, HelpCircle, Download } from 'lucide-react';

export default function GasScriptHub() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadAllScripts = () => {
    const zipContent = `
=== SPREADSHEET STRUCTURE ===
${SPREADSHEET_STRUCTURE}

=== Code.gs ===
${CODE_GS}

=== UjianController.gs ===
${UJIAN_CONTROLLER_GS}

=== Index.html ===
${FRONTEND_INDEX_HTML}

=== DashboardGuru.html ===
${FRONTEND_GURU_HTML}
    `;
    const blob = new Blob([zipContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Jurnal_Mengajar_Guru_SMP_GAS_Scripts.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-7xl mx-auto space-y-8" id="gas-script-hub">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <span className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
            Google Workspace Architecture
          </span>
          <h2 className="text-2xl font-bold text-slate-950 mt-2">
            Pusat Integrasi Google Apps Script (GAS)
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Unduh atau salin kode backend dan arsitektur Spreadsheet untuk diunggah langsung ke akun Google Workspace Anda.
          </p>
        </div>
        <button
          onClick={downloadAllScripts}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Unduh Semua Script (.txt)</span>
        </button>
      </div>

      {/* STEP-BY-STEP SETUP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border border-slate-100 rounded-xl p-5 bg-slate-50/50">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-3">1</div>
          <h4 className="font-semibold text-slate-900 text-sm">Buat Google Spreadsheet</h4>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Buat file Spreadsheet baru di Google Drive Anda. Siapkan sheet dengan nama yang sesuai dengan kolom-kolom database di panel sebelah kanan.
          </p>
        </div>
        <div className="border border-slate-100 rounded-xl p-5 bg-slate-50/50">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-3">2</div>
          <h4 className="font-semibold text-slate-900 text-sm">Buka Apps Script Editor</h4>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Di Google Spreadsheet Anda, klik menu <strong className="text-slate-700">Ekstensi</strong> &gt; <strong className="text-slate-700">Apps Script</strong>. Ini akan membuka editor script native milik Google.
          </p>
        </div>
        <div className="border border-slate-100 rounded-xl p-5 bg-slate-50/50">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-3">3</div>
          <h4 className="font-semibold text-slate-900 text-sm">Salin Kode & Deploy</h4>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Salin file-file <strong className="text-slate-700">.gs</strong> dan <strong className="text-slate-700">.html</strong> di bawah, sesuaikan ID Spreadsheet dan ID Folder Drive Anda, lalu klik <strong className="text-slate-700">Terapkan &gt; Penerapan Baru &gt; Aplikasi Web</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN - DATABASE STRUCTURE */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="bg-indigo-950 text-white p-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-300" />
              <h3 className="font-bold text-sm">Struktur Kolom Spreadsheet (Database)</h3>
            </div>
            <div className="p-4 bg-indigo-950/95 border-t border-indigo-900">
              <pre className="text-[11px] font-mono text-indigo-100 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[550px]">
                {SPREADSHEET_STRUCTURE.trim()}
              </pre>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-800">
              <HelpCircle className="w-5 h-5 flex-shrink-0" />
              <h4 className="font-bold text-sm">Kiat Penting Google Drive Integration</h4>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              Untuk fitur unggah file (Foto Pengajar & Berkas Materi), program backend menggunakan <strong>DriveApp.createFile()</strong>. 
              Pastikan Anda mengganti konstanta <strong>DRIVE_FOLDER_ID</strong> di dalam <code>Code.gs</code> dengan ID folder Google Drive yang sudah disetel hak aksesnya ke 
              <strong>"Siapa saja yang memiliki link dapat melihat"</strong> agar file yang terunggah bisa dibuka langsung oleh siswa.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN - CODE SHEETS */}
        <div className="lg:col-span-7 space-y-6">
          {/* FILE CODE #1: Code.gs */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-xs font-bold text-emerald-400">Code.gs</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">Utama & Routing</span>
              </div>
              <button
                onClick={() => copyToClipboard(CODE_GS, 'code')}
                className="hover:bg-slate-800 text-slate-300 hover:text-white p-1.5 rounded transition cursor-pointer flex items-center gap-1.5 text-xs"
              >
                {copiedKey === 'code' ? <Check className="w-4 h-4 text-emerald-400" /> : <Clipboard className="w-4 h-4" />}
                <span>{copiedKey === 'code' ? 'Tersalin' : 'Salin Kode'}</span>
              </button>
            </div>
            <div className="p-4 bg-slate-950 border-t border-slate-800">
              <pre className="text-[11px] font-mono text-slate-200 leading-relaxed overflow-x-auto max-h-[350px]">
                {CODE_GS.trim()}
              </pre>
            </div>
          </div>

          {/* FILE CODE #2: UjianController.gs */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-xs font-bold text-emerald-400">UjianController.gs</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">Penilaian Otomatis ANBK</span>
              </div>
              <button
                onClick={() => copyToClipboard(UJIAN_CONTROLLER_GS, 'ujian')}
                className="hover:bg-slate-800 text-slate-300 hover:text-white p-1.5 rounded transition cursor-pointer flex items-center gap-1.5 text-xs"
              >
                {copiedKey === 'ujian' ? <Check className="w-4 h-4 text-emerald-400" /> : <Clipboard className="w-4 h-4" />}
                <span>{copiedKey === 'ujian' ? 'Tersalin' : 'Salin Kode'}</span>
              </button>
            </div>
            <div className="p-4 bg-slate-950 border-t border-slate-800">
              <pre className="text-[11px] font-mono text-slate-200 leading-relaxed overflow-x-auto max-h-[350px]">
                {UJIAN_CONTROLLER_GS.trim()}
              </pre>
            </div>
          </div>

          {/* FILE CODE #3: Index.html */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs font-bold text-cyan-400">Index.html</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">Frontend Utama</span>
              </div>
              <button
                onClick={() => copyToClipboard(FRONTEND_INDEX_HTML, 'index')}
                className="hover:bg-slate-800 text-slate-300 hover:text-white p-1.5 rounded transition cursor-pointer flex items-center gap-1.5 text-xs"
              >
                {copiedKey === 'index' ? <Check className="w-4 h-4 text-emerald-400" /> : <Clipboard className="w-4 h-4" />}
                <span>{copiedKey === 'index' ? 'Tersalin' : 'Salin Kode'}</span>
              </button>
            </div>
            <div className="p-4 bg-slate-950 border-t border-slate-800">
              <pre className="text-[11px] font-mono text-slate-200 leading-relaxed overflow-x-auto max-h-[300px]">
                {FRONTEND_INDEX_HTML.trim()}
              </pre>
            </div>
          </div>

          {/* FILE CODE #4: DashboardGuru.html */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-cyan-400" />
                <span className="font-mono text-xs font-bold text-cyan-400">DashboardGuru.html</span>
                <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">Interface Guru</span>
              </div>
              <button
                onClick={() => copyToClipboard(FRONTEND_GURU_HTML, 'guru')}
                className="hover:bg-slate-800 text-slate-300 hover:text-white p-1.5 rounded transition cursor-pointer flex items-center gap-1.5 text-xs"
              >
                {copiedKey === 'guru' ? <Check className="w-4 h-4 text-emerald-400" /> : <Clipboard className="w-4 h-4" />}
                <span>{copiedKey === 'guru' ? 'Tersalin' : 'Salin Kode'}</span>
              </button>
            </div>
            <div className="p-4 bg-slate-950 border-t border-slate-800">
              <pre className="text-[11px] font-mono text-slate-200 leading-relaxed overflow-x-auto max-h-[300px]">
                {FRONTEND_GURU_HTML.trim()}
              </pre>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
