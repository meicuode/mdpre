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
    primaryColor: '#dbeafe',
    primaryBorderColor: '#3b82f6',
    secondaryColor: '#e0e7ff',
    secondaryBorderColor: '#6366f1',
    tertiaryColor: '#f0fdf4',
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
    primaryColor: '#1e3a5f',
    primaryBorderColor: '#3b82f6',
    secondaryColor: '#1e293b',
    secondaryBorderColor: '#6366f1',
    tertiaryColor: '#1a2332',
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

/**
 * Opens a fullscreen modal for a diagram SVG.
 * Uses pure DOM manipulation, mounted on document.body,
 * completely bypassing React and CSS stacking context issues.
 */
function openDiagramFullscreen(svgContent: string) {
  let zoom = 1;
  let panX = 0, panY = 0;
  let isPanning = false;
  let startX = 0, startY = 0;
  let fitZoom = 1; // calculated fit-to-screen zoom

  // Create overlay — directly on body
  const overlay = document.createElement('div');
  overlay.className = 'diagram-modal-overlay';

  // Content area
  const content = document.createElement('div');
  content.className = 'diagram-modal-content';

  // SVG container
  const svgBox = document.createElement('div');
  svgBox.className = 'diagram-modal-svg';
  svgBox.innerHTML = svgContent;

  const applyTransform = () => {
    svgBox.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
  };

  // Toolbar
  const toolbar = document.createElement('div');
  toolbar.className = 'diagram-modal-toolbar';

  const zoomLabel = document.createElement('span');
  zoomLabel.className = 'diagram-zoom-label';
  const updateLabel = () => { zoomLabel.textContent = Math.round(zoom * 100) + '%'; };
  updateLabel();

  const makeBtn = (text: string, title: string, cls?: string) => {
    const b = document.createElement('button');
    b.textContent = text;
    b.title = title;
    if (cls) b.className = cls;
    return b;
  };

  const btnZoomIn = makeBtn('＋', '放大');
  const btnZoomOut = makeBtn('－', '缩小');
  const btnFit = makeBtn('⊡', '适应屏幕');
  const btnReset = makeBtn('↺', '原始大小');
  const btnClose = makeBtn('✕', '关闭', 'diagram-close-btn');

  const cleanup = () => {
    document.body.removeChild(overlay);
    window.removeEventListener('keydown', escHandler);
  };

  const fitToScreen = () => {
    zoom = fitZoom;
    panX = 0;
    panY = 0;
    applyTransform();
    updateLabel();
  };

  btnZoomIn.addEventListener('click', (e) => { e.stopPropagation(); zoom = Math.min(zoom + 0.2, 10); applyTransform(); updateLabel(); });
  btnZoomOut.addEventListener('click', (e) => { e.stopPropagation(); zoom = Math.max(zoom - 0.2, 0.1); applyTransform(); updateLabel(); });
  btnFit.addEventListener('click', (e) => { e.stopPropagation(); fitToScreen(); });
  btnReset.addEventListener('click', (e) => { e.stopPropagation(); zoom = 1; panX = 0; panY = 0; applyTransform(); updateLabel(); });
  btnClose.addEventListener('click', (e) => { e.stopPropagation(); cleanup(); });
  overlay.addEventListener('click', cleanup);
  content.addEventListener('click', (e) => e.stopPropagation());

  // Wheel zoom
  content.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    zoom = Math.min(Math.max(zoom + delta, 0.1), 10);
    applyTransform();
    updateLabel();
  }, { passive: false });

  // Pan
  content.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isPanning = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
    svgBox.style.cursor = 'grabbing';
  });
  content.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    applyTransform();
  });
  const endPan = () => { isPanning = false; svgBox.style.cursor = 'grab'; };
  content.addEventListener('mouseup', endPan);
  content.addEventListener('mouseleave', endPan);

  // ESC to close
  const escHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { cleanup(); }
  };
  window.addEventListener('keydown', escHandler);

  // Assemble
  toolbar.append(btnZoomIn, zoomLabel, btnZoomOut, btnFit, btnReset, btnClose);
  content.appendChild(svgBox);
  overlay.appendChild(content);
  overlay.appendChild(toolbar);
  document.body.appendChild(overlay);

  svgBox.style.cursor = 'grab';

  // Auto-fit: measure SVG natural size and calculate optimal zoom
  requestAnimationFrame(() => {
    const svgEl = svgBox.querySelector('svg');
    if (svgEl) {
      // Get SVG natural dimensions
      const svgW = svgEl.getBoundingClientRect().width;
      const svgH = svgEl.getBoundingClientRect().height;

      if (svgW > 0 && svgH > 0) {
        // Available viewport with padding (90% of viewport, minus toolbar space)
        const viewW = window.innerWidth * 0.9;
        const viewH = window.innerHeight * 0.85;

        const scaleX = viewW / svgW;
        const scaleY = viewH / svgH;
        fitZoom = Math.min(scaleX, scaleY);

        // Clamp: don't zoom smaller than 50% or larger than 500%
        fitZoom = Math.min(Math.max(fitZoom, 0.5), 5);

        // Apply auto-fit
        zoom = fitZoom;
        applyTransform();
        updateLabel();
      }
    }
  });
}

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

  // Render mermaid diagrams
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
        const blockId = `mermaid-svg-${Date.now()}-${idCounter++}`;
        try {
          const { svg } = await mermaid.render(blockId, graphDef);
          block.innerHTML = svg;
          block.classList.add('mermaid-rendered');
          (block as HTMLElement).style.position = 'relative';

          // Add expand button — pure DOM, opens pure-DOM modal on body
          const expandBtn = document.createElement('button');
          expandBtn.className = 'mermaid-expand-btn';
          expandBtn.title = '全屏查看图表';
          expandBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>';
          expandBtn.addEventListener('click', (ev) => {
            ev.stopPropagation();
            ev.preventDefault();
            openDiagramFullscreen(svg);
          });
          block.appendChild(expandBtn);
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

  // Table width toggle buttons
  useEffect(() => {
    if (!html || !containerRef.current) return;
    const tables = containerRef.current.querySelectorAll('table');

    tables.forEach((table: HTMLTableElement) => {
      if (table.parentElement?.classList.contains('table-wrapper')) return;

      const wrapper = document.createElement('div');
      wrapper.className = 'table-wrapper';
      table.parentNode?.insertBefore(wrapper, table);
      wrapper.appendChild(table);

      // Toggle button group
      const btnGroup = document.createElement('div');
      btnGroup.className = 'table-toggle-group';

      const btnFull = document.createElement('button');
      btnFull.className = 'table-toggle-btn';
      btnFull.textContent = '全宽';
      btnFull.title = '表格占满整个宽度';

      const btnStd = document.createElement('button');
      btnStd.className = 'table-toggle-btn active';
      btnStd.textContent = '标准';
      btnStd.title = '表格按内容宽度显示';

      btnFull.addEventListener('click', () => {
        wrapper.classList.add('table-fullwidth');
        btnFull.classList.add('active');
        btnStd.classList.remove('active');
      });

      btnStd.addEventListener('click', () => {
        wrapper.classList.remove('table-fullwidth');
        btnStd.classList.add('active');
        btnFull.classList.remove('active');
      });

      btnGroup.append(btnFull, btnStd);
      wrapper.insertBefore(btnGroup, table);
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
