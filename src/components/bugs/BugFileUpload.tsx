import { useState, useRef } from 'react';
import { Upload, X, FileText, Image, File } from 'lucide-react';

interface BugFileUploadProps {
  onFilesSelected: (files: File[]) => void;
  existingAttachments?: Array<{ name: string; url: string; path: string }>;
  onRemoveExisting?: (path: string) => void;
  maxFiles?: number;
  maxSize?: number; // en MB
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
  if (type === 'application/pdf') return <FileText className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
};

export function BugFileUpload({
  onFilesSelected,
  existingAttachments = [],
  onRemoveExisting,
  maxFiles = 5,
  maxSize = 10
}: BugFileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: FileList): File[] => {
    const validFiles: File[] = [];
    const newErrors: string[] = [];
    const totalFiles = selectedFiles.length + files.length + existingAttachments.length;

    if (totalFiles > maxFiles) {
      newErrors.push(`Maximum ${maxFiles} fichiers autorisés`);
      return [];
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > maxSize * 1024 * 1024) {
        newErrors.push(`${file.name} dépasse ${maxSize}MB`);
      } else {
        validFiles.push(file);
      }
    }

    setErrors(newErrors);
    return validFiles;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const validFiles = validateFiles(e.target.files);
      if (validFiles.length > 0) {
        const newFiles = [...selectedFiles, ...validFiles];
        setSelectedFiles(newFiles);
        onFilesSelected(newFiles);
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeSelectedFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Pièces jointes
        </label>
        <span className="text-xs text-gray-500">
          {selectedFiles.length + existingAttachments.length} / {maxFiles} fichiers
        </span>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
      >
        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Cliquez pour ajouter des fichiers
        </p>
        <p className="text-xs text-gray-500 mt-1">
          PDF, images, texte (max {maxSize}MB)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,application/pdf,text/plain"
        />
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2">
          {errors.map((err, idx) => (
            <p key={idx} className="text-xs text-red-600 dark:text-red-400">{err}</p>
          ))}
        </div>
      )}

      {/* Fichiers existants */}
      {existingAttachments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">Fichiers existants</p>
          {existingAttachments.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                {getFileIcon(file.type || '')}
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                  {file.name}
                </span>
              </div>
              {onRemoveExisting && (
                <button
                  type="button"
                  onClick={() => onRemoveExisting(file.path)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Fichiers sélectionnés à uploader */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">Nouveaux fichiers</p>
          {selectedFiles.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center gap-2">
                {getFileIcon(file.type)}
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                  {file.name}
                </span>
                <span className="text-xs text-gray-400">({formatFileSize(file.size)})</span>
              </div>
              <button
                type="button"
                onClick={() => removeSelectedFile(idx)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}