import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  File,
  ChevronRight,
  ChevronDown,
  Eye,
  Check,
  Copy,
} from 'lucide-react';
import type { ExportFileItem } from '../types/export';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';

export interface ExportFileTreeProps {
  files: ExportFileItem[];
  projectName: string;
}

interface TreeItemProps {
  item: ExportFileItem;
  depth?: number;
  onPreviewFile: (item: ExportFileItem) => void;
}

const TreeItem: React.FC<TreeItemProps> = ({
  item,
  depth = 0,
  onPreviewFile,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const getFileIcon = (name: string) => {
    if (name.endsWith('.tsx') || name.endsWith('.ts')) {
      return <FileCode className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    }
    if (name.endsWith('.json') || name.endsWith('.js')) {
      return <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
    if (name.endsWith('.md')) {
      return <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
    if (name.endsWith('.css')) {
      return <File className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
    }
    return <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  };

  if (item.type === 'dir') {
    return (
      <div>
        <div
          onClick={() => setIsOpen(!isOpen)}
          style={{ paddingLeft: `${depth * 14}px` }}
          className="flex items-center space-x-1.5 py-1 px-1.5 rounded hover:bg-slate-800/60 cursor-pointer text-xs font-mono text-slate-300 transition-colors select-none group"
        >
          <span className="text-slate-500 w-3 flex items-center justify-center">
            {isOpen ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </span>
          {isOpen ? (
            <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          )}
          <span className="font-semibold text-slate-200">{item.name}/</span>
          <span className="text-[10px] text-slate-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            {item.size}
          </span>
        </div>

        {isOpen && item.children && (
          <div>
            {item.children.map((child) => (
              <TreeItem
                key={child.path}
                item={child}
                depth={depth + 1}
                onPreviewFile={onPreviewFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={() => item.content && onPreviewFile(item)}
      style={{ paddingLeft: `${depth * 14 + 18}px` }}
      className={`flex items-center justify-between py-1 px-1.5 rounded text-xs font-mono transition-colors group select-none ${
        item.content
          ? 'hover:bg-slate-800/80 cursor-pointer text-slate-300 hover:text-white'
          : 'text-slate-400 cursor-default'
      }`}
    >
      <div className="flex items-center space-x-2 min-w-0">
        {getFileIcon(item.name)}
        <span className="truncate">{item.name}</span>
      </div>

      <div className="flex items-center space-x-2 shrink-0">
        <span className="text-[10px] text-slate-500">{item.size}</span>
        {item.content && (
          <Eye className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </div>
  );
};

export const ExportFileTree: React.FC<ExportFileTreeProps> = ({ files }) => {
  const [previewItem, setPreviewItem] = useState<ExportFileItem | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (previewItem?.content) {
      navigator.clipboard.writeText(previewItem.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
          PACKAGE FILE TREE PREVIEW
        </label>
        <span className="text-[11px] text-slate-400">Click any file to preview</span>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 max-h-[380px] overflow-y-auto font-mono text-xs shadow-inner">
        {files.map((file) => (
          <TreeItem
            key={file.path}
            item={file}
            onPreviewFile={(item) => setPreviewItem(item)}
          />
        ))}
      </div>

      {previewItem && (
        <Modal
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          title={`Preview: ${previewItem.name}`}
          maxWidth="2xl"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
              <span className="font-mono">{previewItem.path}</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="space-x-1 text-xs py-1 px-2.5 h-auto"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Code</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-[420px] overflow-y-auto leading-relaxed border border-slate-800 shadow-inner">
              <pre>
                <code>{previewItem.content}</code>
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
