import React, { useEffect, useState, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import mermaid from 'mermaid';
import 'highlight.js/styles/atom-one-dark.css';
import './MarkdownViewer.css';

const MERMAID_LIGHT_THEME = {
  theme: 'base' as const,
  themeVariables: {
    primaryTextColor: '#1a1a2e',
    secondaryTextColor: '#333',
    lineColor: '#4a5568',
    textColor: '#1a1a2e',
    // Sequence diagram
    signalColor: '#2d3748',
    signalTextColor: '#1a1a2e',
    actorTextColor: '#ffffff',
    actorBkg: '#3d5a80',
    actorBorder: '#2c4a6e',
    actorLineColor: '#4a5568',
    noteBkgColor: '#edf2f7',
    noteTextColor: '#1a1a2e',
    noteBorderColor: '#a0aec0',
    activationBkgColor: '#e2e8f0',
    activationBorderColor: '#a0aec0',
    sequenceNumberColor: '#ffffff',
    // Node/flowchart
    primaryColor: '#dbeafe',
    primaryBorderColor: '#3b82f6',
    secondaryColor: '#e0e7ff',
    secondaryBorderColor: '#6366f1',
    tertiaryColor: '#f0fdf4',
    // Background
    background: '#ffffff',
    mainBkg: '#dbeafe',
    nodeBkg: '#dbeafe',
    nodeTextColor: '#1a1a2e',
    clusterBkg: '#f1f5f9',
    titleColor: '#1a1a2e',
    edgeLabelBackground: '#ffffff',
    labelTextColor: '#1a1a2e',
    labelBoxBkgColor: '#ffffff',
    labelBoxBorderColor: '#a0aec0',
  },
};

const MERMAID_DARK_THEME = {
  theme: 'base' as const,
  themeVariables: {
    primaryTextColor: '#e2e8f0',
    secondaryTextColor: '#cbd5e1',
    lineColor: '#94a3b8',
    textColor: '#e2e8f0',
    // Sequence diagram
    signalColor: '#94a3b8',
    signalTextColor: '#e2e8f0',
    actorTextColor: '#ffffff',
    actorBkg: '#334155',
    actorBorder: '#475569',
    actorLineColor: '#64748b',
    noteBkgColor: '#334155',
    noteTextColor: '#e2e8f0',
    noteBorderColor: '#475569',
    activationBkgColor: '#1e293b',
    activationBorderColor: '#475569',
    sequenceNumberColor: '#ffffff',
    // Node/flowchart
    primaryColor: '#1e3a5f',
    primaryBorderColor: '#3b82f6',
    secondaryColor: '#1e293b',
    secondaryBorderColor: '#6366f1',
    tertiaryColor: '#1a2332',
    // Background
    background: '#0f172a',
    mainBkg: '#1e3a5f',
    nodeBkg: '#1e3a5f',
    nodeTextColor: '#e2e8f0',
    clusterBkg: '#1e293b',
    titleColor: '#f1f5f9',
    edgeLabelBackground: '#1e293b',
    labelTextColor: '#e2e8f0',
    labelBoxBkgColor: '#1e293b',
    labelBoxBorderColor: '#475569',
  },
};

interface MarkdownViewerProps {
  handle: any;
  themeMode: 'light' | 'dark';
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ handle, themeMode }) => {
  const [html, setHtml] = useState('');
  const [needsPermission, setNeedsPermission] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<any>(handle);

  handleRef.current = handle;

  // Configure marked renderer (once)
  useEffect(() => {
    const renderer = new marked.Renderer();

    renderer.code = function (code: any) {
      const text = typeof code === 'string' ? code : code?.text ?? '';
      const lang = typeof code === 'string' ? '' : code?.lang ?? '';

      if (lang === 'mermaid') {
        return `<div class="mermaid-block">${text}</div>`;
      }
      let highlighted = text;
      if (lang && hljs.getLanguage(lang)) {
        try {
          highlighted = hljs.highlight(text, { language: lang }).value;
        } catch (_) { /* ignore */ }
      }
      return `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
    };

    marked.setOptions({ renderer, breaks: true, gfm: true } as any);
  }, []);

  // Load file content from disk
  const loadContent = async () => {
    const h = handleRef.current;
    if (!h) return;
    try {
      const options = { mode: 'read' };
      if ((await h.queryPermission(options)) !== 'granted') {
        setNeedsPermission(true);
        return;
      }
      const file = await h.getFile();
      const content = await file.text();
      const rawHtml = await marked.parse(content);
      const cleanHtml = DOMPurify.sanitize(rawHtml, {
        ADD_TAGS: ['div'],
        ADD_ATTR: ['class'],
      });
      setHtml(cleanHtml);
      setNeedsPermission(false);
    } catch (e) {
      console.error(e);
      setNeedsPermission(true);
    }
  };

  // Initial load
  useEffect(() => {
    loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);

  const requestPermission = async () => {
    try {
      const result = await handleRef.current.requestPermission({ mode: 'read' });
      if (result === 'granted') {
        loadContent();
      }
    } catch (e) {
      console.error('Permission request failed', e);
    }
  };

  // Render mermaid diagrams — re-initialize with correct theme
  useEffect(() => {
    if (!html || !containerRef.current) return;

    const themeConfig = themeMode === 'dark' ? MERMAID_DARK_THEME : MERMAID_LIGHT_THEME;
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, sans-serif',
      ...themeConfig,
    });

    const mermaidBlocks = containerRef.current.querySelectorAll('.mermaid-block:not(.mermaid-rendered)');
    if (mermaidBlocks.length > 0) {
      let idCounter = 0;
      mermaidBlocks.forEach(async (block) => {
        const graphDef = block.textContent || '';
        const id = `mermaid-svg-${Date.now()}-${idCounter++}`;
        try {
          const { svg } = await mermaid.render(id, graphDef);
          block.innerHTML = svg;
          block.classList.add('mermaid-rendered');
        } catch (e) {
          console.error('Mermaid render error:', e);
          block.innerHTML = `<pre class="mermaid-error"><code>${graphDef}</code></pre>`;
          block.classList.add('mermaid-rendered');
        }
      });
    }
  }, [html, themeMode]);

  // Copy button injection
  useEffect(() => {
    if (!html || !containerRef.current) return;
    const preElements = containerRef.current.querySelectorAll('pre');

    preElements.forEach((pre: HTMLElement) => {
      if (pre.parentElement?.classList.contains('code-wrapper')) return;
      if (pre.classList.contains('mermaid-error')) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'code-wrapper';
      pre.parentNode?.insertBefore(wrapper, pre);
      wrapper.appendChild(pre);

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
      wrapper.appendChild(btn);
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
