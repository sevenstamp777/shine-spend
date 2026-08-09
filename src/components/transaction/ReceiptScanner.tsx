import { useState, useRef, useCallback } from 'react';
import { Camera, ImagePlus, X, Loader2, ScanText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createWorker } from 'tesseract.js';
import { toast } from 'sonner';

export interface OcrResult {
  description: string;
  amount: number | null;
  date: string;
  rawText: string;
}

interface ReceiptScannerProps {
  onScanComplete: (result: OcrResult) => void;
  onClose: () => void;
}

const parseDate = (text: string): string => {
  const match = text.match(/(\d{2})[/.](\d{2})[/.](\d{4})/);
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`;
  }
  return new Date().toISOString().split('T')[0];
};

const parseAmount = (text: string): number | null => {
  const patterns = [
    /TOTAL\s*[R$:]*\s*([\d.,]+)/i,
    /TOTAL\s*GERAL\s*[R$:]*\s*([\d.,]+)/i,
    /VALOR\s*(TOTAL\s*)?[R$:]*\s*([\d.,]+)/i,
    /R\$\s*([\d.,]+)/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const raw = (m[1] || m[2] || '').replace(/\./g, '').replace(',', '.');
      const v = parseFloat(raw);
      if (!isNaN(v) && v > 0) return v;
    }
  }
  return null;
};

const parseDescription = (text: string): string => {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
  for (const line of lines.slice(0, 6)) {
    if (/TOTAL|VALOR|CUPOM|NF|NOTA|COMPROVANTE|ORÇAMENTO|ORCAMENTO/i.test(line)) continue;
    if (/R\$\s*[\d.,]+/.test(line)) continue;
    if (/^\d+$/.test(line)) continue;
    return line;
  }
  return 'Comprovante';
};

export function ReceiptScanner({ onScanComplete, onClose }: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setIsScanning(true);
    setProgress(0);
    const worker = await createWorker('por', 1, {
      logger: (m: { status: string; progress: number }) => {
        if (m.status === 'recognizing text') {
          setProgress(Math.round(m.progress * 100));
        }
      },
    });
    try {
      const { data } = await worker.recognize(file);
      const text = data.text || '';
      onScanComplete({
        description: parseDescription(text),
        amount: parseAmount(text),
        date: parseDate(text),
        rawText: text,
      });
      toast.success('Comprovante lido com sucesso!');
    } catch (err) {
      console.error('OCR error:', err);
      toast.error('Não foi possível ler o comprovante. Tente novamente.');
    } finally {
      await worker.terminate();
      setIsScanning(false);
      onClose();
    }
  }, [onScanComplete, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-2xl shadow-soft-xl animate-slide-up sm:animate-scale-in max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-card z-10 px-6 pt-6 pb-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ScanText size={22} className="text-primary" />
            <div>
              <h2 className="text-xl font-semibold text-foreground">Escanear Comprovante</h2>
              <p className="text-xs text-muted-foreground">Tire uma foto ou escolha uma imagem</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X size={20} />
          </Button>
        </div>

        <div className="p-6 space-y-4">
          {preview && (
            <img src={preview} alt="Pré-visualização" className="w-full max-h-64 object-contain rounded-xl bg-muted" />
          )}

          {isScanning ? (
            <div className="py-10 flex flex-col items-center gap-4">
              <Loader2 size={36} className="animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Lendo o comprovante...</p>
              <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
          ) : (
            <>
              <Button
                type="button"
                className="w-full h-12 gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={18} />
                Tirar foto / escolher imagem
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processImage(file);
                }}
              />
              <p className="text-xs text-muted-foreground text-center">
                A imagem é processada no seu próprio dispositivo — nada é enviado para servidores.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
