import React, { useState, useRef } from 'react';
import { Printer, ClipboardPaste, RefreshCw, FileText, Upload, Image as ImageIcon, Settings, Maximize2, Trash2, Loader, ExternalLink, Search, Filter, Calendar, History, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { parsePastedData, parsePastedImage } from './services/gemini';
import { CertificateData, CertificateAssets, LogoAsset, IssuedCOE, DEFAULT_AGENCY, DEFAULT_SIGNATORY, DEFAULT_SIGNATORY_TITLE, DEFAULT_LICENSE, DEFAULT_LOGOS } from './types';

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
      paddingTop: '0.02in',
      paddingBottom: '0.75in',
      paddingLeft: '0.75in',
      paddingRight: '0.75in',
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

    <div className="text-right font-bold text-lg mb-2 pr-4">ANNEX A</div>

    <div className="text-center mb-6">
      <h3 className="text-xl font-bold underline decoration-1 underline-offset-[4px] uppercase tracking-tight">
        CERTIFICATE OF ELIGIBILITY (INDIGENCY)
      </h3>
    </div>

    <div className="space-y-5 text-[1.1rem] leading-[1.4]">
      <div className="flex items-end gap-2 relative">
        <span className="whitespace-nowrap">This is certify that</span>
        <div className="flex-1 border-b border-black text-center font-bold px-2 relative group">
          {isPrintVersion ? (
            <span className="w-full text-center block font-bold leading-none min-h-[1.2rem] pr-2 whitespace-nowrap">{data.patientName || '[Name of Patient]'}</span>
          ) : (
            <input
              type="text"
              value={data.patientName}
              onChange={(e) => onUpdateData({ patientName: e.target.value })}
              className="w-full bg-transparent text-center font-bold outline-none border-none p-0 m-0 focus:ring-1 focus:ring-blue-400/30 rounded"
              placeholder="[Name of Patient]"
            />
          )}
        </div>
        <div className="absolute left-[120px] -bottom-5 w-full text-center text-[10px] text-neutral-600">
          (Name of Patient)
        </div>
      </div>

      <div className="flex items-end gap-2 relative pt-2">
        <span className="whitespace-nowrap">of</span>
        <div className="flex-1 border-b border-black text-center font-bold px-2 relative group">
          {isPrintVersion ? (
            <span className="w-full text-center block font-bold leading-none min-h-[1.2rem] pr-2">{data.address || '[Address]'}</span>
          ) : (
            <input
              type="text"
              value={data.address}
              onChange={(e) => onUpdateData({ address: e.target.value })}
              className="w-full bg-transparent text-center font-bold outline-none border-none p-0 m-0 focus:ring-1 focus:ring-blue-400/30 rounded"
              placeholder="[Address]"
            />
          )}
        </div>
        <span className="whitespace-nowrap">is an</span>
        <div className="absolute left-0 -bottom-5 w-full text-center text-[10px] text-neutral-600 pr-[40px]">
          (Address)
        </div>
      </div>

      <div className="flex items-end gap-2 pt-2">
        <span className="whitespace-nowrap">indigent/needy patient with a classification of</span>
        <div className="flex-1 border-b border-black text-center font-bold px-2 relative group">
          {isPrintVersion ? (
            <span className="w-full text-center block font-bold leading-none min-h-[1.2rem] pr-2 whitespace-nowrap">{data.classification || '[Classification]'}</span>
          ) : (
            <input
              type="text"
              value={data.classification}
              onChange={(e) => onUpdateData({ classification: e.target.value })}
              className="w-full bg-transparent text-center font-bold outline-none border-none p-0 m-0 focus:ring-1 focus:ring-blue-400/30 rounded"
              placeholder="[Classification]"
            />
          )}
        </div>
        <span>.</span>
      </div>

      <p className="pt-2">
        This certification is issued as a requirement for seeking financial and medical assistance from the Malasakit Center especially for the following assistance/s or service/s:
      </p>

      <div className="border-b border-black min-h-[2.5rem] font-bold text-center flex items-center justify-center relative group">
        {isPrintVersion ? (
          <span className="w-full text-center block font-bold leading-normal pt-1 min-h-[1.2rem]">{data.assistanceType || '[Assistance Type]'}</span>
        ) : (
          <input
            type="text"
            value={data.assistanceType}
            onChange={(e) => onUpdateData({ assistanceType: e.target.value })}
            className="w-full bg-transparent text-center font-bold outline-none border-none p-0 m-0 focus:ring-1 focus:ring-blue-400/30 rounded"
            placeholder="[Assistance Type]"
          />
        )}
      </div>

      <div className="flex items-end gap-2 relative pt-2">
        <span className="whitespace-nowrap">from</span>
        <div className="flex-1 text-center font-bold px-2 uppercase border-b border-black relative group">
          {isPrintVersion ? (
            <span className="w-full text-center block font-bold leading-none uppercase min-h-[1.2rem]">{data.agencyName || '[Agency Name]'}</span>
          ) : (
            <input
              type="text"
              value={data.agencyName}
              onChange={(e) => onUpdateData({ agencyName: e.target.value })}
              className="w-full bg-transparent text-center font-bold outline-none border-none p-0 m-0 focus:ring-1 focus:ring-blue-400/30 rounded uppercase"
              placeholder="[Agency Name]"
            />
          )}
        </div>
        <div className="absolute left-0 -bottom-5 w-full text-center text-[10px] text-neutral-600">
          (Name of Participating Agency)
        </div>
      </div>

      <div className="flex items-end gap-2 pt-2">
        <span className="whitespace-nowrap">This Certification is issued on</span>
        <div className="flex-1 relative">
          <div className="border-b border-black text-center font-bold px-2 relative group">
            {isPrintVersion ? (
              <span className="w-full text-center block font-bold leading-none min-h-[1.2rem]">{data.issuanceDate || '[Date]'}</span>
            ) : (
              <input
                type="text"
                value={data.issuanceDate}
                onChange={(e) => onUpdateData({ issuanceDate: e.target.value })}
                className="w-full bg-transparent text-center font-bold outline-none border-none p-0 m-0 focus:ring-1 focus:ring-blue-400/30 rounded"
                placeholder="[Date]"
              />
            )}
          </div>
          <div className="absolute left-0 right-0 -bottom-5 text-center text-[10px] text-neutral-600">
            (Date)
          </div>
        </div>
        <span>.</span>
      </div>
    </div>

    <div className="mt-8 relative text-[1.1rem]">
      <p className="mb-2">Issued by:</p>
      
      <div className="relative mt-8 select-none">
        {/* E-Signature */}
        {assets.signature && (
          <img 
            src={assets.signature} 
            alt="Signature" 
            className="absolute -top-12 left-4 h-20 w-auto pointer-events-none"
          />
        )}
        
        <div className="relative group">
          {isPrintVersion ? (
            <span className="w-full block font-bold text-lg uppercase leading-normal min-h-[1.4rem]">{data.signatoryName || '[Signatory Name]'}</span>
          ) : (
            <input
              type="text"
              value={data.signatoryName}
              onChange={(e) => onUpdateData({ signatoryName: e.target.value })}
              className="w-full bg-transparent font-bold text-lg uppercase outline-none border-none p-0 m-0 focus:ring-1 focus:ring-blue-400/30 rounded"
              placeholder="[Signatory Name]"
            />
          )}
        </div>
        <div className="relative group text-sm text-neutral-600 leading-tight">
          {isPrintVersion ? (
            <span className="w-full block text-xs leading-normal text-neutral-500 min-h-[1.1rem]">{data.signatoryTitle || '[Signatory Title]'}</span>
          ) : (
            <input
              type="text"
              value={data.signatoryTitle}
              onChange={(e) => onUpdateData({ signatoryTitle: e.target.value })}
              className="w-full bg-transparent text-xs leading-tight max-w-md outline-none border-none p-0 m-0 focus:ring-1 focus:ring-blue-400/30 rounded text-neutral-500"
              placeholder="[Signatory Title]"
            />
          )}
        </div>
        <p className="text-xs text-neutral-500">License No. <span className="font-bold relative group">
          {isPrintVersion ? (
            <span className="inline-block font-bold text-neutral-700 min-h-[1.1rem]">{data.licenseNo || '[License No]'}</span>
          ) : (
            <input
              type="text"
              value={data.licenseNo}
              onChange={(e) => onUpdateData({ licenseNo: e.target.value })}
              className="inline-block bg-transparent font-bold outline-none border-none p-0 m-0 focus:ring-1 focus:ring-blue-400/30 rounded w-auto text-neutral-700"
              placeholder="[License No]"
            />
          )}
        </span></p>
      </div>
    </div>

    {/* Dashed separation line cleanly separating the form section */}
    <div className="border-t-2 border-dashed border-neutral-400/80 my-5 print:border-black"></div>

    {/* Dedicated large white empty space at bottom section of the page specifically intended for photocopying an ID */}
    <div className="flex-1 flex flex-col justify-center items-center">
      <span className="text-[10px] tracking-widest text-neutral-300 pointer-events-none uppercase font-mono select-none no-print">
        - Dedicated space for ID Photocopy -
      </span>
    </div>
  </div>
);

