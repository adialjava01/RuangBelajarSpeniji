/**
 * Utility for Google Drive & Web Link Validation and Preview Parsing
 */

export interface DriveUrlAnalysis {
  isValid: boolean;
  isGoogleDrive: boolean;
  type: 'folder' | 'document' | 'spreadsheet' | 'presentation' | 'pdf' | 'form' | 'general_link' | 'invalid';
  label: string;
  colorClass: string;
  previewUrl: string;
  warningNote?: string;
}

export function analyzeDriveUrl(urlInput?: string): DriveUrlAnalysis {
  if (!urlInput || typeof urlInput !== 'string') {
    return {
      isValid: false,
      isGoogleDrive: false,
      type: 'invalid',
      label: 'Link Kosong',
      colorClass: 'bg-slate-100 text-slate-500 border-slate-200',
      previewUrl: '',
    };
  }

  const url = urlInput.trim();

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return {
      isValid: false,
      isGoogleDrive: false,
      type: 'invalid',
      label: 'Format URL Tidak Valid (Harus http:// atau https://)',
      colorClass: 'bg-rose-50 text-rose-600 border-rose-200',
      previewUrl: url,
    };
  }

  const isGDrive = url.includes('drive.google.com') || url.includes('docs.google.com') || url.includes('forms.google.com');

  if (!isGDrive) {
    return {
      isValid: true,
      isGoogleDrive: false,
      type: 'general_link',
      label: 'Tautan Web Luar',
      colorClass: 'bg-amber-50 text-amber-700 border-amber-200',
      previewUrl: url,
      warningNote: 'Pastikan tautan ini dapat diakses publik oleh guru tanpa perlu login khusus.'
    };
  }

  let type: DriveUrlAnalysis['type'] = 'general_link';
  let label = 'Google Drive Link';
  let colorClass = 'bg-blue-50 text-blue-700 border-blue-200';

  if (url.includes('/folders/') || url.includes('folder')) {
    type = 'folder';
    label = 'Folder Google Drive';
    colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (url.includes('/document/') || url.includes('/docs/')) {
    type = 'document';
    label = 'Google Docs';
    colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (url.includes('/spreadsheets/')) {
    type = 'spreadsheet';
    label = 'Google Sheets';
    colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (url.includes('/presentation/')) {
    type = 'presentation';
    label = 'Google Slides';
    colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (url.includes('/forms/')) {
    type = 'form';
    label = 'Google Form';
    colorClass = 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (url.toLowerCase().includes('.pdf') || url.includes('pdf')) {
    type = 'pdf';
    label = 'Berkas PDF (GDrive)';
    colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
  }

  // Format preview link if possible
  let previewUrl = url;
  if (url.includes('/view') || url.includes('/edit')) {
    previewUrl = url.replace(/\/edit.*$/, '/preview').replace(/\/view.*$/, '/preview');
  }

  return {
    isValid: true,
    isGoogleDrive: true,
    type,
    label,
    colorClass,
    previewUrl,
    warningNote: 'Pastikan status akses tautan ini diset ke "Siapa saja yang memiliki link" (Anyone with the link).'
  };
}
