import React, { useState, useEffect, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Upload, 
  Link as LinkIcon, 
  Sparkles, 
  X, 
  Check, 
  Maximize2, 
  Minimize2, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Square, 
  Sliders, 
  Trash2, 
  Edit3, 
  BookOpen, 
  HelpCircle,
  Eye,
  Type
} from 'lucide-react';
import toast from 'react-hot-toast';

export type ImageAlignment = 'center' | 'left' | 'right' | 'full' | 'inline';
export type ImageBorder = 'none' | 'slate' | 'indigo' | 'dashed';
export type ImageRounded = 'none' | 'md' | 'xl' | 'full';
export type ImageShadow = 'none' | 'soft' | 'hard';

export interface ImageDataModel {
  src: string;
  align: ImageAlignment;
  width: string; // e.g. "50%" or "320px"
  caption?: string;
  border?: ImageBorder;
  rounded?: ImageRounded;
  shadow?: ImageShadow;
  element?: HTMLImageElement;
}

// Preset educational diagrams for Indonesian teachers (Biologi, Fisika, Matematika, Geografi, dll.)
export const EDUCATIONAL_DIAGRAMS = [
  {
    title: 'Struktur Sel Hewan & Organel',
    category: 'Biologi',
    url: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&auto=format&fit=crop&q=80',
    caption: 'Gambar: Diagram Struktur Sel dan Sitoplasma'
  },
  {
    title: 'Siklus Hidrologi / Siklus Air',
    category: 'Geografi',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
    caption: 'Gambar: Siklus Air dan Evaporasi'
  },
  {
    title: 'Tata Surya & Orbit Planet',
    category: 'Fisika & Astronomi',
    url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=800&auto=format&fit=crop&q=80',
    caption: 'Gambar: Model Tata Surya dan Orbit Planet'
  },
  {
    title: 'Jaringan Tumbuhan / Kloroplas',
    category: 'Biologi',
    url: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&auto=format&fit=crop&q=80',
    caption: 'Gambar: Jaringan Daun dan Fotosintesis'
  },
  {
    title: 'Komponen Komputer & Chipset',
    category: 'Informatika',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    caption: 'Gambar: Perangkat Keras dan Sirkuit Logika'
  },
  {
    title: 'Peta Kepulauan Nusantara',
    category: 'IPS & Geografi',
    url: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop&q=80',
    caption: 'Gambar: Peta Wilayah Indonesia'
  },
  {
    title: 'Laboratorium & Reaksi Kimia',
    category: 'Kimia',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&auto=format&fit=crop&q=80',
    caption: 'Gambar: Alat Pengukuran dan Larutan Kimia'
  },
  {
    title: 'Grafik Statistik & Diagram Batang',
    category: 'Matematika',
    url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
    caption: 'Gambar: Diagram Batang dan Tren Distribusi Data'
  }
];

