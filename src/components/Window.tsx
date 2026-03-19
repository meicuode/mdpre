import React, { useState } from 'react';
import Draggable from 'react-draggable';
import { MarkdownWindow } from '../types';
import { MarkdownViewer } from './MarkdownViewer';
import './Window.css';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface WindowProps {
  window: MarkdownWindow;
  onClose: (id: string) => void;
  onFocus: (id: string) => void;
}

export const Window: React.FC<WindowProps> = ({ window: winData, onClose, onFocus }) => {
  const [maximized, setMaximized] = useState(winData.isMaximized);
  
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(winData.id);
  };

  const toggleMaximize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMaximized(!maximized);
  };

  const handleMouseDown = () => {
    onFocus(winData.id);
  };

  return (
    <Draggable
      handle=".window-header"
      bounds="parent"
      disabled={maximized}
      defaultPosition={{ x: winData.x, y: winData.y }}
      onStart={handleMouseDown}
    >
      <div 
        className={`window-container ${maximized ? 'maximized' : ''}`}
        style={{ 
          width: maximized ? '100%' : winData.width,
          height: maximized ? '100%' : winData.height,
          zIndex: winData.zIndex,
          position: maximized ? 'fixed' : 'absolute',
          top: maximized ? 0 : undefined,
          left: maximized ? 0 : undefined,
        }}
        onClick={handleMouseDown}
      >
        <div className="window-header">
          <div className="window-controls">
            <button className="window-btn close" onClick={handleClose}>
              <X size={10} strokeWidth={3} />
            </button>
            <button className="window-btn maximize" onClick={toggleMaximize}>
              {maximized ? <Minimize2 size={10} strokeWidth={3} /> : <Maximize2 size={10} strokeWidth={3} />}
            </button>
          </div>
          <div className="window-title">{winData.title}</div>
          <div style={{ width: 44 }}></div> {/* spacer for centering */}
        </div>
        <div className="window-content">
          <MarkdownViewer content={winData.content} />
        </div>
      </div>
    </Draggable>
  );
};
