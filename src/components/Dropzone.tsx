import React, { useEffect, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import './Dropzone.css';

interface DropzoneProps {
  onFileDrop: (title: string, content: string) => void;
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

      if (e.dataTransfer?.files) {
        Array.from(e.dataTransfer.files).forEach(file => {
          if (file.name.endsWith('.md') || file.type.includes('markdown') || file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (event) => {
              const content = event.target?.result as string;
              if (typeof content === 'string') {
                onFileDrop(file.name, content);
              }
            };
            reader.readAsText(file);
          } else {
            alert('仅支持 Markdown (.md) 格式的文件');
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
