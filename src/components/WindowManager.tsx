import React, { useState, useEffect, useRef } from 'react';
import { MarkdownWindow } from '../types';
import { Dropzone } from './Dropzone';
import { MarkdownViewer } from './MarkdownViewer';
import { X, Palette } from 'lucide-react';
import './AppLayout.css';

const THEMES = [
  { id: 'classic-dark', name: '幻彩深色 (默认)', mode: 'dark' },
  { id: 'classic', name: '幻彩浅色', mode: 'light' },
  { id: 'light', name: '极简亮白', mode: 'light' },
  { id: 'green', name: '清新淡绿', mode: 'light' },
  { id: 'purple', name: '优雅淡紫', mode: 'light' },
  { id: 'dark', name: '极客深色', mode: 'dark' },
];

import { get, set } from 'idb-keyval';

export const WindowManager: React.FC = () => {
  const [windows, setWindows] = useState<MarkdownWindow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initStorage = async () => {
      try {
        const savedWindows = await get('mdpre_windows');
        if (savedWindows && Array.isArray(savedWindows)) {
          setWindows(savedWindows);
        }
        const savedActiveId = localStorage.getItem('mdpre_active_id');
        if (savedActiveId) {
          setActiveId(savedActiveId);
        }
      } catch (e) {
        console.error('Failed to init from IDB', e);
      } finally {
        setIsInitialized(true);
      }
    };
    initStorage();
  }, []);

  // Theme support
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('mdpre_theme') || 'classic-dark';
  });
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);

  // Context Menu support
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, tabId: string } | null>(null);

  // Persist State to LocalStorage and IDB
  useEffect(() => {
    if (!isInitialized) return;
    try {
      set('mdpre_windows', windows).catch(e => console.error('Failed to save to IDB', e));
      if (activeId) {
        localStorage.setItem('mdpre_active_id', activeId);
      } else {
        localStorage.removeItem('mdpre_active_id');
      }
    } catch (e) {
      console.warn('Failed to persist window state', e);
    }
  }, [windows, activeId, isInitialized]);

  useEffect(() => {
    const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];
    document.body.dataset.theme = theme;
    document.body.dataset.mode = currentTheme.mode;
    localStorage.setItem('mdpre_theme', theme);
  }, [theme]);

  // Click outside listener for menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setShowThemeMenu(false);
      }
      setContextMenu(null);
    };

    window.addEventListener('click', handleClickOutside);
    window.addEventListener('blur', () => setContextMenu(null));
    
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('blur', () => setContextMenu(null));
    };
  }, []);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const formatTitle = (title: string) => {
    return title.length > 20 ? title.substring(0, 20) + '...' : title;
  };

  const addWindow = (title: string, handle: any) => {
    const newId = generateId();
    const newWindow: MarkdownWindow = {
      id: newId,
      title,
      handle,
    };

    setWindows(prev => [...prev, newWindow]);
    setActiveId(newId);
  };

  const removeWindow = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setWindows(prev => {
      const filtered = prev.filter(w => w.id !== id);
      if (id === activeId) {
        if (filtered.length > 0) {
          setActiveId(filtered[filtered.length - 1].id);
        } else {
          setActiveId(null);
        }
      }
      return filtered;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      tabId,
    });
  };

  const closeOthers = (id: string) => {
    setWindows(prev => prev.filter(w => w.id === id));
    setActiveId(id);
    setContextMenu(null);
  };

  const closeAll = () => {
    setWindows([]);
    setActiveId(null);
    setContextMenu(null);
  };

  const activeWindow = windows.find(w => w.id === activeId);

  return (
    <div className="app-container">
      <Dropzone onFileDrop={addWindow} />
      
      {windows.length > 0 && (
        <nav className="top-nav">
          <div className="theme-selector-container" ref={themeRef}>
            <button 
              className="theme-btn" 
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              title="切换主题颜色"
            >
              <Palette size={20} strokeWidth={2} />
            </button>
            {showThemeMenu && (
              <div className="theme-dropdown">
                {THEMES.map(t => (
                  <button 
                    key={t.id} 
                    className="theme-dropdown-item"
                    style={{ fontWeight: t.id === theme ? 600 : 400 }}
                    onClick={() => {
                      setTheme(t.id);
                      setShowThemeMenu(false);
                    }}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="nav-tabs">
            {windows.map(win => (
              <div 
                key={win.id} 
                className={`nav-tab ${win.id === activeId ? 'active' : ''}`}
                onClick={() => setActiveId(win.id)}
                onContextMenu={(e) => handleContextMenu(e, win.id)}
                title={win.title}
              >
                <span className="tab-title">{formatTitle(win.title)}</span>
                <button 
                  className="tab-close-btn" 
                  onClick={(e) => removeWindow(win.id, e)}
                  title="关闭"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>
        </nav>
      )}

      {/* Context Menu Modal */}
      {contextMenu && (
        <div 
          className="context-menu" 
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="context-menu-item" onClick={() => closeOthers(contextMenu.tabId)}>关闭其他全部</button>
          <button className="context-menu-item" onClick={closeAll}>关闭全部</button>
        </div>
      )}
      
      <main className="main-content">
        {activeWindow ? (
          <div className="fullscreen-viewer animate-fade-in">
            <MarkdownViewer handle={activeWindow.handle} />
          </div>
        ) : (
          <div className="empty-state">
            <h1 className="empty-title">Markdown Preview</h1>
            <p className="empty-subtitle">拖拽 Markdown 文件至此以开始全屏预览</p>
          </div>
        )}
      </main>
    </div>
  );
};