// Sample realistic Philippine Patient Certificates
const DEFAULT_SAMPLE_COES: IssuedCOE[] = [
  {
    id: 'coe_sample_1',
    data: {
      patientName: 'Juan Carlos M. dela Cruz',
      address: 'Brgy. Salvacion, Bayombong, Nueva Vizcaya',
      classification: 'Indigent',
      assistanceType: 'Laboratory / Medicine',
      issuanceDate: 'June 8, 2026',
      agencyName: DEFAULT_AGENCY,
      signatoryName: DEFAULT_SIGNATORY,
      signatoryTitle: DEFAULT_SIGNATORY_TITLE,
      licenseNo: DEFAULT_LICENSE,
    },
    assets: {
      signature: null,
      logos: {
        logo1: { src: DEFAULT_LOGOS.logo1, x: 0, y: 0, width: 96, height: 96 },
        logo2: { src: DEFAULT_LOGOS.logo2, x: 0, y: 0, width: 96, height: 96 },
        logo3: { src: DEFAULT_LOGOS.logo3, x: 0, y: 0, width: 96, height: 96 },
        logo4: { src: DEFAULT_LOGOS.logo4, x: 0, y: 0, width: 144, height: 96 },
      }
    },
    dateIssued: '2026-06-08T09:30:00.000Z'
  },
  {
    id: 'coe_sample_2',
    data: {
      patientName: 'Maria Theresa B. Santos',
      address: 'Brgy. San Jose, Solano, Nueva Vizcaya',
      classification: 'Financially Incapacitated (C2)',
      assistanceType: 'CT-Scan / MRI',
      issuanceDate: 'June 5, 2026',
      agencyName: DEFAULT_AGENCY,
      signatoryName: DEFAULT_SIGNATORY,
      signatoryTitle: DEFAULT_SIGNATORY_TITLE,
      licenseNo: DEFAULT_LICENSE,
    },
    assets: {
      signature: null,
      logos: {
        logo1: { src: DEFAULT_LOGOS.logo1, x: 0, y: 0, width: 96, height: 96 },
        logo2: { src: DEFAULT_LOGOS.logo2, x: 0, y: 0, width: 96, height: 96 },
        logo3: { src: DEFAULT_LOGOS.logo3, x: 0, y: 0, width: 96, height: 96 },
        logo4: { src: DEFAULT_LOGOS.logo4, x: 0, y: 0, width: 144, height: 96 },
      }
    },
    dateIssued: '2026-06-05T14:15:00.000Z'
  },
  {
    id: 'coe_sample_3',
    data: {
      patientName: 'Jose Rizal G. Mercado',
      address: 'Brgy. Quirino, Solano, Nueva Vizcaya',
      classification: 'Indigent',
      assistanceType: 'Hospital Bill',
      issuanceDate: 'June 3, 2026',
      agencyName: DEFAULT_AGENCY,
      signatoryName: DEFAULT_SIGNATORY,
      signatoryTitle: DEFAULT_SIGNATORY_TITLE,
      licenseNo: DEFAULT_LICENSE,
    },
    assets: {
      signature: null,
      logos: {
        logo1: { src: DEFAULT_LOGOS.logo1, x: 0, y: 0, width: 96, height: 96 },
        logo2: { src: DEFAULT_LOGOS.logo2, x: 0, y: 0, width: 96, height: 96 },
        logo3: { src: DEFAULT_LOGOS.logo3, x: 0, y: 0, width: 96, height: 96 },
        logo4: { src: DEFAULT_LOGOS.logo4, x: 0, y: 0, width: 144, height: 96 },
      }
    },
    dateIssued: '2026-06-03T11:00:00.000Z'
  },
  {
    id: 'coe_sample_4',
    data: {
      patientName: 'Charmaine Jane C. Mendoza',
      address: 'Brgy. Vista Alegre, Bayombong, Nueva Vizcaya',
      classification: 'Financially Capacicated (W/ CHS)',
      assistanceType: 'Ultrasound / Supplies',
      issuanceDate: 'June 1, 2026',
      agencyName: DEFAULT_AGENCY,
      signatoryName: DEFAULT_SIGNATORY,
      signatoryTitle: DEFAULT_SIGNATORY_TITLE,
      licenseNo: DEFAULT_LICENSE,
    },
    assets: {
      signature: null,
      logos: {
        logo1: { src: DEFAULT_LOGOS.logo1, x: 0, y: 0, width: 96, height: 96 },
        logo2: { src: DEFAULT_LOGOS.logo2, x: 0, y: 0, width: 96, height: 96 },
        logo3: { src: DEFAULT_LOGOS.logo3, x: 0, y: 0, width: 96, height: 96 },
        logo4: { src: DEFAULT_LOGOS.logo4, x: 0, y: 0, width: 144, height: 96 },
      }
    },
    dateIssued: '2026-06-01T08:45:00.000Z'
  }
];

