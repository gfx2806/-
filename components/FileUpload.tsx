import React, { useRef, useCallback, useState } from 'react';
import { UploadIcon } from './icons';

interface FileUploadProps {
  onFilesSelected: (files: FileList) => void;
  children?: React.ReactNode;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, children }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      onFilesSelected(files);
    }
  }, [onFilesSelected]);

  const triggerClick = () => fileInputRef.current?.click();

  // Unified drag handlers to provide consistent behavior and visual feedback.
  const dragHandlers = {
    onDragOver: (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
    },
    onDragLeave: (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
    },
    onDrop: (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileChange(e.dataTransfer.files);
      }
    },
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/png, image/jpeg"
        multiple
        onChange={(e) => handleFileChange(e.target.files)}
      />
      {children ? (
        // When used as a wrapper (e.g., for a button), make the wrapper the drop zone.
        <div
          onClick={triggerClick}
          className={`w-full sm:w-auto rounded-lg transition-all cursor-pointer ${
            isDragging ? 'ring-4 ring-indigo-400 ring-offset-2' : ''
          }`}
          {...dragHandlers}
        >
          {children}
        </div>
      ) : (
        // The primary, full-featured drop zone for initial upload.
        <div className="text-center">
          <div
            className={`p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50'
            }`}
            onClick={triggerClick}
            {...dragHandlers}
          >
            <div className="flex flex-col items-center justify-center text-slate-500 pointer-events-none">
              <UploadIcon className="h-16 w-16 text-slate-400 mb-4" />
              <p className="text-xl font-semibold text-slate-700">
                Drag & drop your images here
              </p>
              <p className="mt-1">
                or <span className="font-semibold text-indigo-600">click to browse</span>
              </p>
              <p className="text-sm text-slate-400 mt-4">Supports: PNG, JPG</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