export function buildImageHtml(data: ImageDataModel): string {
  const alignClass = 
    data.align === 'left' ? 'img-float-left' :
    data.align === 'right' ? 'img-float-right' :
    data.align === 'full' ? 'img-full' :
    data.align === 'inline' ? 'img-inline' : 'img-center';

  let borderStyle = '';
  if (data.border === 'slate') borderStyle = 'border: 1px solid #cbd5e1;';
  else if (data.border === 'indigo') borderStyle = 'border: 2px solid #6366f1;';
  else if (data.border === 'dashed') borderStyle = 'border: 2px dashed #94a3b8;';

  let roundedStyle = 'border-radius: 8px;';
  if (data.rounded === 'none') roundedStyle = 'border-radius: 0px;';
  else if (data.rounded === 'xl') roundedStyle = 'border-radius: 16px;';
  else if (data.rounded === 'full') roundedStyle = 'border-radius: 9999px;';

  let shadowStyle = '';
  if (data.shadow === 'soft') shadowStyle = 'box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);';
  else if (data.shadow === 'hard') shadowStyle = 'box-shadow: 0 10px 15px -3px rgba(0,0,0,0.15), 0 4px 6px -4px rgba(0,0,0,0.1);';

  let displayAndMargin = '';
  if (data.align === 'left') {
    displayAndMargin = 'float: left; margin: 8px 18px 12px 0;';
  } else if (data.align === 'right') {
    displayAndMargin = 'float: right; margin: 8px 0 12px 18px;';
  } else if (data.align === 'full') {
    displayAndMargin = 'display: block; margin: 12px auto; width: 100%;';
  } else if (data.align === 'inline') {
    displayAndMargin = 'display: inline-block; vertical-align: middle; margin: 0 6px;';
  } else {
    // center
    displayAndMargin = 'display: block; margin: 12px auto;';
  }

  const widthStyle = data.align === 'full' ? 'width: 100%; max-width: 100%;' : `width: ${data.width}; max-width: 100%;`;
  const combinedStyle = `${displayAndMargin} ${widthStyle} height: auto; ${roundedStyle} ${borderStyle} ${shadowStyle}`.trim();

  const captionHtml = data.caption && data.caption.trim() ? `
<p class="img-caption" style="text-align: ${data.align === 'right' ? 'right' : data.align === 'left' ? 'left' : 'center'}; font-size: 11px; color: #64748b; font-style: italic; margin-top: 4px; margin-bottom: 8px; line-height: 1.4;">
  <em>${data.caption.trim()}</em>
</p>` : '';

  const clearfixHtml = (data.align === 'left' || data.align === 'right') ? '<p style="clear: both; margin: 0; padding: 0;"></p>' : '';

  return `<img src="${data.src}" class="${alignClass}" data-align="${data.align}" data-caption="${encodeURIComponent(data.caption || '')}" style="${combinedStyle}" alt="${data.caption || 'Gambar Soal'}" />${captionHtml}${clearfixHtml}`;
}

interface QuestionImageStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertOrUpdate: (html: string, isUpdate: boolean, oldEl?: HTMLImageElement) => void;
  currentQuestionText?: string;
  initialData?: ImageDataModel | null;
}

