import React, { useState } from 'react';
import { FileText, X, Loader2 } from 'lucide-react';

const PLACEHOLDER = `Paste your script here, or upload a file (.txt, .docx, .pdf, .rtf, .fountain)...

Example:
"Hello and welcome to SoundProof. This tool helps voiceover artists
verify their recordings against the original script with word-level accuracy."`;

// Strip RTF control codes and return plain text
function extractRtf(raw) {
  return raw
    .replace(/\\[a-z]+[-]?\d*[ ]?/gi, '')
    .replace(/[{}\\]/g, '')
    .replace(/\r\n|\r|\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Strip Fountain screenplay markup and return plain text
function extractFountain(raw) {
  return raw
    .replace(/^(INT\.|EXT\.|INT\/EXT\.|I\/E\.).*$/gim, '')  // scene headings
    .replace(/^@.*$/gm, '')                                   // forced character cues
    .replace(/^\s*>.+<\s*$/gm, '')                            // centered text markers
    .replace(/^={3,}.*$/gm, '')                               // page breaks
    .replace(/\[\[.*?\]\]/gs, '')                             // notes
    .replace(/\/\*.*?\*\//gs, '')                             // block comments
    .replace(/^\s*[A-Z][A-Z\s]+\s*(\(.*?\))?\s*$/gm, '')    // character names
    .replace(/\*\*(.+?)\*\*/g, '$1')                          // bold
    .replace(/\*(.+?)\*/g, '$1')                              // italic
    .replace(/_(.+?)_/g, '$1')                                // underline
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function extractDocx(file) {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

async function extractPdf(file) {
  const pdfjsLib = await import('pdfjs-dist');
  // Point worker at the bundled worker file served from node_modules
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(' '));
  }
  return pages.join('\n\n').trim();
}

const SUPPORTED_EXTENSIONS = '.txt,.md,.rtf,.docx,.pdf,.fountain';
const EXTENSION_LABEL = 'TXT, DOCX, PDF, RTF, Fountain';

export const ScriptInput = ({ value, onChange, disabled }) => {
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState(null);

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    const name = file.name.toLowerCase();
    setExtracting(true);
    setExtractError(null);

    try {
      let text = '';

      if (name.endsWith('.docx')) {
        text = await extractDocx(file);
      } else if (name.endsWith('.pdf')) {
        text = await extractPdf(file);
      } else if (name.endsWith('.rtf')) {
        const raw = await file.text();
        text = extractRtf(raw);
      } else if (name.endsWith('.fountain')) {
        const raw = await file.text();
        text = extractFountain(raw);
      } else {
        // .txt, .md and anything else — read as plain text
        text = await file.text();
      }

      if (!text) {
        setExtractError('No text could be extracted from this file. Try copy-pasting the script instead.');
        return;
      }
      onChange(text);
    } catch (err) {
      console.error('Script extraction failed:', err);
      setExtractError('Could not read this file. Try copy-pasting the script instead.');
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Script / Expected Text
        </label>
        <div className="flex items-center gap-2">
          {wordCount > 0 && (
            <span className="text-xs text-gray-500">{wordCount} words</span>
          )}
          <label className={disabled || extracting ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}>
            <input
              type="file"
              accept={SUPPORTED_EXTENSIONS}
              className="hidden"
              onChange={handleFileUpload}
              disabled={disabled || extracting}
            />
            <span className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
              {extracting ? (
                <><Loader2 size={12} className="animate-spin" /> Extracting…</>
              ) : (
                <><FileText size={12} /> Upload file</>
              )}
            </span>
          </label>
        </div>
      </div>

      {extractError && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {extractError}
        </p>
      )}

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={PLACEHOLDER}
          disabled={disabled || extracting}
          rows={8}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     disabled:bg-gray-50 disabled:text-gray-500
                     resize-none font-mono leading-relaxed"
        />
        {value && !disabled && (
          <button
            onClick={() => onChange('')}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            aria-label="Clear script"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Supported: {EXTENSION_LABEL} · or paste directly above
      </p>
    </div>
  );
};
