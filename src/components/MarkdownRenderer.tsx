import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function SuggestionBlock({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(168,85,247,0.06) 100%)',
      border: '1px solid rgba(59,130,246,0.25)',
      borderLeft: '3px solid #3B82F6',
      borderRadius: '8px',
      padding: '0.7em 1em',
      margin: '0.6em 0',
    }}>
      {children}
    </div>
  );
}

const MarkdownRenderer = memo(function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null;

  // Normalize: fix doubled-escaped newlines from API data
  let normalized = content
    .replace(/\\n/g, '\n')
    .replace(/\\\*/g, '*')
    .replace(/\\_/g, '_')
    // Fix CommonMark: ** immediately followed/preceded by quote won't parse as bold
    .replace(/\*\*"/g, '"**')
    .replace(/"\*\*/g, '**"');

  // Pre-process content: detect suggestion lines and wrap them in styled blocks
  // Pattern: lines starting with → or containing "建议："
  const processedContent = normalized
    .split('\n')
    .reduce((acc: string[], line: string) => {
      const trimmed = line.trim();
      // Detect suggestion lines: starts with → or contains 建议：
      if (trimmed.startsWith('→') || /^>\s*建议/.test(trimmed) || /^建议[：:]/.test(trimmed)) {
        acc.push('> 💡 ' + trimmed.replace(/^→\s*/, '').replace(/^>\s*/, ''));
      } else {
        acc.push(line);
      }
      return acc;
    }, [])
    .join('\n');

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <style>{`
        .ai-markdown {
          color: #e2e8f0;
          line-height: 1.7;
          font-size: 13px;
        }
        .ai-markdown h1 { font-size: 1.25em; font-weight: 700; margin: 1em 0 0.5em; color: #f1f5f9; }
        .ai-markdown h2 { font-size: 1.1em; font-weight: 700; margin: 0.9em 0 0.4em; color: #e2e8f0; padding-bottom: 0.3em; border-bottom: 1px solid rgba(148,163,184,0.2); }
        .ai-markdown h3 { font-size: 1em; font-weight: 600; margin: 0.8em 0 0.3em; color: #cbd5e1; }
        .ai-markdown p { margin: 0.5em 0; }
        .ai-markdown strong { color: #ffffff; font-weight: 700; }
        .ai-markdown ul, .ai-markdown ol { padding-left: 1.2em; margin: 0.4em 0; }
        .ai-markdown li { margin: 0.2em 0; }
        .ai-markdown li::marker { color: #64748b; }
        .ai-markdown code { 
          background: rgba(59,130,246,0.15); 
          color: #93c5fd; 
          padding: 0.15em 0.4em; 
          border-radius: 4px; 
          font-size: 0.9em; 
          font-family: 'SF Mono', 'Fira Code', monospace;
        }
        .ai-markdown pre {
          background: rgba(15,23,42,0.8);
          border: 1px solid rgba(148,163,184,0.15);
          border-radius: 8px;
          padding: 0.8em 1em;
          overflow-x: auto;
          margin: 0.6em 0;
        }
        .ai-markdown pre code {
          background: none;
          color: #e2e8f0;
          padding: 0;
          font-size: 0.85em;
        }
        /* Enhanced blockquote - suggestion style */
        .ai-markdown blockquote {
          background: linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(168,85,247,0.04) 100%);
          border: 1px solid rgba(59,130,246,0.2);
          border-left: 3px solid #3B82F6;
          border-radius: 0 8px 8px 0;
          padding: 0.7em 1em;
          margin: 0.7em 0;
          color: #cbd5e1;
          font-style: normal;
        }
        .ai-markdown blockquote p { margin: 0.2em 0; }
        .ai-markdown blockquote strong { color: #93c5fd; font-weight: 700; }
        .ai-markdown blockquote::before {
          content: '';
          display: none;
        }
        .ai-markdown table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.6em 0;
          font-size: 0.9em;
        }
        .ai-markdown th {
          background: rgba(59,130,246,0.1);
          color: #93c5fd;
          font-weight: 600;
          padding: 0.4em 0.8em;
          text-align: left;
          border-bottom: 2px solid rgba(59,130,246,0.3);
        }
        .ai-markdown td {
          padding: 0.35em 0.8em;
          border-bottom: 1px solid rgba(148,163,184,0.1);
          color: #cbd5e1;
        }
        .ai-markdown hr {
          border: none;
          border-top: 1px solid rgba(148,163,184,0.15);
          margin: 0.8em 0;
        }
        .ai-markdown a {
          color: #60a5fa;
          text-decoration: underline;
        }
        .ai-markdown em {
          color: #94a3b8;
        }
      `}</style>
      <div className="ai-markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {processedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
});

export default MarkdownRenderer;
