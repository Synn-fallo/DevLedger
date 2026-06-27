import { useState } from 'react';
import { FileText, Image, FileArchive, Download, Trash2, Plus } from 'lucide-react';
import { PlanFilesUploadModal } from './PlanFilesUploadModal';

interface FileAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  path: string;
  created_at: string;
}

interface PlanFilesProps {
  projectId: string;
  files: FileAttachment[];
  isOwner: boolean;
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (fileId: string, path: string) => Promise<void>;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return <Image className="w-4 h-4" />;
  if (type === 'application/pdf') return <FileText className="w-4 h-4" />;
  if (type === 'application/zip' || type === 'application/x-zip-compressed') return <FileArchive className="w-4 h-4" />;
  return <FileText className="w-4 h-4" />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function PlanFiles({ projectId, files, isOwner, onUpload, onDelete }: PlanFilesProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleDelete = async (file: FileAttachment) => {
    if (confirm(`Supprimer "${file.name}" ?`)) {
      await onDelete(file.id, file.path);
    }
  };

  return (
    <div className="space-y-3">
      {isOwner && (
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter des fichiers
        </button>
      )}

      {files.length === 0 ? (
        <p className="text-center text-gray-500 py-4">Aucun fichier joint.</p>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                {getFileIcon(file.type)}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-gray-500 hover:text-blue-600 rounded"
                  title="Télécharger"
                >
                  <Download className="w-4 h-4" />
                </a>
                {isOwner && (
                  <button
                    onClick={() => handleDelete(file)}
                    className="p-1 text-gray-500 hover:text-red-600 rounded"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showUploadModal && (
        <PlanFilesUploadModal
          projectId={projectId}
          onClose={() => setShowUploadModal(false)}
          onUpload={onUpload}
        />
      )}
    </div>
  );
}