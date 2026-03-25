import React, { useState, useRef } from 'react';
import { Printer, ClipboardPaste, Loader2, RefreshCw, FileText, Upload, Image as ImageIcon, Settings, Maximize2, Move, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { parsePastedData } from './services/gemini';
import { CertificateData, CertificateAssets, LogoAsset, DEFAULT_AGENCY, DEFAULT_SIGNATORY, DEFAULT_SIGNATORY_TITLE, DEFAULT_LICENSE, DEFAULT_LOGOS } from './types';

// Reusable Certificate Content Component
const CertificateContent = ({ 
  data, 
  assets, 
  isEditingLogos = false, 
  updateLogo = () => {},
  isPreview = false,
  paperSize = 'a4',
  margins = 'normal'
}: { 
  data: CertificateData; 
  assets: CertificateAssets; 
  isEditingLogos?: boolean;
  updateLogo?: (key: keyof CertificateAssets['logos'], updates: Partial<LogoAsset>) => void;
  isPreview?: boolean;
  paperSize?: string;
  margins?: string;
}) => (
  <div className={`bg-white w-full shadow-2xl flex flex-col relative print:shadow-none print:m-0 font-serif text-neutral-900 print-container ${isPreview ? 'shadow-none' : ''}`}
    style={{
      padding: margins === 'narrow' ? '0.5in' : margins === 'wide' ? '1in 2in' : '0.75in',
      minHeight: isPreview ? '100%' : (
        paperSize === 'a4' ? '297mm' : 
        paperSize === 'letter' ? '11in' : 
        paperSize === 'legal' ? '14in' : '13in'
      ),
      maxWidth: isPreview ? '100%' : (
        paperSize === 'a4' ? '210mm' : 
        paperSize === 'letter' ? '8.5in' : 
        paperSize === 'legal' ? '8.5in' : '8.5in'
      )
    }}
  >
    {/* Header Logos */}
    <div className="flex justify-center items-center gap-8 mb-4 px-4 min-h-[120px] relative">
      {(['logo1', 'logo2', 'logo3', 'logo4'] as const).map((key) => (
        <motion.div
          key={key}
          drag={isEditingLogos && !isPreview}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            updateLogo(key, { 
              x: assets.logos[key].x + info.offset.x, 
              y: assets.logos[key].y + info.offset.y 
            });
          }}
          style={{
            x: assets.logos[key].x,
            y: assets.logos[key].y,
            width: assets.logos[key].width,
            height: assets.logos[key].height,
          }}
          className={`relative flex items-center justify-center ${isEditingLogos && !isPreview ? 'cursor-move ring-2 ring-blue-400 ring-offset-4 rounded' : ''}`}
        >
          <img 
            src={assets.logos[key].src} 
            alt={key} 
            className="max-h-full max-w-full object-contain pointer-events-none" 
            referrerPolicy="no-referrer" 
          />
          
          {isEditingLogos && !isPreview && (
            <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-2 no-print">
              <button 
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => updateLogo(key, { width: Math.max(40, assets.logos[key].width - 10), height: Math.max(40, assets.logos[key].height - 10) })}
                className="p-1 bg-white border border-neutral-200 rounded shadow-sm hover:bg-neutral-50"
              >
                <Settings className="w-3 h-3 rotate-45" />
              </button>
              <button 
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => updateLogo(key, { width: assets.logos[key].width + 10, height: assets.logos[key].height + 10 })}
                className="p-1 bg-white border border-neutral-200 rounded shadow-sm hover:bg-neutral-50"
              >
                <Maximize2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </motion.div>
      ))}
    </div>

    <div className="text-right font-bold text-lg mb-12 pr-4">ANNEX A</div>

    <div className="text-center mb-16">
      <h3 className="text-xl font-bold underline decoration-1 underline-offset-[4px] uppercase tracking-tight">
        CERTIFICATE OF ELIGIBILITY (INDIGENCY)
      </h3>
    </div>

    <div className="space-y-12 text-[1.15rem] leading-[1.6]">
      <div className="flex items-end gap-2 relative">
        <span className="whitespace-nowrap">This is certify that</span>
        <div className="flex-1 border-b border-black text-center font-bold px-2">
          {data.patientName || '\u00A0'}
        </div>
        <div className="absolute left-[120px] -bottom-6 w-full text-center text-sm text-neutral-600">
          (Name of Patient)
        </div>
      </div>

      <div className="flex items-end gap-2 relative pt-4">
        <span className="whitespace-nowrap">of</span>
        <div className="flex-1 border-b border-black text-center font-bold px-2">
          {data.address || '\u00A0'}
        </div>
        <span className="whitespace-nowrap">is an</span>
        <div className="absolute left-0 -bottom-6 w-full text-center text-sm text-neutral-600 pr-[40px]">
          (Address)
        </div>
      </div>

      <div className="flex items-end gap-2 pt-4">
        <span className="whitespace-nowrap">indigent/needy patient with a classification of</span>
        <div className="flex-1 border-b border-black text-center font-bold px-2">
          {data.classification || '\u00A0'}
        </div>
        <span>.</span>
      </div>

      <p className="pt-4">
        This certification is issued as a requirement for seeking financial and medical assistance from the Malasakit Center especially for the following assistance/s or service/s:
      </p>

      <div className="border-b border-black min-h-[3rem] font-bold text-center flex items-center justify-center">
        {data.assistanceType || '\u00A0'}
      </div>

      <div className="flex items-end gap-2 relative pt-4">
        <span className="whitespace-nowrap">from</span>
        <div className="flex-1 text-center font-bold px-2 uppercase border-b border-black">
          {data.agencyName}
        </div>
        <div className="absolute left-0 -bottom-6 w-full text-center text-sm text-neutral-600">
          (Name of Participating Agency)
        </div>
      </div>

      <div className="flex items-end gap-2 pt-8">
        <span className="whitespace-nowrap">This Certification is issued on</span>
        <div className="flex-1 relative">
          <div className="border-b border-black text-center font-bold px-2">
            {data.issuanceDate || '\u00A0'}
          </div>
          <div className="absolute left-0 right-0 -bottom-6 text-center text-sm text-neutral-600">
            (Date)
          </div>
        </div>
        <span>.</span>
      </div>
    </div>

    <div className="mt-auto pt-16 relative">
      <p className="text-lg mb-12">Issued by:</p>
      
      <div className="relative mt-12">
        {/* E-Signature */}
        {assets.signature && (
          <img 
            src={assets.signature} 
            alt="Signature" 
            className="absolute -top-20 left-4 h-28 w-auto pointer-events-none"
          />
        )}
        
        <p className="font-bold text-lg uppercase underline decoration-1 underline-offset-2">{data.signatoryName}</p>
        <p className="text-sm leading-tight max-w-md">Signature over Name of the Head of the Medical Social Work Department</p>
        <p className="text-sm">License No. <span className="font-bold">{data.licenseNo}</span></p>
      </div>
    </div>
  </div>
);

