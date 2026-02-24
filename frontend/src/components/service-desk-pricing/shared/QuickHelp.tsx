'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, X, Video, FileText, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickHelpProps {
  title: string;
  content: string | React.ReactNode;
  videoUrl?: string;
  docUrl?: string;
  steps?: string[];
  tips?: string[];
  className?: string;
}

export function QuickHelp({
  title,
  content,
  videoUrl,
  docUrl,
  steps,
  tips,
  className,
}: QuickHelpProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 shadow-lg"
      >
        <HelpCircle className="h-4 w-4 mr-2" />
        Ajuda Rápida
      </Button>
    );
  }

  return (
    <Card className={cn('fixed bottom-6 right-6 z-50 w-96 shadow-2xl', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            {title}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 max-h-96 overflow-y-auto">
        {typeof content === 'string' ? (
          <p className="text-sm text-muted-foreground">{content}</p>
        ) : (
          content
        )}
        
        {steps && steps.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Passo a passo:</h4>
            <ol className="space-y-1.5 text-sm text-muted-foreground">
              {steps.map((step, index) => (
                <li key={index} className="flex gap-2">
                  <span className="font-semibold text-blue-600 flex-shrink-0">
                    {index + 1}.
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        
        {tips && tips.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Dicas:</h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {tips.map((tip, index) => (
                <li key={index} className="flex gap-2">
                  <span className="text-yellow-600 flex-shrink-0">💡</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex gap-2 pt-2 border-t">
          {videoUrl && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.open(videoUrl, '_blank')}
            >
              <Video className="h-3.5 w-3.5 mr-1.5" />
              Vídeo
            </Button>
          )}
          {docUrl && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.open(docUrl, '_blank')}
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              Docs
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Floating help button component
interface FloatingHelpButtonProps {
  onClick: () => void;
  className?: string;
}

export function FloatingHelpButton({ onClick, className }: FloatingHelpButtonProps) {
  return (
    <Button
      variant="default"
      size="icon"
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg',
        'bg-blue-600 hover:bg-blue-700',
        className
      )}
    >
      <HelpCircle className="h-6 w-6" />
    </Button>
  );
}
