import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import './MarkdownViewer.css';

interface MarkdownViewerProps {
  content: string;
}

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  const [html, setHtml] = useState('');

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

    const parseAndSanitize = async () => {
      const rawHtml = await marked.parse(content);
      const cleanHtml = DOMPurify.sanitize(rawHtml);
      setHtml(cleanHtml);
    };

    parseAndSanitize();
  }, [content]);

  return (
    <div 
      className="markdown-body" 
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
};
