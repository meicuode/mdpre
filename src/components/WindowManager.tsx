import React, { useState } from 'react';
import { MarkdownWindow } from '../types';
import { Window } from './Window';
import { Dropzone } from './Dropzone';

export const WindowManager: React.FC = () => {
  const [windows, setWindows] = useState<MarkdownWindow[]>([]);
  const [zIndexCounter, setZIndexCounter] = useState(10);

  const spawnOffset = 30; // 偏移量，防止新开窗口重叠

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const bringToFront = (id: string) => {
    setWindows(prev => {
      const highestZIndex = Math.max(...prev.map(w => w.zIndex), zIndexCounter);
      setZIndexCounter(highestZIndex + 1);

      return prev.map(w => w.id === id ? { ...w, zIndex: highestZIndex + 1 } : w);
    });
  };

  const addWindow = (title: string, content: string) => {
    const existingCount = windows.length;
    const x = Math.max(10, window.innerWidth / 2 - 400 + (existingCount * spawnOffset) % 200);
    const y = Math.max(10, window.innerHeight / 2 - 300 + (existingCount * spawnOffset) % 200);

    const newWindow: MarkdownWindow = {
      id: generateId(),
      title,
      content,
      x,
      y,
      width: Math.min(800, window.innerWidth - 40),
      height: Math.min(600, window.innerHeight - 40),
      zIndex: zIndexCounter + 1,
      isMaximized: false,
      isMinimized: false,
    };

    setZIndexCounter(prev => prev + 1);
    setWindows(prev => [...prev, newWindow]);
  };

  const removeWindow = (id: string) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  };

  return (
    <>
      <Dropzone onFileDrop={addWindow} />
      
      {windows.map(win => (
        <Window 
          key={win.id}
          window={win}
          onClose={removeWindow}
          onFocus={bringToFront}
        />
      ))}
      
      {windows.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          color: 'rgba(128, 128, 128, 0.7)',
          pointerEvents: 'none'
        }}>
          <h1 style={{ fontFamily: 'Inter', fontWeight: 700, margin: 0 }}>Markdown Preview</h1>
          <p style={{ fontFamily: 'Inter', fontSize: '18px' }}>拖拽 Markdown 文件至此以开始阅览</p>
        </div>
      )}
    </>
  );
};
