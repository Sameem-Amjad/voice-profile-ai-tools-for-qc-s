import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Music, CheckCircle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

const ACCEPTED_FORMATS = {
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/x-m4a': ['.m4a'],
  'audio/mp4': ['.m4a'],
  'audio/ogg': ['.ogg'],
  'audio/flac': ['.flac'],
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const AudioUploader = ({ onFileSelect, uploading, progress, fileMeta, error }) => {
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const reason = rejectedFiles[0].errors[0]?.message || 'Invalid file';
      console.error('File rejected:', reason);
      return;
    }
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FORMATS,
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB
    disabled: uploading || !!fileMeta,
  });

  // Show success state
  if (fileMeta) {
    return (
      <div className="border-2 border-green-300 bg-green-50 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="text-green-500 shrink-0" size={24} />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-green-800 truncate">{fileMeta.name}</p>
            <p className="text-sm text-green-600">
              {formatFileSize(fileMeta.size)}
              {fileMeta.duration && ` · ${Math.round(fileMeta.duration)}s`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
          isDragActive
            ? 'border-blue-400 bg-blue-50 scale-[1.02]'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50',
          uploading && 'opacity-60 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />

        <Music
          className={clsx(
            'mx-auto mb-3 transition-colors',
            isDragActive ? 'text-blue-500' : 'text-gray-400'
          )}
          size={36}
        />

        {uploading ? (
          <div className="space-y-2">
            <p className="text-gray-600 font-medium">Uploading...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">{progress}%</p>
          </div>
        ) : (
          <>
            <p className="text-gray-700 font-medium mb-1">
              {isDragActive ? 'Drop your audio here' : 'Drag & drop audio file'}
            </p>
            <p className="text-sm text-gray-500 mb-3">
              or <span className="text-blue-600 font-medium">browse files</span>
            </p>
            <p className="text-xs text-gray-400">
              MP3, WAV, M4A, OGG, FLAC · Max 500MB
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle size={16} className="shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};
