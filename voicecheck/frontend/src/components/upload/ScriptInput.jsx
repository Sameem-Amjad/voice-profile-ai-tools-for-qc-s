import React, { useState } from 'react';
import { FileText, X } from 'lucide-react';

const PLACEHOLDER = `Paste your script here...

Example:
"Hello and welcome to VoiceCheck. This tool helps voiceover artists
verify their recordings against the original script with word-level accuracy."`;

export const ScriptInput = ({ value, onChange, disabled }) => {
  const wordCount = value.trim()
    ? value.trim().split(/\s+/).length
    : 0;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => onChange(evt.target.result);
    reader.readAsText(file);

    // Reset input so same file can be re-uploaded
    e.target.value = '';
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
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".txt,.md,.rtf"
              className="hidden"
              onChange={handleFileUpload}
              disabled={disabled}
            />
            <span className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
              <FileText size={12} />
              Upload .txt
            </span>
          </label>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={PLACEHOLDER}
          disabled={disabled}
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
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
