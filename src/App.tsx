import React, { useState, useRef } from 'react';
import { Printer, ClipboardPaste, RefreshCw, FileText, Upload, Image as ImageIcon, Settings, Maximize2, Trash2, Loader, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { parsePastedData } from './services/gemini';
import { CertificateData, CertificateAssets, LogoAsset, DEFAULT_AGENCY, DEFAULT_SIGNATORY, DEFAULT_SIGNATORY_TITLE, DEFAULT_LICENSE, DEFAULT_LOGOS } from './types';

// Reusable Certificate Content Component
const CertificateContent = ({ 
  data, 
  assets, 
  isEditingLogos = false, 
  updateLogo = () => {},
  isPrintVersion = false,
  onUpdateData = () => {},
}: { 
  data: CertificateData; 
  assets: CertificateAssets; 
  isEditingLogos?: boolean;
  updateLogo?: (key: keyof CertificateAssets['logos'], updates: Partial<LogoAsset>) => void;
  isPrintVersion?: boolean;
  onUpdateData?: (updates: Partial<CertificateData>) => void;
}) => (
  <div 
    className={`bg-white flex flex-col relative font-serif text-neutral-900 print-container ${isPrintVersion ? 'shadow-none' : 'shadow-2xl border border-neutral-200'}`}
    style={{
      padding: '0.75in',
      width: '210mm',
      height: '297mm',
      minWidth: '210mm',
      minHeight: '297mm',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}
  >
    {/* Header Logos */}
    <div className="flex justify-center items-center gap-8 mb-4 px-4 min-h-[120px] relative">
      {(['logo1', 'logo2', 'logo3', 'logo4'] as const).map((key) => (
        <motion.div
          key={key}
          drag={isEditingLogos}
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
          className={`relative flex items-center justify-center ${isEditingLogos ? 'cursor-move ring-2 ring-blue-400 ring-offset-4 rounded' : ''}`}
        >
          <img 
            src={assets.logos[key].src} 
            alt={key} 
            className="max-h-full max-w-full object-contain pointer-events-none" 
            referrerPolicy="no-referrer" 
          />
          
          {isEditingLogos && (
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

    <div className="text-right font-bold text-lg mb-8 pr-4">ANNEX A</div>

    <div className="text-center mb-12">
      <h3 className="text-xl font-bold underline decoration-1 underline-offset-[4px] uppercase tracking-tight">
        CERTIFICATE OF ELIGIBILITY
      </h3>
    </div>

    <div className="space-y-10 text-[1.1rem] leading-[1.5]">
      <div className="flex items-end gap-2 relative">
        <span className="whitespace-nowrap">This is certify that</span>
        <div className="flex-1 border-b border-black text-center font-bold px-2 relative group">
          <input
            type="text"
            value={data.patientName}
            onChange={(e) => onUpdateData({ patientName: e.target.value })}
            className="w-full bg-transparent text-center font-bold outline-none border-none p-0 m-0 focus:ring-1 focus:ring-blue-400/30 rounded"
            placeholder="[Name of Patient]"
          />
        </div>
        <div className="absolute left-[120px] -bottom-5 w-full text-center text-[10px] text-neutral-600">
          (Name of Patient)
        </div>
      </div>

      <div className="flex items-end gap-2 relative pt-2">
        <span className="whitespace-nowrap">of</span>
        <div className="flex-1 border-b border-black text-center font-bold px-2 relative group">
          <input
            type="text"
            value={data.address}
            onChange={(e) => onUpdateData({ address: e.target.value })}
            className="w-full bg-transparent text-center font-bold outline-none border-none p-0 m-0 focus:ring-1 focus:ring-blue-400/30 rounded"
            placeholder="[Address]"
          />
        </div>
        <span className="whitespace-nowrap">is an</span>
        <div className="absolute left-0 -bottom-5 w-full text-center text-[10px] text-neutral-600 pr-[40px]">
          (Address)
        </div>
      </div>

      <div className="flex items-end gap-2 pt-2">
        <span className="whitespace-nowrap">indigent/needy patient with a classification of</span>
        <div className="flex-1 border-b border-black text-center font-bold px-2 relative group">
          <input
            type="text"
            value={data.classification}
            onChange={(e) => onUpdateData({ classification: e.target.value })}
            className="w-full bg-transparent text-center font-bold outline-none border-none p-0 m-0 focus:ring-1 focus:ring-blue-400/30 rounded"
            placeholder="[Classification]"
          />
        </div>
        <span>.</span>
      </div>

      <p className="pt-2">
        This certification is issued as a requirement for seeking financial and medical assistance from the Malasakit Center especially for the following assistance/s or service/s:
      </p>

      <div className="border-b border-black min-h-[2.5rem] font-bold text-center flex items-center justify-center relative group">
        <input
          type="text"
          value={data.assistanceType}
          onChange={(e) => onUpdateData({ assistanceType: e.target.value })}
          className="w-full bg-transparent text-center font-bold outline-none border-none p-0 m-0 focus:ring-1 focus:ring-blue-400/30 rounded"
          placeholder="[Assistance Type]"
        />
      </div>

      <div className="flex items-end gap-2 relative pt-2">
        <span className="whitespace-nowrap">from</span>
        <div className="flex-1 text-center font-bold px-2 uppercase border-b border-black relative group">
          <input
            type="text"
            value={data.agencyName}
            onChange={(e) => onUpdateData({ agencyName: e.target.value })}
            className="w-full bg-transparent text-center font-bold outline-none border-none p-0 m-0 focus:ring-1 focus:ring-blue-400/30 rounded uppercase"
            placeholder="[Agency Name]"
          />
        </div>
        <div className="absolute left-0 -bottom-5 w-full text-center text-[10px] text-neutral-600">
          (Name of Participating Agency)
        </div>
      </div>

      <div className="flex items-end gap-2 pt-6">
        <span className="whitespace-nowrap">This Certification is issued on</span>
        <div className="flex-1 relative">
          <div className="border-b border-black text-center font-bold px-2 relative group">
            <input
              type="text"
              value={data.issuanceDate}
              onChange={(e) => onUpdateData({ issuanceDate: e.target.value })}
              className="w-full bg-transparent text-center font-bold outline-none border-none p-0 m-0 focus:ring-1 focus:ring-blue-400/30 rounded"
              placeholder="[Date]"
            />
          </div>
          <div className="absolute left-0 right-0 -bottom-5 text-center text-[10px] text-neutral-600">
            (Date)
          </div>
        </div>
        <span>.</span>
      </div>
    </div>

    <div className="mt-auto pt-12 relative">
      <p className="text-lg mb-8">Issued by:</p>
      
      <div className="relative mt-8">
        {/* E-Signature */}
        {assets.signature && (
          <img 
            src={assets.signature} 
            alt="Signature" 
            className="absolute -top-16 left-4 h-24 w-auto pointer-events-none"
          />
        )}
        
        <div className="relative group">
          <input
            type="text"
            value={data.signatoryName}
            onChange={(e) => onUpdateData({ signatoryName: e.target.value })}
            className="w-full bg-transparent font-bold text-lg uppercase underline decoration-1 underline-offset-2 outline-none border-none p-0 m-0 focus:ring-1 focus:ring-blue-400/30 rounded"
            placeholder="[Signatory Name]"
          />
        </div>
        <div className="relative group">
          <input
            type="text"
            value={data.signatoryTitle}
            onChange={(e) => onUpdateData({ signatoryTitle: e.target.value })}
            className="w-full bg-transparent text-xs leading-tight max-w-md outline-none border-none p-0 m-0 focus:ring-1 focus:ring-blue-400/30 rounded"
            placeholder="[Signatory Title]"
          />
        </div>
        <p className="text-xs">License No. <span className="font-bold relative group">
          <input
            type="text"
            value={data.licenseNo}
            onChange={(e) => onUpdateData({ licenseNo: e.target.value })}
            className="inline-block bg-transparent font-bold outline-none border-none p-0 m-0 focus:ring-1 focus:ring-blue-400/30 rounded w-auto"
            placeholder="[License No]"
          />
        </span></p>
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
  const [zoom, setZoom] = useState(55);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const fitToPage = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      const containerHeight = ref.current.clientHeight;
      const containerWidth = ref.current.clientWidth;
      const padding = 80;
      const availableHeight = containerHeight - padding;
      const availableWidth = containerWidth - padding;
      
      const a4WidthPx = 210 * 3.78;
      const a4HeightPx = 297 * 3.78;
      
      const scaleHeight = availableHeight / a4HeightPx;
      const scaleWidth = availableWidth / a4WidthPx;
      
      const newZoom = Math.floor(Math.min(scaleHeight, scaleWidth) * 100);
      setZoom(Math.max(20, Math.min(100, newZoom)));
    }
  };

  const handlePrint = () => {
    // Explicitly focus the window to ensure the print dialog targets the correct context
    window.focus();
    // Trigger the native browser print dialog (Chrome/Edge/Safari/Firefox)
    window.print();
  };

  // Initial fit and resize listener for main preview
  React.useEffect(() => {
    fitToPage(previewContainerRef);
    const handleResize = () => fitToPage(previewContainerRef);
    
    // Add Ctrl+P listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
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

  // Load state from localStorage on mount
  React.useEffect(() => {
    const savedData = localStorage.getItem('certificate_data');
    const savedAssets = localStorage.getItem('certificate_assets');
    if (savedData) setData(JSON.parse(savedData));
    if (savedAssets) setAssets(JSON.parse(savedAssets));
  }, []);

  // Save state to localStorage on change
  React.useEffect(() => {
    localStorage.setItem('certificate_data', JSON.stringify(data));
  }, [data]);

  React.useEffect(() => {
    localStorage.setItem('certificate_assets', JSON.stringify(assets));
  }, [assets]);

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

  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#121212] font-sans text-zinc-100 selection:bg-blue-500/30">
      <div className="no-print">
        {/* UI Header - Hidden on Print */}
        <header className="bg-[#1e1e1e] border-b border-zinc-700 py-4 px-6 sticky top-0 z-50 shadow-sm top-nav">
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
              onClick={() => setIsHelpOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-700 hover:text-white rounded-md transition-colors"
            >
              <FileText className="w-4 h-4" />
              Help
            </button>
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-8 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
              title="Open browser print dialog (Ctrl+P)"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <section className="lg:col-span-4 space-y-6 sidebar edit-details-panel">
          {/* Data Extraction */}
          <div className="bg-[#1e1e1e] p-6 rounded-xl shadow-sm border border-zinc-700 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-2">
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
              {isParsing ? <Loader className="w-4 h-4 animate-spin" /> : 'Auto-Fill Data'}
            </button>
          </div>

          {/* Asset Uploads */}
          <div className="bg-[#1e1e1e] p-6 rounded-xl shadow-sm border border-zinc-700 space-y-4">
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
          <div className="bg-[#1e1e1e] p-6 rounded-xl shadow-sm border border-zinc-700 space-y-4">
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
        <section className="lg:col-span-8 flex flex-col h-[calc(100vh-160px)]">
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Live Preview (A4)</h2>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-zinc-500 uppercase">Zoom: {zoom}%</span>
              <input 
                type="range" 
                min="20" 
                max="100" 
                value={zoom}
                onChange={(e) => setZoom(parseInt(e.target.value))}
                className="w-24 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <button 
                onClick={() => fitToPage(previewContainerRef)}
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase transition-colors"
              >
                Fit to Page
              </button>
            </div>
          </div>
          <div 
            ref={previewContainerRef}
            className="flex-1 bg-zinc-950 rounded-xl border border-zinc-800 overflow-auto flex items-start justify-center p-8 custom-scrollbar relative"
          >
            <div 
              className="transition-all duration-300 ease-in-out origin-top"
              style={{
                transform: `scale(${zoom / 100})`,
                marginBottom: '50px'
              }}
            >
              <CertificateContent 
                data={data} 
                assets={assets} 
                isEditingLogos={isEditingLogos} 
                updateLogo={updateLogo} 
                isPrintVersion={false}
                onUpdateData={(updates) => setData(prev => ({ ...prev, ...updates }))}
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-neutral-400 text-xs">
        <p>© 2026 Indigency Certificate Generator • Powered by Gemini AI</p>
      </footer>
      {/* Help Modal */}
      <AnimatePresence>
        {isHelpOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm no-print">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Printer className="w-5 h-5 text-blue-500" />
                  How Printing Works
                </h3>
                <button onClick={() => setIsHelpOpen(false)} className="text-zinc-500 hover:text-white">
                  <RefreshCw className="w-5 h-5 rotate-45" />
                </button>
              </div>
              <div className="p-6 space-y-4 text-sm text-zinc-300">
                <div className="flex gap-3">
                  <div className="bg-blue-500/10 p-2 rounded-lg h-fit">
                    <Maximize2 className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">1. Direct Printing</p>
                    <p>Clicking "Print" or pressing <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px]">P</kbd> opens the native Chrome print dialog directly.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-blue-500/10 p-2 rounded-lg h-fit">
                    <Printer className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">2. Standard Shortcut</p>
                    <p>You can press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px]">P</kbd> at any time to trigger the Chrome print dialog.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-amber-500/10 p-2 rounded-lg h-fit">
                    <FileText className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-amber-400">3. Print Settings</p>
                    <p>In the Chrome print popup, set <b>Margins</b> to "None" and <b>Scale</b> to "100" to ensure the A4 template fits perfectly.</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-zinc-800/50 border-t border-zinc-700 flex justify-end">
                <button 
                  onClick={() => setIsHelpOpen(false)}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isConfirmingDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
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
      </div>

      {/* Print-only container */}
      <div className="print-only" id="printable-certificate">
        <div className="certificate-preview">
          <CertificateContent 
            data={data} 
            assets={assets} 
            isPrintVersion={true}
          />
        </div>
      </div>
    </div>
  );
}
