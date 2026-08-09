import { useState, useRef, useCallback } from 'react';
import { Camera, X, Loader2, ScanText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createWorker } from 'tesseract.js';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
    /TOTAL\s+GERAL\s+[R$:]*\s*([\d.,]+)/i,
    /TOTAL\s+[R$:]*\s*([\d.,]+)/i,
    /VALOR\s+(TOTAL\s+)?[R$:]*\s*([\d.,]+)/i,
    /TOTAL\s*[R$:]*\s*([\d.,]+)/i,
    /VALOR\s*[R$:]*\s*([\d.,]+)/i,
    /R\$\s*([\d.,]+)/,
    /RS\s*([\d.,]+)/,
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
    if (/TOTAL|VALOR|CUPOM|NF|NOTA|COMPROVANTE|ORÇAMENTO|ORCAMENTO|CNPJ|CPF|CHAVE|RECEBER|PAGAR|VENCIMENTO|DATA|DESCRICAO|DESCRIÇÃO|QTD|ITEM/i.test(line)) continue;
    if (/R\$\s*[\d.,]+/.test(line)) continue;
    if (/^\d[\d.,]*$/.test(line)) continue;
    if (line.length < 3) continue;
    return line;
  }
  return 'Comprovante';
};

// Redimensiona e comprime a imagem antes do OCR para acelerar bastante o processamento
const resizeImage = (file: File, maxDim = 1600): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        let { width, height } = img;
        const scale = Math.min(1, maxDim / Math.max(width, height));
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas não suportado');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (blob) resolve(blob);
            else reject(new Error('Falha ao gerar imagem'));
          },
          'image/jpeg',
          0.85
        );
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Falha ao carregar imagem'));
    };
    img.src = url;
  });
};

export function ReceiptScanner({ onScanComplete, onClose }: ReceiptScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'select' | 'working'>('select');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setIsScanning(true);
    setStage('working');
    setProgress(0);

    try {
      // Redimensiona primeiro (fotos de câmera são grandes e deixam o OCR lento)
      const resized = await resizeImage(file);

      const worker = await createWorker('por', 1, {
        workerPath: '/tesseract/worker.min.js',
        corePath: '/tesseract/',
        langPath: '/tesseract/',
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      try {
        const { data } = await worker.recognize(resized);
        const text = data.text || '';
        onScanComplete({
          description: parseDescription(text),
          amount: parseAmount(text),
          date: parseDate(text),
          rawText: text,
        });
        toast.success('Comprovante lido! Confira os dados antes de salvar.');
      } finally {
        await worker.terminate();
      }
    } catch (err) {
      console.error('OCR error:', err);
      toast.error('Não foi possível ler o comprovante. Tente outra foto (mais nítida e sem reflexo).');
    } finally {
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
              <p className="text-xs text-muted-foreground">Tire uma foto nítida, de preferência sem reflexo</p>
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
              <p className="text-sm text-muted-foreground">
                {progress === 0 ? 'Preparando motor de leitura...' : 'Lendo o comprovante...'}
              </p>
              <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full bg-primary transition-all", progress === 0 && "w-full animate-pulse")} style={{ width: progress === 0 ? '100%' : `${progress}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">
                {progress === 0 ? 'baixando componentes (primeira vez demora mais)' : `${progress}%`}
              </span>
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
