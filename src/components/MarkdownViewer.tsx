import React, { useEffect, useState, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import './MarkdownViewer.css';

interface MarkdownViewerProps {
  handle: any;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ handle }) => {
  const [html, setHtml] = useState('');
  const [needsPermission, setNeedsPermission] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Configure marked with highlight.js integration
    marked.setOptions({
      highlight: function(code: string, lang: string) {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value;
          } catch (__) {}
        }
        return code;
      },
      breaks: true,
      gfm: true,
    } as any);

  }, []);

  const loadContent = async () => {
    if (!handle) return;
    try {
      const options = { mode: 'read' };
      if ((await handle.queryPermission(options)) !== 'granted') {
         setNeedsPermission(true);
         return;
      }
      const file = await handle.getFile();
      const content = await file.text();

      const rawHtml = await marked.parse(content);
      const cleanHtml = DOMPurify.sanitize(rawHtml);
      setHtml(cleanHtml);
      setNeedsPermission(false);
    } catch (e) {
      console.error(e);
      setNeedsPermission(true);
    }
  };

  useEffect(() => {
    loadContent();
  }, [handle]);

  const requestPermission = async () => {
    try {
      const result = await handle.requestPermission({ mode: 'read' });
      if (result === 'granted') {
        loadContent();
      }
    } catch (e) {
      console.error('Permission request failed', e);
    }
  };

  useEffect(() => {
    if (!html || !containerRef.current) return;
    const preElements = containerRef.current.querySelectorAll('pre');
    
    preElements.forEach((pre: HTMLElement) => {
      if (pre.querySelector('.copy-btn')) return;

      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.title = '复制代码';
      const copyIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
      const checkIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#28c940" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      
      btn.innerHTML = copyIcon;
      
      btn.onclick = () => {
        const code = pre.querySelector('code')?.innerText || '';
        navigator.clipboard.writeText(code).then(() => {
          btn.innerHTML = checkIcon;
          setTimeout(() => { btn.innerHTML = copyIcon; }, 2000);
        });
      };
      
      pre.appendChild(btn);
    });
  }, [html]);

  if (needsPermission) {
    return (
      <div style={{ padding: '48px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'inherit' }}>
        <h2 style={{ fontFamily: 'Inter', fontWeight: 600, fontSize: '24px', marginBottom: '16px' }}>需要文件读取权限</h2>
        <p style={{ fontFamily: 'Inter', fontSize: '16px', marginBottom: '24px', opacity: 0.8 }}>我们需要您的授权以读取该文件的最新内容并保持自动刷新同步。</p>
        <button 
          onClick={requestPermission}
          style={{ padding: '10px 24px', background: '#3182ce', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 500, transition: 'background-color 0.2s', boxShadow: '0 4px 12px rgba(49, 130, 206, 0.3)' }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2b6cb0'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3182ce'}
        >
          授予访问权限
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="markdown-body" 
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
};