const getFirstName = (fullName: string) => {
  if (!fullName) return '[No Name]';
  const parts = fullName.trim().replaceAll(/\s+/g, ' ').split(' ');
  // Grab the first part as First Name. If it's a common double name (e.g., Maria Theresa, Juan Carlos),
  // and the second name exists, let's include it, unless it looks like a middle initial (single character with or without dot)
  if (parts.length > 1) {
    const secondPart = parts[1];
    const isMiddleInitial = secondPart.length === 1 || (secondPart.length === 2 && secondPart.endsWith('.'));
    if (!isMiddleInitial) {
      return `${parts[0]} ${secondPart}`;
    }
  }
  return parts[0];
};

const getMaskedFullName = (fullName: string) => {
  if (!fullName) return '';
  const parts = fullName.trim().replaceAll(/\s+/g, ' ').split(' ');
  if (parts.length === 0) return '';
  
  const firstName = getFirstName(fullName);
  const firstNameLength = firstName.split(' ').length;
  
  if (parts.length <= firstNameLength) return firstName;
  
  const maskedParts = parts.slice(firstNameLength).map(p => {
    if (p.length === 0) return '';
    const isMiddleInitial = p.length === 1 || (p.length === 2 && p.endsWith('.'));
    if (isMiddleInitial) {
      return '*';
    }
    return p[0] + '*'.repeat(Math.min(5, p.length - 1));
  });
  return `${firstName} ${maskedParts.join(' ')}`;
};

