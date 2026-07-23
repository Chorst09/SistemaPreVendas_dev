'use client';

import React, { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Project } from '@/lib/types/project';
import { ProjectPDFService } from '@/lib/services/project-pdf-service';

interface ProjectPDFViewerDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectPDFViewerDialog({ project, open, onOpenChange }: ProjectPDFViewerDialogProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !project) {
      setPdfUrl(null);
      return;
    }

    const url = new ProjectPDFService().createProjectPDFUrl(project);
    setPdfUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [open, project]);

  const handleDownload = () => {
    if (!project) return;
    new ProjectPDFService().downloadProjectPDF(project);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[92vh] max-w-[96vw] gap-3 p-4 sm:max-w-6xl">
        <DialogHeader className="pr-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Visualizar Projeto em PDF
            </DialogTitle>
            <Button type="button" variant="outline" size="sm" onClick={handleDownload} disabled={!project}>
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden rounded-md border bg-muted/30">
          {pdfUrl ? (
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=0&view=FitH`}
              className="h-full min-h-[72vh] w-full bg-white"
              title={`PDF do projeto ${project?.name || ''}`}
            />
          ) : (
            <div className="flex h-[72vh] items-center justify-center text-sm text-muted-foreground">
              Gerando visualização do PDF...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
