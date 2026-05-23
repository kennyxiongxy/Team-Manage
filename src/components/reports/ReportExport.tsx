import { toast } from 'sonner';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Table, Image, Link2, X, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { exportFormats } from '@/data/mockData';
import { cn } from '@/lib/utils';

const ease = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

const formatIcons: Record<string, React.ElementType> = {
  pdf: FileText,
  excel: FileSpreadsheet,
  image: Image,
  link: Link2,
};

export default function ReportExport() {
  const [showModal, setShowModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleExport = () => {
    setIsExporting(true);
    setProgress(0);
    setExportComplete(false);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          setExportComplete(true);
          toast.success('报告导出成功', { description: 'PDF 文件已生成' });
          setTimeout(() => {
            setShowModal(false);
            setExportComplete(false);
            setProgress(0);
          }, 1500);
          return 100;
        }
        return prev + 8;
      });
    }, 150);
  };

  return (
    <>
      {/* Export buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:border-[#94A3B8]"
        >
          <FileText className="h-4 w-4" />
          导出 PDF
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:border-[#94A3B8]"
        >
          <Table className="h-4 w-4" />
          导出 Excel
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#A855F7] to-[#3B82F6] px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg transition-shadow hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
        >
          <Link2 className="h-4 w-4" />
          分享报告
        </motion.button>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,6,23,0.75)] backdrop-blur-sm"
            onClick={() => !isExporting && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3, ease }}
              className="w-full max-w-md rounded-2xl bg-muted border border-border p-6 shadow-modal"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-foreground">导出报告</h3>
                {!isExporting && (
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {!exportComplete ? (
                <>
                  {/* Format selection */}
                  {!isExporting && (
                    <div className="space-y-2 mb-5">
                      {exportFormats.map((format) => {
                        const Icon = formatIcons[format.id] || FileText;
                        return (
                          <button
                            key={format.id}
                            onClick={() => setSelectedFormat(format.id)}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all',
                              selectedFormat === format.id
                                ? 'border-accent bg-[rgba(6,182,212,0.1)]'
                                : 'border-border bg-card hover:border-[#94A3B8]'
                            )}
                          >
                            <div
                              className={cn(
                                'flex h-10 w-10 items-center justify-center rounded-lg',
                                selectedFormat === format.id
                                  ? 'bg-accent/15'
                                  : 'bg-muted'
                              )}
                            >
                              <Icon
                                className={cn(
                                  'h-5 w-5',
                                  selectedFormat === format.id ? 'text-accent' : 'text-muted-foreground'
                                )}
                              />
                            </div>
                            <div>
                              <span
                                className={cn(
                                  'block text-sm font-medium',
                                  selectedFormat === format.id ? 'text-accent' : 'text-foreground'
                                )}
                              >
                                {format.name}
                              </span>
                              <span className="text-xs text-muted-foreground">{format.description}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Progress */}
                  {isExporting && (
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">正在生成报告...</span>
                        <span className="text-sm font-mono text-accent">{progress}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-card">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-[#A855F7] to-[#06B6D4]"
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.15 }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Action button */}
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className={cn(
                      'w-full rounded-xl py-2.5 text-sm font-medium transition-all',
                      isExporting
                        ? 'bg-muted text-muted-foreground cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#A855F7] to-[#3B82F6] text-primary-foreground hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]'
                    )}
                  >
                    {isExporting ? '导出中...' : '开始导出'}
                  </button>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center py-6"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(34,197,94,0.15)] mb-3">
                    <CheckCircle2 className="h-7 w-7 text-[#22C55E]" />
                  </div>
                  <p className="text-sm font-medium text-foreground">导出成功！</p>
                  <p className="text-xs text-muted-foreground mt-1">文件将自动下载</p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