export const QuestionImageStudioModal: React.FC<QuestionImageStudioProps> = ({
  isOpen,
  onClose,
  onInsertOrUpdate,
  currentQuestionText = '',
  initialData = null,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'diagrams'>('upload');
  const [imgSrc, setImgSrc] = useState<string>('');
  const [align, setAlign] = useState<ImageAlignment>('center');
  const [widthPct, setWidthPct] = useState<number>(50);
  const [caption, setCaption] = useState<string>('');
  const [border, setBorder] = useState<ImageBorder>('none');
  const [rounded, setRounded] = useState<ImageRounded>('md');
  const [shadow, setShadow] = useState<ImageShadow>('soft');
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setImgSrc(initialData.src || '');
      setAlign(initialData.align || 'center');
      const numericW = parseInt(initialData.width, 10);
      setWidthPct(!isNaN(numericW) && numericW > 0 ? numericW : 50);
      setCaption(initialData.caption || '');
      setBorder(initialData.border || 'none');
      setRounded(initialData.rounded || 'md');
      setShadow(initialData.shadow || 'soft');
      setActiveTab('url');
    } else {
      setImgSrc('');
      setAlign('center');
      setWidthPct(50);
      setCaption('');
      setBorder('none');
      setRounded('md');
      setShadow('soft');
      setActiveTab('upload');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Process uploaded image with automatic downscaling/compression to prevent laggy CBT
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Berkas harus berupa gambar (JPG, PNG, WEBP, GIF, SVG)!');
      return;
    }

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const originalDataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // If image is larger than 1200px, compress it gracefully using canvas
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.85);
            setImgSrc(compressedUrl);
            setIsCompressing(false);
            toast.success('Gambar berhasil dimuat dan dioptimalkan!');
            return;
          }
        }

        setImgSrc(originalDataUrl);
        setIsCompressing(false);
        toast.success('Gambar berhasil dipilih!');
      };
      img.onerror = () => {
        setIsCompressing(false);
        toast.error('Gagal memproses gambar');
      };
      img.src = originalDataUrl;
    };
    reader.onerror = () => {
      setIsCompressing(false);
      toast.error('Gagal membaca berkas');
    };
    reader.readAsDataURL(file);
  };

  const handleApply = () => {
    if (!imgSrc.trim()) {
      toast.error('Silakan pilih atau masukkan gambar terlebih dahulu!');
      return;
    }

    const model: ImageDataModel = {
      src: imgSrc,
      align,
      width: `${widthPct}%`,
      caption,
      border,
      rounded,
      shadow,
      element: initialData?.element
    };

    const html = buildImageHtml(model);
    onInsertOrUpdate(html, !!initialData, initialData?.element);
    toast.success(initialData ? 'Format gambar berhasil diperbarui!' : 'Gambar berhasil disisipkan ke soal!');
    onClose();
  };

  // Sample prompt question text if current question is empty
  const sampleCleanText = currentQuestionText
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || 'Perhatikan wacana dan gambar berikut untuk menjawab pertanyaan: Berdasarkan pengamatan fenomena di atas, peserta didik diminta untuk mengidentifikasi komponen utama serta menganalisis hubungan sebab akibat yang terjadi dalam konteks pembelajaran terpadu.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                {initialData ? 'Edit & Tata Ulang Gambar Soal' : 'Studio Format & Peletakan Gambar Soal'}
              </h3>
              <p className="text-xs text-indigo-100 font-medium">
                Atur ukuran gambar, bungkus teks (wrap text), perataan, dan keterangan dengan mudah
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-indigo-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Controls & Settings (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* 1. SOURCE SELECTOR TABS */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-2">
                1. Sumber Gambar
              </label>
              <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'upload' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Unggah Berkas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('url')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'url' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Tautan URL</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('diagrams')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'diagrams' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Galeri Edukasi</span>
                </button>
              </div>

              {/* Source content */}
              <div className="mt-3">
                {activeTab === 'upload' && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-indigo-200 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50/70 transition rounded-2xl p-4 text-center cursor-pointer flex flex-col items-center justify-center gap-2 group"
                    >
                      <div className="w-10 h-10 rounded-full bg-white shadow-2xs flex items-center justify-center text-indigo-600 group-hover:scale-110 transition">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div className="text-xs font-bold text-slate-700">
                        {isCompressing ? 'Mengompresi & Memuat Gambar...' : 'Klik untuk Pilih Gambar dari Komputer / HP'}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Mendukung format PNG, JPG, JPEG, WEBP, GIF (Otomatis dioptimalkan untuk CBT)
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'url' && (
                  <div className="space-y-1.5">
                    <input
                      type="url"
                      placeholder="https://contoh-domain.com/gambar-soal.jpg"
                      value={imgSrc}
                      onChange={(e) => setImgSrc(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                    <p className="text-[10px] text-slate-400">
                      Tempel URL gambar langsung dari Google Drive, Unsplash, atau web sekolah Anda
                    </p>
                  </div>
                )}

                {activeTab === 'diagrams' && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-1">
                      {EDUCATIONAL_DIAGRAMS.map((diag, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setImgSrc(diag.url);
                            setCaption(diag.caption);
                          }}
                          className={`p-1.5 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                            imgSrc === diag.url
                              ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 hover:border-indigo-300 bg-white'
                          }`}
                        >
                          <img
                            src={diag.url}
                            alt={diag.title}
                            className="w-full h-14 object-cover rounded-lg mb-1"
                          />
                          <span className="text-[9px] font-bold text-slate-800 line-clamp-1 block">
                            {diag.title}
                          </span>
                          <span className="text-[8px] text-indigo-600 font-extrabold uppercase">
                            {diag.category}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Klik salah satu diagram untuk langsung menggunakannya sebagai stimulus soal.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 2. PLACEMENT & TEXT WRAPPING (PELETAKAN SESUAI TEKS) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <span>2. Peletakan Terhadap Teks (Text Flow)</span>
                  <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded text-[9px] font-extrabold">Kunci</span>
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Float Left (Kiri Mengalir) */}
                <button
                  type="button"
                  onClick={() => setAlign('left')}
                  className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1.5 ${
                    align === 'left'
                      ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-indigo-600">◀ Kiri Mengalir</span>
                    {align === 'left' && <Check className="w-3.5 h-3.5 text-indigo-600 font-black" />}
                  </div>
                  {/* Visual diagram */}
                  <div className="bg-slate-100 p-1.5 rounded-lg border border-slate-200/80 flex items-start gap-1 h-9">
                    <div className="w-4 h-5 bg-indigo-500 rounded-xs shrink-0" />
                    <div className="space-y-0.5 flex-1">
                      <div className="w-full h-1 bg-slate-300 rounded-xs" />
                      <div className="w-full h-1 bg-slate-300 rounded-xs" />
                      <div className="w-3/4 h-1 bg-slate-300 rounded-xs" />
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-500 leading-tight">
                    Teks membungkus rapi di kanan gambar (Wacana Literasi)
                  </span>
                </button>

                {/* Center Block (Rata Tengah) */}
                <button
                  type="button"
                  onClick={() => setAlign('center')}
                  className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1.5 ${
                    align === 'center'
                      ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-indigo-600">🔳 Tengah Mandiri</span>
                    {align === 'center' && <Check className="w-3.5 h-3.5 text-indigo-600 font-black" />}
                  </div>
                  {/* Visual diagram */}
                  <div className="bg-slate-100 p-1.5 rounded-lg border border-slate-200/80 flex flex-col items-center justify-center gap-0.5 h-9">
                    <div className="w-full h-1 bg-slate-300 rounded-xs" />
                    <div className="w-8 h-4 bg-indigo-500 rounded-xs" />
                    <div className="w-full h-1 bg-slate-300 rounded-xs" />
                  </div>
                  <span className="text-[9px] text-slate-500 leading-tight">
                    Gambar di tengah, teks di atas & bawah (Standar CBT)
                  </span>
                </button>

                {/* Float Right (Kanan Mengalir) */}
                <button
                  type="button"
                  onClick={() => setAlign('right')}
                  className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1.5 ${
                    align === 'right'
                      ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-indigo-600">▶ Kanan Mengalir</span>
                    {align === 'right' && <Check className="w-3.5 h-3.5 text-indigo-600 font-black" />}
                  </div>
                  {/* Visual diagram */}
                  <div className="bg-slate-100 p-1.5 rounded-lg border border-slate-200/80 flex items-start gap-1 h-9">
                    <div className="space-y-0.5 flex-1">
                      <div className="w-full h-1 bg-slate-300 rounded-xs" />
                      <div className="w-full h-1 bg-slate-300 rounded-xs" />
                      <div className="w-3/4 h-1 bg-slate-300 rounded-xs" />
                    </div>
                    <div className="w-4 h-5 bg-indigo-500 rounded-xs shrink-0" />
                  </div>
                  <span className="text-[9px] text-slate-500 leading-tight">
                    Teks membungkus rapi di kiri gambar
                  </span>
                </button>

                {/* Full Width (Penuh 100%) */}
                <button
                  type="button"
                  onClick={() => setAlign('full')}
                  className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex flex-col gap-1.5 ${
                    align === 'full'
                      ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-500/30'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-indigo-600">↔ Penuh 100%</span>
                    {align === 'full' && <Check className="w-3.5 h-3.5 text-indigo-600 font-black" />}
                  </div>
                  {/* Visual diagram */}
                  <div className="bg-slate-100 p-1.5 rounded-lg border border-slate-200/80 flex flex-col items-center justify-center gap-1 h-9">
                    <div className="w-full h-4 bg-indigo-500 rounded-xs" />
                    <div className="w-full h-1 bg-slate-300 rounded-xs" />
                  </div>
                  <span className="text-[9px] text-slate-500 leading-tight">
                    Memanjang penuh lebar soal (Tabel/Peta/Infografis)
                  </span>
                </button>
              </div>
            </div>

            {/* 3. RESIZING CONTROLS (UKURAN GAMBAR) */}
            {align !== 'full' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                    3. Ukuran Gambar ({widthPct}%)
                  </label>
                  {/* Quick Presets */}
                  <div className="flex items-center gap-1">
                    {[25, 33, 50, 75, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setWidthPct(preset)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                          widthPct === preset
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400">10%</span>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={widthPct}
                    onChange={(e) => setWidthPct(Number(e.target.value))}
                    className="flex-1 accent-indigo-600 cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-slate-400">100%</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border text-xs font-mono font-bold text-indigo-700">
                    {widthPct}%
                  </span>
                </div>
              </div>
            )}

            {/* 4. CAPTION & DECORATIONS */}
            <div className="space-y-3 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/80">
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                  <Type className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Keterangan Gambar (Caption di Bawah Gambar)</span>
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Gambar 1.1 Diagram Siklus Krebs / Sel Tumbuhan"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] font-extrabold text-slate-500 block mb-1">Bingkai:</span>
                  <select
                    value={border}
                    onChange={(e) => setBorder(e.target.value as any)}
                    className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg p-1.5"
                  >
                    <option value="none">Polos (Tanpa Bingkai)</option>
                    <option value="slate">Garis Tipis Abu</option>
                    <option value="indigo">Aksen Indigo</option>
                    <option value="dashed">Garis Putus-Putus</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold text-slate-500 block mb-1">Sudut:</span>
                  <select
                    value={rounded}
                    onChange={(e) => setRounded(e.target.value as any)}
                    className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg p-1.5"
                  >
                    <option value="none">Siku Rata (0px)</option>
                    <option value="md">Melengkung (8px)</option>
                    <option value="xl">Bundar Elegan (16px)</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] font-extrabold text-slate-500 block mb-1">Bayangan:</span>
                  <select
                    value={shadow}
                    onChange={(e) => setShadow(e.target.value as any)}
                    className="w-full text-xs font-bold bg-white border border-slate-200 rounded-lg p-1.5"
                  >
                    <option value="none">Tanpa Bayangan</option>
                    <option value="soft">Bayangan Halus</option>
                    <option value="hard">Bayangan Nyata</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Live Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col bg-slate-900/5 rounded-3xl border border-slate-200 p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>Simulasi Pratinjau di Soal</span>
              </span>

              <div className="flex items-center bg-white rounded-lg p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPreviewMode('desktop')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    previewMode === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-500'
                  }`}
                >
                  Komputer
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('mobile')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    previewMode === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-500'
                  }`}
                >
                  Ponsel
                </button>
              </div>
            </div>

            {/* Simulated Question Card */}
            <div className="flex-1 overflow-y-auto">
              <div
                className={`mx-auto bg-white rounded-2xl border border-slate-200 p-4 shadow-sm transition-all text-xs leading-relaxed ${
                  previewMode === 'mobile' ? 'max-w-[280px]' : 'w-full'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-400 mb-2 border-b pb-1">
                  Butir Soal Nomor 1 • Bobot 2 Poin
                </div>

                {imgSrc ? (
                  <div className="text-slate-800">
                    {/* Render according to alignment */}
                    {align === 'center' && (
                      <div>
                        <p className="mb-2">Perhatikan gambar berikut dengan cermat:</p>
                        <div className="text-center my-2">
                          <img
                            src={imgSrc}
                            alt={caption || 'Preview'}
                            style={{
                              width: `${widthPct}%`,
                              display: 'block',
                              margin: '0 auto',
                              borderRadius: rounded === 'none' ? '0px' : rounded === 'xl' ? '16px' : '8px',
                              border: border === 'slate' ? '1px solid #cbd5e1' : border === 'indigo' ? '2px solid #6366f1' : border === 'dashed' ? '2px dashed #94a3b8' : 'none',
                              boxShadow: shadow === 'soft' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : shadow === 'hard' ? '0 10px 15px -3px rgba(0,0,0,0.15)' : 'none'
                            }}
                          />
                          {caption && (
                            <p className="text-[10px] text-slate-500 italic mt-1 text-center">
                              <em>{caption}</em>
                            </p>
                          )}
                        </div>
                        <p className="mt-2 text-justify">{sampleCleanText}</p>
                      </div>
                    )}

                    {align === 'left' && (
                      <div className="clearfix">
                        <div
                          style={{
                            float: 'left',
                            width: `${widthPct}%`,
                            marginRight: '12px',
                            marginBottom: '8px'
                          }}
                        >
                          <img
                            src={imgSrc}
                            alt={caption || 'Preview'}
                            className="w-full h-auto"
                            style={{
                              borderRadius: rounded === 'none' ? '0px' : rounded === 'xl' ? '16px' : '8px',
                              border: border === 'slate' ? '1px solid #cbd5e1' : border === 'indigo' ? '2px solid #6366f1' : border === 'dashed' ? '2px dashed #94a3b8' : 'none',
                              boxShadow: shadow === 'soft' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : shadow === 'hard' ? '0 10px 15px -3px rgba(0,0,0,0.15)' : 'none'
                            }}
                          />
                          {caption && (
                            <p className="text-[9px] text-slate-500 italic mt-1 text-left">
                              <em>{caption}</em>
                            </p>
                          )}
                        </div>
                        <p className="text-justify leading-relaxed">{sampleCleanText}</p>
                        <div style={{ clear: 'both' }} />
                      </div>
                    )}

                    {align === 'right' && (
                      <div className="clearfix">
                        <div
                          style={{
                            float: 'right',
                            width: `${widthPct}%`,
                            marginLeft: '12px',
                            marginBottom: '8px'
                          }}
                        >
                          <img
                            src={imgSrc}
                            alt={caption || 'Preview'}
                            className="w-full h-auto"
                            style={{
                              borderRadius: rounded === 'none' ? '0px' : rounded === 'xl' ? '16px' : '8px',
                              border: border === 'slate' ? '1px solid #cbd5e1' : border === 'indigo' ? '2px solid #6366f1' : border === 'dashed' ? '2px dashed #94a3b8' : 'none',
                              boxShadow: shadow === 'soft' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : shadow === 'hard' ? '0 10px 15px -3px rgba(0,0,0,0.15)' : 'none'
                            }}
                          />
                          {caption && (
                            <p className="text-[9px] text-slate-500 italic mt-1 text-right">
                              <em>{caption}</em>
                            </p>
                          )}
                        </div>
                        <p className="text-justify leading-relaxed">{sampleCleanText}</p>
                        <div style={{ clear: 'both' }} />
                      </div>
                    )}

                    {align === 'full' && (
                      <div>
                        <div className="w-full my-2">
                          <img
                            src={imgSrc}
                            alt={caption || 'Preview'}
                            className="w-full h-auto"
                            style={{
                              borderRadius: rounded === 'none' ? '0px' : rounded === 'xl' ? '16px' : '8px',
                              border: border === 'slate' ? '1px solid #cbd5e1' : border === 'indigo' ? '2px solid #6366f1' : border === 'dashed' ? '2px dashed #94a3b8' : 'none',
                              boxShadow: shadow === 'soft' ? '0 4px 6px -1px rgba(0,0,0,0.1)' : shadow === 'hard' ? '0 10px 15px -3px rgba(0,0,0,0.15)' : 'none'
                            }}
                          />
                          {caption && (
                            <p className="text-[10px] text-slate-500 italic mt-1 text-center">
                              <em>{caption}</em>
                            </p>
                          )}
                        </div>
                        <p className="mt-2 text-justify">{sampleCleanText}</p>
                      </div>
                    )}

                    {align === 'inline' && (
                      <p className="text-justify leading-relaxed">
                        Perhatikan simbol berikut{' '}
                        <img
                          src={imgSrc}
                          alt={caption || 'Inline'}
                          style={{
                            display: 'inline-block',
                            verticalAlign: 'middle',
                            maxHeight: '36px',
                            margin: '0 4px'
                          }}
                        />{' '}
                        yang digunakan dalam stimulus di atas. {sampleCleanText}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="h-44 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-2">
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                    <span className="text-xs font-medium">Pilih gambar untuk melihat simulasi</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {imgSrc ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-4 h-4 text-emerald-600" /> Gambar siap disisipkan ({align === 'left' ? 'Kiri Mengalir' : align === 'right' ? 'Kanan Mengalir' : align === 'full' ? 'Penuh 100%' : 'Rata Tengah'}, {widthPct}%)
              </span>
            ) : (
              <span>Pilih atau unggah gambar untuk mengaktifkan tombol simpan</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!imgSrc}
              onClick={handleApply}
              className={`px-5 py-2 rounded-xl text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer ${
                imgSrc
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{initialData ? 'Simpan Perubahan Gambar' : 'Sisipkan ke Lembar Soal'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------------------------------------
// IN-EDITOR QUICK IMAGE TOOLBAR & CORNER RESIZE HANDLE
// ------------------------------------------------------------------------------------------------

interface EditorImageResizerOverlayProps {
  editorContainerRef: React.RefObject<HTMLDivElement | null>;
  onEditImageFull: (data: ImageDataModel) => void;
  onUpdateContent: () => void;
}

export const EditorImageResizerOverlay: React.FC<EditorImageResizerOverlayProps> = ({
  editorContainerRef,
  onEditImageFull,
  onUpdateContent
}) => {
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [imgRect, setImgRect] = useState<DOMRect | null>(null);
  const [currentAlign, setCurrentAlign] = useState<ImageAlignment>('center');
  const [currentWidth, setCurrentWidth] = useState<string>('50%');
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  // Click detector inside editor
  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'IMG') {
        const img = target as HTMLImageElement;
        setSelectedImg(img);
        setImgRect(img.getBoundingClientRect());

        // Highlight image
        container.querySelectorAll('img').forEach(i => i.classList.remove('active-selected-img'));
        img.classList.add('active-selected-img');

        // Parse alignment
        const dataAlign = img.getAttribute('data-align') as ImageAlignment;
        if (dataAlign) {
          setCurrentAlign(dataAlign);
        } else if (img.style.float === 'left') {
          setCurrentAlign('left');
        } else if (img.style.float === 'right') {
          setCurrentAlign('right');
        } else if (img.style.margin?.includes('auto')) {
          setCurrentAlign('center');
        } else {
          setCurrentAlign('center');
        }

        // Parse width
        setCurrentWidth(img.style.width || img.getAttribute('width') || '50%');
      } else if (!target.closest('.image-floating-quick-bar') && !target.closest('.image-resize-handle')) {
        // Clicked outside
        if (selectedImg) {
          selectedImg.classList.remove('active-selected-img');
          setSelectedImg(null);
          setImgRect(null);
        }
      }
    };

    const handleScrollOrResize = () => {
      if (selectedImg) {
        setImgRect(selectedImg.getBoundingClientRect());
      }
    };

    container.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      container.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [editorContainerRef, selectedImg]);

  const applyAlignment = (align: ImageAlignment) => {
    if (!selectedImg) return;
    selectedImg.setAttribute('data-align', align);
    selectedImg.classList.remove('img-center', 'img-float-left', 'img-float-right', 'img-full', 'img-inline');

    if (align === 'left') {
      selectedImg.classList.add('img-float-left');
      selectedImg.style.float = 'left';
      selectedImg.style.margin = '8px 18px 12px 0';
      selectedImg.style.display = 'inline-block';
    } else if (align === 'right') {
      selectedImg.classList.add('img-float-right');
      selectedImg.style.float = 'right';
      selectedImg.style.margin = '8px 0 12px 18px';
      selectedImg.style.display = 'inline-block';
    } else if (align === 'full') {
      selectedImg.classList.add('img-full');
      selectedImg.style.float = 'none';
      selectedImg.style.display = 'block';
      selectedImg.style.width = '100%';
      selectedImg.style.margin = '12px auto';
    } else if (align === 'inline') {
      selectedImg.classList.add('img-inline');
      selectedImg.style.float = 'none';
      selectedImg.style.display = 'inline-block';
      selectedImg.style.verticalAlign = 'middle';
      selectedImg.style.margin = '0 6px';
    } else {
      // center
      selectedImg.classList.add('img-center');
      selectedImg.style.float = 'none';
      selectedImg.style.display = 'block';
      selectedImg.style.margin = '12px auto';
    }

    setCurrentAlign(align);
    onUpdateContent();
    toast.success(`Peletakan diubah ke: ${align === 'left' ? 'Kiri Mengalir (Wrap)' : align === 'right' ? 'Kanan Mengalir (Wrap)' : align === 'full' ? 'Penuh 100%' : 'Rata Tengah'}`);
    setTimeout(() => {
      if (selectedImg) setImgRect(selectedImg.getBoundingClientRect());
    }, 50);
  };

  const applyWidth = (pct: number) => {
    if (!selectedImg) return;
    const w = `${pct}%`;
    selectedImg.style.width = w;
    selectedImg.setAttribute('width', w);
    setCurrentWidth(w);
    onUpdateContent();
    toast.success(`Ukuran diubah menjadi ${pct}%`);
    setTimeout(() => {
      if (selectedImg) setImgRect(selectedImg.getBoundingClientRect());
    }, 50);
  };

  const handleDelete = () => {
    if (!selectedImg) return;
    selectedImg.classList.remove('active-selected-img');
    const parent = selectedImg.parentElement;
    selectedImg.remove();
    setSelectedImg(null);
    setImgRect(null);
    onUpdateContent();
    toast.success('Gambar dihapus dari naskah soal');
  };

  const handleOpenFull = () => {
    if (!selectedImg) return;
    const captionEl = selectedImg.nextElementSibling;
    const hasCaption = captionEl && captionEl.classList.contains('img-caption');
    const captionText = hasCaption ? captionEl.textContent || '' : decodeURIComponent(selectedImg.getAttribute('data-caption') || '');

    onEditImageFull({
      src: selectedImg.src,
      align: currentAlign,
      width: currentWidth,
      caption: captionText,
      element: selectedImg
    });
  };

  if (!selectedImg || !imgRect) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30">
      {/* FLOATING ACTION TOOLBAR OVER IMAGE */}
      <div
        className="image-floating-quick-bar pointer-events-auto fixed bg-slate-900/95 backdrop-blur-md text-white px-3 py-1.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 -translate-x-1/2 transition-all animate-fade-in"
        style={{
          top: Math.max(10, imgRect.top - 52),
          left: Math.max(160, Math.min(window.innerWidth - 160, imgRect.left + imgRect.width / 2)),
          zIndex: 9999
        }}
      >
        <span className="text-[10px] font-black uppercase text-indigo-400 border-r border-slate-700 pr-2">
          Gambar ({currentWidth})
        </span>

        {/* ALIGNMENT BUTTONS */}
        <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
          <button
            type="button"
            title="Kiri Mengalir (Teks Membungkus di Kanan)"
            onClick={() => applyAlignment('left')}
            className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              currentAlign === 'left' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            ◀ Kiri
          </button>
          <button
            type="button"
            title="Rata Tengah Mandiri"
            onClick={() => applyAlignment('center')}
            className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              currentAlign === 'center' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            🔳 Tengah
          </button>
          <button
            type="button"
            title="Kanan Mengalir (Teks Membungkus di Kiri)"
            onClick={() => applyAlignment('right')}
            className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              currentAlign === 'right' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            ▶ Kanan
          </button>
          <button
            type="button"
            title="Lebar Penuh 100%"
            onClick={() => applyAlignment('full')}
            className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              currentAlign === 'full' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            ↔ Penuh
          </button>
        </div>

        {/* QUICK RESIZE PRESETS */}
        <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
          {[25, 33, 50, 75, 100].map(pct => (
            <button
              key={pct}
              type="button"
              onClick={() => applyWidth(pct)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                currentWidth === `${pct}%` ? 'bg-indigo-500 text-white' : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              {pct}%
            </button>
          ))}
        </div>

        {/* ADVANCED EDIT & DELETE */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Edit Lengkap (Ukuran, Bingkai, Keterangan, Gambar Baru)"
            onClick={handleOpenFull}
            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
          >
            <Edit3 className="w-3 h-3" />
            <span>Format</span>
          </button>
          <button
            type="button"
            title="Hapus Gambar"
            onClick={handleDelete}
            className="p-1.5 hover:bg-rose-500/30 text-rose-400 hover:text-rose-300 rounded-lg text-xs transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
