import React, { useEffect, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import './Dropzone.css';

interface DropzoneProps {
  onFileDrop: (title: string, handle: any) => void;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFileDrop }) => {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    let dropzoneTarget: EventTarget | null = null;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dropzoneTarget = e.target;
      setIsDragging(true);
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'copy';
    };

    const handleDragLeave = (e: DragEvent) => {
      if (e.target === dropzoneTarget) {
        setIsDragging(false);
      }
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer?.items) {
        // Use DataTransferItemList interface to access the file(s)
        Array.from(e.dataTransfer.items).forEach(async (item) => {
          // If dropped items aren't files, reject them
          if (item.kind === 'file') {
            try {
              // using @ts-ignore because getAsFileSystemHandle is relatively new and might not be in standard definitions
              // @ts-ignore
              const handle = await item.getAsFileSystemHandle();
              if (handle && handle.kind === 'file') {
                const file = await handle.getFile();
                if (file.name.endsWith('.md') || file.type.includes('markdown') || file.type === 'text/plain') {
                  onFileDrop(file.name, handle);
                } else {
                  alert('仅支持 Markdown (.md) 格式的文件');
                }
              }
            } catch (error) {
              console.error('Failed to get file handle', error);
              // Fallback if getAsFileSystemHandle is unsupported
              const file = item.getAsFile();
              if (file && (file.name.endsWith('.md') || file.type.includes('markdown') || file.type === 'text/plain')) {
                alert('您的浏览器不支持直接读取文件句柄，请使用基于 Chrome/Edge 等现代内核的浏览器。');
              }
            }
          }
        });
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, [onFileDrop]);

  return (
    <div className={`dropzone-overlay ${isDragging ? 'active' : ''}`}>
      <div className="dropzone-content">
        <div className="dropzone-icon">
          <UploadCloud size={40} strokeWidth={2} />
        </div>
        <div className="dropzone-text">向这里拖拽 Markdown 文件</div>
        <div className="dropzone-subtext">放手即刻打开预览窗口</div>
      </div>
    </div>
  );
};