export default function App() {
  const [pastedText, setPastedText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [data, setData] = useState<CertificateData>({
    patientName: '',
    address: '',
    classification: 'indigent/ needy patient',
    assistanceType: '',
    issuanceDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    agencyName: DEFAULT_AGENCY,
    signatoryName: DEFAULT_SIGNATORY,
    signatoryTitle: DEFAULT_SIGNATORY_TITLE,
    licenseNo: DEFAULT_LICENSE,
  });

  const [isEditingLogos, setIsEditingLogos] = useState(false);
  const [isEditingSignatory, setIsEditingSignatory] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [zoom, setZoom] = useState(55);
  const [printSettings, setPrintSettings] = useState({
    paperSize: 'a4',
    orientation: 'portrait',
    copies: 1,
    printer: 'System Default',
    margins: 'normal'
  });

  // Update print styles whenever settings change
  React.useEffect(() => {
    const styleId = 'dynamic-print-settings';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    const sizeMap: Record<string, string> = {
      'letter': '8.5in 11in',
      'a4': '210mm 297mm',
      'legal': '8.5in 14in',
      'folio': '8.5in 13in'
    };

    const pageSize = sizeMap[printSettings.paperSize] || 'auto';
    const marginMap: Record<string, string> = {
      'normal': '0.75in',
      'narrow': '0.5in',
      'wide': '1in 2in'
    };
    const pageMargins = marginMap[printSettings.margins] || '0.75in';

    styleElement.innerHTML = `
      @media print {
        @page {
          size: ${pageSize} ${printSettings.orientation};
          margin: 0;
        }
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          background: white !important;
        }
        .no-print {
          display: none !important;
        }
        .print-container {
          padding: ${pageMargins} !important;
          margin: 0 auto !important;
          box-shadow: none !important;
          border: none !important;
          width: 100% !important;
          height: auto !important;
          min-height: 0 !important;
        }
      }
    `;
  }, [printSettings]);
  const [assets, setAssets] = useState<CertificateAssets>({
    signature: null,
    logos: {
      logo1: { src: DEFAULT_LOGOS.logo1, x: 0, y: 0, width: 96, height: 96 },
      logo2: { src: DEFAULT_LOGOS.logo2, x: 0, y: 0, width: 96, height: 96 },
      logo3: { src: DEFAULT_LOGOS.logo3, x: 0, y: 0, width: 96, height: 96 },
      logo4: { src: DEFAULT_LOGOS.logo4, x: 0, y: 0, width: 144, height: 96 },
    }
  });

  const fileInputRefs = {
    signature: useRef<HTMLInputElement>(null),
    logo1: useRef<HTMLInputElement>(null),
    logo2: useRef<HTMLInputElement>(null),
    logo3: useRef<HTMLInputElement>(null),
    logo4: useRef<HTMLInputElement>(null),
  };

  const updateLogo = (key: keyof CertificateAssets['logos'], updates: Partial<LogoAsset>) => {
    setAssets(prev => ({
      ...prev,
      logos: {
        ...prev.logos,
        [key]: { ...prev.logos[key], ...updates }
      }
    }));
  };

  const handleLogoUpload = (key: keyof CertificateAssets['logos']) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateLogo(key, { src: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const [assistanceOptions, setAssistanceOptions] = useState([
    'Laboratory', 'X-ray', 'CT-Scan', 'MRI', 'Ultrasound', 'Medicine', 
    'Physical Therapy', 'Occupational Therapy', 'Supply', 'Instrumentation Fee', 
    'Implant Fee', 'Hospital Bill', 'ECG', '2D Echo', 'NST & Scanning'
  ]);
  const [newOption, setNewOption] = useState('');
  const [isAddingOption, setIsAddingOption] = useState(false);

  const toggleAssistanceType = (type: string) => {
    const currentTypes = data.assistanceType ? data.assistanceType.split(' / ') : [];
    let newTypes;
    if (currentTypes.includes(type)) {
      newTypes = currentTypes.filter(t => t !== type);
    } else {
      newTypes = [...currentTypes, type];
    }
    setData({ ...data, assistanceType: newTypes.join(' / ') });
  };

  const handleAddOption = () => {
    if (newOption.trim() && !assistanceOptions.includes(newOption.trim())) {
      const trimmed = newOption.trim();
      setAssistanceOptions([...assistanceOptions, trimmed]);
      toggleAssistanceType(trimmed);
      setNewOption('');
      setIsAddingOption(false);
    }
  };

  const handleFileUpload = (key: 'signature') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAssets(prev => ({ ...prev, [key]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = async () => {
    if (!pastedText.trim()) return;
    
    setIsParsing(true);
    try {
      const parsed = await parsePastedData(pastedText);
      setData(prev => ({
        ...prev,
        ...parsed,
      }));
    } catch (error) {
      console.error("Failed to parse:", error);
    } finally {
      setIsParsing(false);
    }
  };

  const handlePrint = () => {
    setIsPrintModalOpen(true);
  };

  const executePrint = () => {
    // Directly call print. This is the most reliable way as it's 
    // triggered directly by a user click event.
    window.focus();
    window.print();
    
    // Close modal after the print dialog is closed
    setIsPrintModalOpen(false);
  };

  const handleReset = () => {
    setPastedText('');
    setData({
      patientName: '',
      address: '',
      classification: 'indigent/ needy patient',
      assistanceType: '',
      issuanceDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      agencyName: DEFAULT_AGENCY,
      signatoryName: DEFAULT_SIGNATORY,
      signatoryTitle: DEFAULT_SIGNATORY_TITLE,
      licenseNo: DEFAULT_LICENSE,
    });
    setIsEditingLogos(false);
    setIsEditingSignatory(false);
  };

  return (
    <div className="min-h-screen bg-zinc-900 font-sans text-zinc-100">
      {/* UI Header - Hidden on Print */}
      <header className="no-print bg-zinc-800 border-b border-zinc-700 py-4 px-6 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileText className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-white">Indigency Certificate Generator</h1>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsEditingLogos(!isEditingLogos)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isEditingLogos ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              <Settings className={`w-4 h-4 ${isEditingLogos ? 'animate-spin' : ''}`} />
              {isEditingLogos ? 'Finish Editing' : 'Edit Logos'}
            </button>
            <button 
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-700 hover:text-white rounded-md transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </button>
            <button 
              onClick={handlePrint}
              disabled={!data.patientName}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print Certificate
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 print:block print:p-0 print:m-0 print:max-w-none">
        {/* Input Section - Hidden on Print */}
        <section className="no-print lg:col-span-4 space-y-6">
          {/* Data Extraction */}
          <div className="bg-zinc-800 p-6 rounded-xl shadow-sm border border-zinc-700">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-4 flex items-center gap-2">
              <ClipboardPaste className="w-4 h-4" />
              Paste Patient Data
            </h2>
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste patient details here..."
              className="w-full h-32 p-3 text-sm border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
            />
            <button
              onClick={handlePaste}
              disabled={isParsing || !pastedText.trim()}
              className="w-full mt-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Auto-Fill Data'}
            </button>
          </div>

          {/* Asset Uploads */}
          <div className="bg-zinc-800 p-6 rounded-xl shadow-sm border border-zinc-700 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Assets
            </h2>
            <div className="space-y-4">
              {/* Logos Upload */}
              {isEditingLogos && (
                <div className="grid grid-cols-2 gap-2">
                  {(['logo1', 'logo2', 'logo3', 'logo4'] as const).map((key, idx) => (
                    <div key={key}>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Logo {idx + 1}</label>
                      <button
                        onClick={() => fileInputRefs[key].current?.click()}
                        className="w-full h-16 flex items-center justify-center border border-dashed border-zinc-700 rounded hover:border-blue-500 hover:bg-zinc-700 transition-all overflow-hidden"
                      >
                        <img src={assets.logos[key].src} alt={`Logo ${idx + 1}`} className="h-full object-contain" />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRefs[key]}
                        onChange={handleLogoUpload(key)}
                        className="hidden"
                        accept="image/*"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase">Signature</label>
                  {assets.signature && (
                    <button
                      onClick={() => setIsConfirmingDelete(true)}
                      className="text-[10px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 uppercase transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  )}
                </div>
                <button
                  onClick={() => fileInputRefs.signature.current?.click()}
                  className="w-full h-24 flex items-center justify-center border-2 border-dashed border-zinc-700 rounded-lg hover:border-blue-500 hover:bg-zinc-700 transition-all overflow-hidden"
                >
                  {assets.signature ? (
                    <img src={assets.signature} alt="Signature" className="h-full object-contain" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-zinc-600" />
                  )}
                </button>
                <input
                  type="file"
                  ref={fileInputRefs.signature}
                  onChange={handleFileUpload('signature')}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>
          </div>

          {/* Manual Edit */}
          <div className="bg-zinc-800 p-6 rounded-xl shadow-sm border border-zinc-700 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Edit Details</h2>
              <button
                onClick={() => setIsEditingSignatory(!isEditingSignatory)}
                className={`text-[10px] font-bold px-2 py-1 rounded transition-colors uppercase ${
                  isEditingSignatory ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'
                }`}
              >
                {isEditingSignatory ? 'Hide Signatory' : 'Edit Signatory'}
              </button>
            </div>
            
            <div className="space-y-3">
              {/* Basic Patient Fields */}
              {(['patientName', 'address', 'classification', 'assistanceType'] as const).map((key) => (
                <div key={key}>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{key.replace(/([A-Z])/g, ' $1')}</label>
                  {key === 'classification' ? (
                    <select
                      value={data[key]}
                      onChange={(e) => setData({...data, [key]: e.target.value})}
                      className="w-full p-2 text-sm border border-zinc-700 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-zinc-900 text-zinc-100"
                    >
                      <option value="">Select Classification</option>
                      <option value="Financially Capacitated">Financially Capacitated</option>
                      <option value="Financially Incapacitated (C2)">Financially Incapacitated (C2)</option>
                      <option value="Financially Incapacitated (C1)">Financially Incapacitated (C1)</option>
                      <option value="Indigent">Indigent</option>
                    </select>
                  ) : key === 'assistanceType' ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1.5 p-2 border border-zinc-700 rounded bg-zinc-900 min-h-[40px]">
                        {assistanceOptions.map((option) => (
                          <button
                            key={option}
                            onClick={() => toggleAssistanceType(option)}
                            className={`px-2 py-1 text-[11px] rounded-full border transition-all ${
                              data.assistanceType.split(' / ').includes(option)
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-blue-500'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                        <button
                          onClick={() => setIsAddingOption(!isAddingOption)}
                          className="px-2 py-1 text-[11px] rounded-full border border-dashed border-zinc-600 text-zinc-500 hover:border-blue-500 hover:text-blue-400 transition-all"
                        >
                          + Add Option
                        </button>
                        {data.assistanceType && (
                          <button
                            onClick={() => setData({ ...data, assistanceType: '' })}
                            className="px-2 py-1 text-[11px] rounded-full border border-red-900/50 text-red-400 bg-red-900/20 hover:bg-red-900/30 transition-all font-medium"
                          >
                            Clear Selection
                          </button>
                        )}
                      </div>
                      
                      {isAddingOption && (
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={newOption}
                            onChange={(e) => setNewOption(e.target.value)}
                            placeholder="New assistance type..."
                            className="flex-1 p-2 text-sm border border-zinc-700 rounded outline-none focus:ring-1 focus:ring-blue-500 bg-zinc-900 text-zinc-100"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                          />
                          <button
                            onClick={handleAddOption}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      value={data[key]}
                      onChange={(e) => setData({...data, [key]: e.target.value})}
                      className="w-full p-2 text-sm border border-zinc-700 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-zinc-900 text-zinc-100"
                    />
                  )}
                </div>
              ))}

              {/* Signatory Fields - Conditional */}
              {isEditingSignatory && (
                <div className="pt-4 border-t border-zinc-700 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Signatory & Agency Details</h3>
                  {(['issuanceDate', 'signatoryName', 'signatoryTitle', 'licenseNo', 'agencyName'] as const).map((key) => (
                    <div key={key}>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{key.replace(/([A-Z])/g, ' $1')}</label>
                      <input 
                        type="text" 
                        value={data[key]}
                        onChange={(e) => setData({...data, [key]: e.target.value})}
                        className="w-full p-2 text-sm border border-zinc-700 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-zinc-900 text-zinc-100"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Preview Section */}
        <section className="lg:col-span-8 flex justify-center print:block print:w-full">
          <div className="flex-1 bg-zinc-900 p-8 overflow-auto flex justify-center print:p-0 print:bg-white print:block">
            <CertificateContent 
              data={data} 
              assets={assets} 
              isEditingLogos={isEditingLogos} 
              updateLogo={updateLogo} 
              paperSize={printSettings.paperSize}
              margins={printSettings.margins}
            />
          </div>
        </section>
      </main>

      {/* Footer - Hidden on Print */}
      <footer className="no-print py-8 text-center text-neutral-400 text-xs">
        <p>© 2026 Indigency Certificate Generator • Powered by Gemini AI</p>
      </footer>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isConfirmingDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm no-print">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Delete Signature?</h3>
                  <p className="text-sm text-zinc-400 mt-1">This action cannot be undone. You will need to re-upload the signature image.</p>
                </div>
              </div>
              <div className="p-4 bg-zinc-800/50 border-t border-zinc-700 flex gap-3">
                <button 
                  onClick={() => setIsConfirmingDelete(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-700 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setAssets(prev => ({ ...prev, signature: null }));
                    setIsConfirmingDelete(false);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors shadow-lg shadow-red-900/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Settings Modal */}
      <AnimatePresence>
        {isPrintModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md no-print">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              className="bg-[#1e1e1e] border border-zinc-700 rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col md:flex-row"
            >
              {/* Word-like Sidebar */}
              <div className="w-full md:w-80 flex flex-col border-r border-zinc-700 bg-[#2b2b2b]">
                <div className="p-6 border-b border-zinc-700">
                  <h2 className="text-2xl font-light text-white mb-6">Print</h2>
                  
                  <button 
                    onClick={executePrint}
                    className="w-32 h-32 bg-[#0078d4] hover:bg-[#106ebe] text-white rounded flex flex-col items-center justify-center gap-2 transition-colors shadow-lg group"
                  >
                    <Printer className="w-10 h-10 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium">Print</span>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                  {/* Printer Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Printer</h3>
                      <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30">System Managed</span>
                    </div>
                    <div className="space-y-2">
                      <div className="relative">
                        <select
                          value={printSettings.printer}
                          onChange={(e) => setPrintSettings({ ...printSettings, printer: e.target.value })}
                          className="w-full bg-[#3b3b3b] border border-zinc-600 rounded px-3 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-[#0078d4] transition-all text-sm appearance-none cursor-not-allowed"
                          disabled
                        >
                          <option value="System Default">Your Connected Printer (System Default)</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                          <Settings className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">
                        For security, browsers require you to select your specific physical printer in the <span className="text-zinc-300 font-medium">System Print Dialog</span> which will appear after clicking Print.
                      </p>
                    </div>
                  </div>

                  {/* Settings Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Settings</h3>
                    
                    <div className="space-y-3">
                      {/* Orientation */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-500 ml-1">Orientation</label>
                        <select
                          value={printSettings.orientation}
                          onChange={(e) => setPrintSettings({ ...printSettings, orientation: e.target.value as any })}
                          className="w-full bg-[#3b3b3b] border border-zinc-600 rounded px-3 py-2.5 text-white text-sm appearance-none"
                        >
                          <option value="portrait">Portrait Orientation</option>
                          <option value="landscape">Landscape Orientation</option>
                        </select>
                      </div>

                      {/* Paper Size */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-500 ml-1">Paper Size</label>
                        <select
                          value={printSettings.paperSize}
                          onChange={(e) => setPrintSettings({ ...printSettings, paperSize: e.target.value })}
                          className="w-full bg-[#3b3b3b] border border-zinc-600 rounded px-3 py-2.5 text-white text-sm appearance-none"
                        >
                          <option value="a4">A4 (21 cm x 29.7 cm)</option>
                          <option value="letter">Letter (21.59 cm x 27.94 cm)</option>
                          <option value="legal">Legal (21.59 cm x 35.56 cm)</option>
                          <option value="folio">Folio (21.59 cm x 33.02 cm)</option>
                        </select>
                      </div>

                      {/* Margins */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-500 ml-1">Margins</label>
                        <select
                          value={printSettings.margins}
                          onChange={(e) => setPrintSettings({ ...printSettings, margins: e.target.value })}
                          className="w-full bg-[#3b3b3b] border border-zinc-600 rounded px-3 py-2.5 text-white text-sm appearance-none"
                        >
                          <option value="normal">Normal (1" all sides)</option>
                          <option value="narrow">Narrow (0.5" all sides)</option>
                          <option value="wide">Wide (1" top/bottom, 2" sides)</option>
                        </select>
                      </div>

                      {/* Copies */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-500 ml-1">Copies</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            min="1"
                            value={printSettings.copies}
                            onChange={(e) => setPrintSettings({ ...printSettings, copies: parseInt(e.target.value) || 1 })}
                            className="flex-1 bg-[#3b3b3b] border border-zinc-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#0078d4]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Troubleshooting Section */}
                  <div className="pt-4 border-t border-zinc-700/50 space-y-3">
                    <p className="text-[10px] text-zinc-500 leading-relaxed">
                      <span className="font-bold text-zinc-400">Note:</span> If your connected printer doesn't appear in the next window, ensure it is turned on and connected via USB or Wi-Fi.
                    </p>
                    
                    {window.self !== window.top && (
                      <button 
                        onClick={() => window.open(window.location.href, '_blank')}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium rounded border border-zinc-700 transition-colors"
                      >
                        <Maximize2 className="w-3 h-3" />
                        Open in New Tab for Better Printer Access
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-[#252525] border-t border-zinc-700">
                  <button 
                    onClick={() => setIsPrintModalOpen(false)}
                    className="w-full px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                  >
                    Close Backstage
                  </button>
                </div>
              </div>

              {/* Preview Panel - Fixed size container */}
              <div className="flex-1 bg-[#444444] relative flex flex-col overflow-hidden">
                <div className="absolute top-4 left-6 z-10">
                  <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live Preview</span>
                  </div>
                </div>

                <button 
                  onClick={() => setIsPrintModalOpen(false)}
                  className="absolute top-4 right-6 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors text-white/70 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
                
                {/* Scrollable Preview Area */}
                <div className="flex-1 overflow-auto p-12 flex items-start justify-center custom-scrollbar bg-[#333333]">
                  <div 
                    className="bg-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 ease-in-out relative"
                    style={{
                      width: printSettings.paperSize === 'letter' ? '8.5in' :
                             printSettings.paperSize === 'a4' ? '210mm' :
                             printSettings.paperSize === 'legal' ? '8.5in' : 
                             printSettings.paperSize === 'folio' ? '8.5in' : '210mm',
                      height: printSettings.paperSize === 'letter' ? '11in' :
                              printSettings.paperSize === 'a4' ? '297mm' :
                              printSettings.paperSize === 'legal' ? '14in' : 
                              printSettings.paperSize === 'folio' ? '13in' : '297mm',
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: 'top center',
                      marginBottom: '100px' // Space at bottom for scroll
                    }}
                  >
                    {/* Landscape Rotation Wrapper */}
                    <div 
                      className="w-full h-full transition-transform duration-500"
                      style={{
                        transform: printSettings.orientation === 'landscape' ? 'rotate(-90deg)' : 'none',
                        transformOrigin: 'center center',
                        width: printSettings.orientation === 'landscape' ? '141.4%' : '100%',
                        height: printSettings.orientation === 'landscape' ? '70.7%' : '100%',
                        position: printSettings.orientation === 'landscape' ? 'absolute' : 'relative',
                        top: printSettings.orientation === 'landscape' ? '15%' : '0',
                        left: printSettings.orientation === 'landscape' ? '-20%' : '0',
                      }}
                    >
                      <CertificateContent 
                        data={data} 
                        assets={assets} 
                        isPreview={true} 
                        paperSize={printSettings.paperSize}
                        margins={printSettings.margins}
                      />
                    </div>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="h-8 bg-[#0078d4] flex items-center justify-between px-4 text-[11px] text-white font-medium">
                  <div className="flex items-center gap-4">
                    <span>Page 1 of 1</span>
                    <span className="opacity-70">|</span>
                    <span className="uppercase">{printSettings.paperSize}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <span className="opacity-70">Zoom: {zoom}%</span>
                      <input 
                        type="range" 
                        min="20" 
                        max="100" 
                        value={zoom}
                        onChange={(e) => setZoom(parseInt(e.target.value))}
                        className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Print Styles */}
      <style>
        {`
          @media print {
            @page {
              size: ${
                printSettings.paperSize === 'letter' ? '8.5in 11in' :
                printSettings.paperSize === 'a4' ? '210mm 297mm' :
                printSettings.paperSize === 'legal' ? '8.5in 14in' :
                printSettings.paperSize === 'folio' ? '8.5in 13in' : 'letter'
              } ${printSettings.orientation};
              margin: 0;
            }
            .print-container {
              width: ${
                printSettings.paperSize === 'letter' ? '8.5in' :
                printSettings.paperSize === 'a4' ? '210mm' :
                printSettings.paperSize === 'legal' ? '8.5in' :
                printSettings.paperSize === 'folio' ? '8.5in' : '8.5in'
              } !important;
              height: ${
                printSettings.paperSize === 'letter' ? '11in' :
                printSettings.paperSize === 'a4' ? '297mm' :
                printSettings.paperSize === 'legal' ? '14in' :
                printSettings.paperSize === 'folio' ? '13in' : '11in'
              } !important;
              ${printSettings.orientation === 'landscape' ? `
                width: ${
                  printSettings.paperSize === 'letter' ? '11in' :
                  printSettings.paperSize === 'a4' ? '297mm' :
                  printSettings.paperSize === 'legal' ? '14in' :
                  printSettings.paperSize === 'folio' ? '13in' : '11in'
                } !important;
                height: ${
                  printSettings.paperSize === 'letter' ? '8.5in' :
                  printSettings.paperSize === 'a4' ? '210mm' :
                  printSettings.paperSize === 'legal' ? '8.5in' :
                  printSettings.paperSize === 'folio' ? '8.5in' : '8.5in'
                } !important;
              ` : ''}
            }
          }
        `}
      </style>
    </div>
  );
}