export default function App() {
  const [currentView, setCurrentView] = useState<'generator' | 'list'>('generator');
  const [issuedList, setIssuedList] = useState<IssuedCOE[]>(() => {
    const saved = localStorage.getItem('issued_coe_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse issued_coe_list:", e);
      }
    }
    return DEFAULT_SAMPLE_COES;
  });

  // Search & Filters raw inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');

  // Applied filter parameters
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedStartDate, setAppliedStartDate] = useState('');
  const [appliedEndDate, setAppliedEndDate] = useState('');

  const [printTarget, setPrintTarget] = useState<IssuedCOE | null>(null);

  const [pastedText, setPastedText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractSuccess, setExtractSuccess] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<CertificateData>(() => {
    const saved = localStorage.getItem('certificate_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse certificate_data:", e);
      }
    }
    return {
      patientName: '',
      address: '',
      classification: 'indigent/ needy patient',
      assistanceType: '',
      issuanceDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      agencyName: DEFAULT_AGENCY,
      signatoryName: DEFAULT_SIGNATORY,
      signatoryTitle: DEFAULT_SIGNATORY_TITLE,
      licenseNo: DEFAULT_LICENSE,
    };
  });

  const [isEditingLogos, setIsEditingLogos] = useState(false);
  const [isEditingSignatory, setIsEditingSignatory] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [zoom, setZoom] = useState(55);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  const handleApplyFilters = () => {
    setAppliedSearch(searchQuery);
    setAppliedStartDate(startDateInput);
    setAppliedEndDate(endDateInput);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStartDateInput('');
    setEndDateInput('');
    setAppliedSearch('');
    setAppliedStartDate('');
    setAppliedEndDate('');
  };

  const handleDeleteCOE = (id: string) => {
    const updated = issuedList.filter(item => item.id !== id);
    setIssuedList(updated);
    localStorage.setItem('issued_coe_list', JSON.stringify(updated));
  };

  const filteredList = issuedList.filter(coe => {
    // 1. Search Query checking
    if (appliedSearch.trim()) {
      const query = appliedSearch.toLowerCase().trim();
      const patientName = (coe.data.patientName || '').toLowerCase();
      const classification = (coe.data.classification || '').toLowerCase();
      const assistance = (coe.data.assistanceType || '').toLowerCase();
      
      const matchName = patientName.includes(query);
      const matchClassification = classification.includes(query);
      const matchAssistance = assistance.includes(query);
      
      if (!matchName && !matchClassification && !matchAssistance) {
        return false;
      }
    }

    // 2. Date filtering
    if (appliedStartDate || appliedEndDate) {
      const coeDate = new Date(coe.dateIssued);
      coeDate.setHours(0,0,0,0);
      
      if (appliedStartDate) {
        const start = new Date(appliedStartDate);
        start.setHours(0,0,0,0);
        if (coeDate < start) return false;
      }
      if (appliedEndDate) {
        const end = new Date(appliedEndDate);
        end.setHours(23,59,59,999);
        if (coeDate > end) return false;
      }
    }

    return true;
  });

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

  const handlePrint = (historicalCoe?: IssuedCOE) => {
    if (historicalCoe) {
      setPrintTarget(historicalCoe);
      setTimeout(() => {
        executePrint(historicalCoe.data.patientName, true);
      }, 100);
    } else {
      executePrint(data.patientName, false);
    }
  };

  const executePrint = (patientName: string, isHistoric: boolean) => {
    // 1. Open a new window/tab
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to print the certificate.");
      if (isHistoric) setPrintTarget(null);
      return;
    }

    // 2. Grab style sheets
    let stylesHtml = '';
    document.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
      stylesHtml += node.outerHTML;
    });

    // 3. Grab the inner HTML of the certificate preview
    const certificateElement = document.getElementById('printable-certificate');
    if (!certificateElement) {
      alert("Certificate not found.");
      if (isHistoric) setPrintTarget(null);
      return;
    }
    const certificateContentHtml = certificateElement.innerHTML;

    // 4. Construct the dynamic HTML document for the printing window
    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate of Eligibility - ${patientName || 'Print'}</title>
          <base href="${window.location.origin}/">
          ${stylesHtml}
          <style>
            @media print {
              @page {
                size: A4;
                margin: 0;
              }
              body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
              }
            }
            body {
              background: #f4f4f5;
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .print-only {
              display: block !important;
            }
            .certificate-preview {
              background: white;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            }
          </style>
        </head>
        <body>
          <div class="print-only" id="printable-certificate">
            ${certificateContentHtml}
          </div>
          <script>
            window.addEventListener('load', () => {
              // Add a slight delay to ensure images/fonts have finished rendering
              setTimeout(() => {
                window.focus();
                window.print();
                window.close();
              }, 500);
            });
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();

    // Reset print target if it was a historical print
    if (isHistoric) {
      setPrintTarget(null);
    } else {
      // Auto-save the printed document to historical list
      if (data.patientName.trim()) {
        const newCoe: IssuedCOE = {
          id: 'coe_' + Date.now(),
          data: { ...data },
          assets: { ...assets },
          dateIssued: new Date().toISOString()
        };
        setIssuedList(prev => {
          const updated = [newCoe, ...prev];
          localStorage.setItem('issued_coe_list', JSON.stringify(updated));
          return updated;
        });
      }
    }
  };

  const processImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setPastedImage(reader.result as string);
      setImageMimeType(file.type);
      setImageName(file.name || "pasted-image.png");
      setExtractError(null);
      setExtractSuccess(false);
      setActiveTab("image");
      
      // Auto-trigger analysis!
      handleImageAnalysis(reader.result as string, file.type);
    };
    reader.readAsDataURL(file);
  };

  const handleImageAnalysis = async (imgBase64: string, mime: string) => {
    setIsProcessingImage(true);
    setExtractError(null);
    setExtractSuccess(false);
    try {
      const parsed = await parsePastedImage(imgBase64, mime);
      setData(prev => ({
        ...prev,
        ...parsed,
      }));
      setExtractSuccess(true);
      setTimeout(() => setExtractSuccess(false), 5000);
    } catch (error: any) {
      console.error("Failed to analyze image:", error);
      setExtractError(error.message || "Could not extract data from the image. Please verify your GEMINI_API_KEY.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
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

    // Global drag & paste handler for document images
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || (target.tagName === 'INPUT' && (target as HTMLInputElement).type !== 'file')) {
        const items = e.clipboardData?.items;
        if (items) {
          let hasFile = false;
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
              hasFile = true;
              break;
            }
          }
          if (!hasFile) return; // Keep regular text paste behavior in text components
        }
      }

      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            processImageFile(file);
          }
        }
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handleGlobalPaste);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handleGlobalPaste);
    };
  }, []);
  const [assets, setAssets] = useState<CertificateAssets>(() => {
    const saved = localStorage.getItem('certificate_assets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse certificate_assets:", e);
      }
    }
    return {
      signature: null,
      logos: {
        logo1: { src: DEFAULT_LOGOS.logo1, x: 0, y: 0, width: 96, height: 96 },
        logo2: { src: DEFAULT_LOGOS.logo2, x: 0, y: 0, width: 96, height: 96 },
        logo3: { src: DEFAULT_LOGOS.logo3, x: 0, y: 0, width: 96, height: 96 },
        logo4: { src: DEFAULT_LOGOS.logo4, x: 0, y: 0, width: 144, height: 96 },
      }
    };
  });

  const fileInputRefs = {
    signature: useRef<HTMLInputElement>(null),
    logo1: useRef<HTMLInputElement>(null),
    logo2: useRef<HTMLInputElement>(null),
    logo3: useRef<HTMLInputElement>(null),
    logo4: useRef<HTMLInputElement>(null),
  };

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
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <FileText className="text-white w-6 h-6" />
              </div>
              <h1 className="text-lg font-semibold tracking-tight text-white whitespace-nowrap">Indigency Certificate Generator</h1>
            </div>
            
            {/* Main Tabs Selection - PROFESSIONAL & OPTIMIZED */}
            <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-lg shrink-0">
              <button
                onClick={() => setCurrentView('generator')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  currentView === 'generator'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Certificate Generator
              </button>
              <button
                onClick={() => setCurrentView('list')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 relative cursor-pointer ${
                  currentView === 'list'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Issued COE List
                {issuedList.length > 0 && (
                  <span className="bg-zinc-800 text-blue-400 border border-blue-500/30 font-mono text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-1">
                    {issuedList.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            {currentView === 'generator' ? (
              <>
                <button 
                  onClick={() => setIsEditingLogos(!isEditingLogos)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer ${
                    isEditingLogos ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <Settings className={`w-3.5 h-3.5 ${isEditingLogos ? 'animate-spin' : ''}`} />
                  {isEditingLogos ? 'Finish Editing' : 'Edit Logos'}
                </button>
                <button 
                  onClick={handleReset}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:bg-zinc-700 hover:text-white rounded-md transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset
                </button>
                <button 
                  onClick={() => setIsHelpOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 hover:bg-zinc-700 hover:text-white rounded-md transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Help
                </button>
                <button 
                  onClick={() => handlePrint()}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20 active:scale-95 active:bg-blue-800 cursor-pointer"
                  title="Open browser print dialog (Ctrl+P)"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
              </>
            ) : (
              <button 
                onClick={() => setCurrentView('generator')}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-md hover:bg-blue-700 transition-all shadow-md cursor-pointer"
              >
                + Generate New COE
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {currentView === 'generator' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <section className="lg:col-span-4 space-y-6 sidebar edit-details-panel">
          {/* Smart AI Patient Data Importer */}
          <div className="bg-[#1e1e1e] p-6 rounded-xl shadow-sm border border-zinc-700 space-y-4">
            {/* Tab Navigation */}
            <div className="flex border-b border-zinc-700 pb-2 mb-2">
              <button
                onClick={() => setActiveTab('text')}
                className={`flex-1 pb-1 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 text-center pb-2 ${
                  activeTab === 'text'
                    ? 'text-blue-500 border-blue-500'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                Text Paste
              </button>
              <button
                onClick={() => setActiveTab('image')}
                className={`flex-1 pb-1 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 text-center pb-2 flex items-center justify-center gap-1.5 ${
                  activeTab === 'image'
                    ? 'text-blue-500 border-blue-500'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Scan Image (AI)
              </button>
            </div>

            {activeTab === 'text' ? (
              <div className="space-y-4">
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste clinical text, doctor notes, or referral slips here..."
                  className="w-full h-34 p-3 text-sm border border-zinc-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none bg-zinc-900 text-zinc-100 placeholder:text-zinc-600"
                />
                <button
                  onClick={handlePaste}
                  disabled={isParsing || !pastedText.trim()}
                  className="w-full py-2.5 bg-blue-600 font-bold hover:bg-blue-500 text-white text-sm rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isParsing ? <Loader className="w-4 h-4 animate-spin" /> : 'Auto-Fill Details'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {pastedImage ? (
                  <div className="space-y-3">
                    <div className="relative aspect-video rounded-lg border border-zinc-700 overflow-hidden bg-zinc-950 flex items-center justify-center group">
                      <img src={pastedImage} alt="Uploaded Document" className="max-h-full max-w-full object-contain" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={() => {
                            setPastedImage(null);
                            setImageMimeType(null);
                            setImageName('');
                            setExtractError(null);
                            setExtractSuccess(false);
                          }}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold tracking-wide transition-colors"
                        >
                          Clear Image
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-zinc-400 flex items-center justify-between px-1">
                      <span className="truncate max-w-[180px]" title={imageName}>{imageName}</span>
                      <span className="text-[10px] bg-zinc-850 text-zinc-300 px-1.5 py-0.5 rounded font-mono">
                        {imageMimeType ? imageMimeType.split('/')[1].toUpperCase() : 'IMG'}
                      </span>
                    </div>

                    {isProcessingImage && (
                      <div className="bg-blue-950/20 text-blue-400 border border-blue-900/40 p-3 rounded-lg flex items-center gap-2.5 text-xs animate-pulse">
                        <Loader className="w-4 h-4 animate-spin text-blue-500 shrink-0" />
                        <span>AI indexing & parsing image contents...</span>
                      </div>
                    )}

                    {extractError && (
                      <div className="bg-red-950/30 text-red-400 border border-red-900/40 p-3 rounded-lg text-xs leading-relaxed font-medium">
                        <p className="font-bold text-red-500 mb-0.5">Extraction Error:</p>
                        <p className="text-zinc-300 font-normal">{extractError}</p>
                      </div>
                    )}

                    {extractSuccess && (
                      <div className="bg-emerald-950/20 text-emerald-400 border border-emerald-900/30 p-3 rounded-lg text-xs flex items-center gap-2 font-medium">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                        <span>Filled form details successfully!</span>
                      </div>
                    )}

                    {!isProcessingImage && (
                      <button
                        onClick={() => handleImageAnalysis(pastedImage, imageMimeType || 'image/png')}
                        className="w-full py-2 bg-zinc-800 text-zinc-200 text-xs font-medium rounded hover:bg-zinc-700 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Re-Analyze Image
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file && file.type.startsWith('image/')) {
                        processImageFile(file);
                      }
                    }}
                    onClick={() => imageInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-700 hover:border-blue-500 hover:bg-blue-500/5 rounded-xl p-6 text-center cursor-pointer transition-all space-y-3 group"
                  >
                    <div className="w-11 h-11 bg-zinc-800 rounded-full flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                      <ImageIcon className="w-5 h-5 text-zinc-500 group-hover:text-blue-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-zinc-300 text-xs font-semibold">Click to browse document</p>
                      <p className="text-zinc-500 text-[10px]">or drag file here or paste image directly via <kbd className="px-1 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px]">Ctrl+V</kbd></p>
                    </div>
                    <p className="text-[10px] text-zinc-500/80 leading-snug">
                      Analyze slips, referral orders, certificates, prescriptions or case details instantly.
                    </p>
                    <input
                      type="file"
                      ref={imageInputRef}
                      onChange={handleImageSelect}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                )}
              </div>
            )}
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
                      <option value="Financially Capacicated (W/ CHS)">Financially Capacicated (W/ CHS)</option>
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
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Title & Description */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-500" />
                  Issued Certificates Registry
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  View and manage all printed Certificates of Eligibility. In compliance with data privacy standards, patient names are securely masked on-screen.
                </p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg text-xs font-mono text-zinc-400">
                Total Logs: <span className="text-blue-400 font-bold font-sans text-sm">{filteredList.length}</span> of {issuedList.length}
              </div>
            </div>

            {/* Filter Control Panel */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-808 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Search Bar */}
              <div className="md:col-span-5 space-y-1.5">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-zinc-400" />
                  Search Patients
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by first name, classification, or assistance..."
                    className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-550 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                  />
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                </div>
              </div>

              {/* Date Start */}
              <div className="md:col-span-3 space-y-1.5">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-405" />
                  Filter Start Date
                </label>
                <input
                  type="date"
                  value={startDateInput}
                  onChange={(e) => setStartDateInput(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
                />
              </div>

              {/* Date End */}
              <div className="md:col-span-3 space-y-1.5">
                <label className="block text-[10px] font-bold text-zinc-405 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-zinc-405" />
                  Filter End Date
                </label>
                <input
                  type="date"
                  value={endDateInput}
                  onChange={(e) => setEndDateInput(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-white px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 [color-scheme:dark]"
                />
              </div>

              {/* Action Buttons */}
              <div className="md:col-span-1 flex gap-2">
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 md:w-auto py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 shadow cursor-pointer h-9"
                  title="Apply Filters"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span className="md:hidden">Filter</span>
                </button>
                <button
                  onClick={handleClearFilters}
                  className="flex-1 md:w-auto py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1 border border-zinc-700 cursor-pointer h-9"
                  title="Clear Filters"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="md:hidden">Clear</span>
                </button>
              </div>
            </div>

            {/* List Table / Registry */}
            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/30">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/40">
                      <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Date Logged</th>
                      <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Patient Name (Masked for Privacy)</th>
                      <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Classification</th>
                      <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Assistance Type</th>
                      <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Certificate Date</th>
                      <th className="p-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-sm">
                    {filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-zinc-500">
                          <History className="w-8 h-8 text-zinc-705 mx-auto mb-3 animate-pulse" />
                          <p className="font-semibold text-zinc-400">No matching registry records found</p>
                          <p className="text-xs text-zinc-600 mt-1">Try refining search query, adjusting date filters, or printing a new certificate.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((coe) => (
                        <tr key={coe.id} className="hover:bg-zinc-900/20 transition-colors">
                          <td className="p-4 font-mono text-xs text-zinc-400 whitespace-nowrap">
                            {new Date(coe.dateIssued).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-white tracking-wide">{getFirstName(coe.data.patientName)}</span>
                              <span className="text-[11px] text-zinc-505 font-mono mt-0.5" title="Full patient name masked for privacy and security">{getMaskedFullName(coe.data.patientName)}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700 whitespace-nowrap border-zinc-700/60">
                              {coe.data.classification || 'Indigent'}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-zinc-350">
                            <div className="max-w-[180px] truncate" title={coe.data.assistanceType}>
                              {coe.data.assistanceType || '--'}
                            </div>
                          </td>
                          <td className="p-4 text-xs text-zinc-400 whitespace-nowrap">
                            {coe.data.issuanceDate}
                          </td>
                          <td className="p-4 text-right pr-6 whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handlePrint(coe)}
                                className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded transition-all cursor-pointer flex items-center justify-center shadow"
                                title="Reprint certificate (recovering complete name details)"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCOE(coe.id)}
                                className="p-1.5 bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 rounded border border-zinc-800 hover:border-red-900/40 transition-all cursor-pointer flex items-center justify-center shadow"
                                title="Delete Log Entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-neutral-400 text-xs">
        <p>© 2026 Certificate of Eligibility Generator</p>
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
            data={printTarget ? printTarget.data : data} 
            assets={printTarget ? printTarget.assets : assets} 
            isPrintVersion={true}
          />
        </div>
      </div>
    </div>
  );
}
