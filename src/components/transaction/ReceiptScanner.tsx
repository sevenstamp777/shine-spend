import { useState, useRef, useCallback } from 'react';
import { Camera, X, Loader2, ScanText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createWorker } from 'tesseract.js';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Category } from '@/types/finance';
import { classifyText } from '@/lib/classify';

export interface OcrItem {
  name: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discount?: number;
  discountType?: 'amount' | 'percent';
  totalPrice: number;
  categoryId?: string;
}

export interface OcrResult {
  description: string;
  amount: number | null;
  date: string;
  items: OcrItem[];
  rawText: string;
}

interface ReceiptScannerProps {
  onScanComplete: (result: OcrResult) => void;
  onClose: () => void;
  categories: Category[];
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
      const v = parseBrNumber(m[1] || m[2] || '');
      if (!isNaN(v) && v > 0) return v;
    }
  }
  return null;
};

// Desconto total aplicado no cupom (linha "DESCONTO X,XX" sobre o subtotal)
const parseDiscount = (text: string): number => {
  const m = text.match(/(?:DESCONTO|DESC\.?|DESCOMP)\s*[R$:]*\s*([\d.,]+)/i);
  if (m) {
    const v = parseBrNumber(m[1]);
    if (!isNaN(v) && v > 0 && v <= 100000) return v;
  }
  return 0;
};

// Linhas que são cabeçalho/rodapé do cupom — ignoradas como item
const NOISE_ITEM = /TOTAL|SUBTOTAL|TROCO|DINHEIRO|CARTAO|CREDITO|DEBITO|PIX|CUPOM|CNPJ|CPF|CHAVE|DATA|HORA|COMPROVANTE|VENCIMENTO|NSU|AUTORIZACAO|CANAIS|DESCONTO|ACRESCIMO|ITEM|DESCRICAO|QTD|PRECO|UNID|CANCELADO|ESTABELECIMENTO|ENDERECO|TELEFONE|DOCUMENTO|LOJA|CAIXA|OPERADOR|VOLUME|UNIT|VALOR/i;

// Unidades de medida comuns em cupom fiscal
const UNITS = ['KG', 'L', 'ML', 'G', 'M2', 'M', 'CX', 'PC', 'PCT', 'DZ', 'GR', 'UN', 'LT', 'KIT'];

// Converte quantidade no padrão brasileiro ("1,500" → 1.5; "2" → 2; "1.5" → 1.5)
const parseQty = (s: string): number => {
  if (s.includes(',')) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  return parseFloat(s);
};

// Converte número monetário tolerando o OCR que troca vírgula por ponto:
// "1.118,15" → 1118.15 | "3,50" → 3.5 | "3.50" (OCR) → 3.5
const parseBrNumber = (s: string): number => {
  const t = s.trim();
  if (t.includes(',')) return parseFloat(t.replace(/\./g, '').replace(',', '.'));
  return parseFloat(t);
};

// Remove separadores de coluna que o OCR costuma injetar ("—", ":", "|", "·",
// hífen cercado por espaços). Preserva hífen dentro de nome ("ARROZ-5KG").
const cleanName = (s: string): string =>
  s
    .replace(/[—–-]{2,}/g, ' ')
    .replace(/\s+[—–:|·.-]\s+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const round2 = (n: number): number => Math.round(n * 100) / 100;

// Distribui o desconto total do cupom proporcionalmente ao valor bruto de cada
// item, de forma que a soma dos itens bata com o total geral. O último item
// absorve as sobras de arredondamento.
const applyDiscount = (items: OcrItem[], discountTotal: number): OcrItem[] => {
  if (items.length === 0 || !(discountTotal > 0)) return items;
  const gross = items.reduce((sum, it) => sum + it.totalPrice, 0);
  if (!(gross > 0)) return items;

  let assigned = 0;
  return items.map((item, i) => {
    let d = round2((item.totalPrice * discountTotal) / gross);
    if (i === items.length - 1) d = round2(discountTotal - assigned);
    assigned += d;
    const totalPrice = Math.max(0, round2(item.totalPrice - d));
    return {
      ...item,
      totalPrice,
      discount: d > 0 ? d : undefined,
      discountType: d > 0 ? ('amount' as const) : undefined,
    };
  });
};

// Extrai os itens individuais do cupom de forma robusta ao OCR.
//
// O OCR de foto no celular pode fundir as linhas do cupom num texto corrido
// (sem quebras de linha), então o parse NÃO depende de cada item estar em uma
// linha própria: ele divide o texto nos valores monetários e reconstrói nome,
// quantidade e unidade de cada item a partir do trecho que antecede o valor.
const parseItems = (text: string, discountTotal = 0): OcrItem[] => {
  const flat = text.replace(/\n+/g, ' ').replace(/\s+/g, ' ');
  // Valor monetário: exatamente 2 casas decimais, e que não faça parte de uma
  // quantidade fracionária ("1,500" não casa aqui porque "0" segue após ",50").
  const valueRe = /(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})(?![.,]?\d)/g;
  const parts = flat.split(valueRe);

  const items: OcrItem[] = [];
  const seen = new Map<string, number>();
  let pending = '';

  for (const part of parts) {
    const valueMatch = part.match(/^\s*(\d{1,3}(?:[.,]\d{3})*[.,]\d{2})\s*$/);
    if (valueMatch) {
      const totalPrice = parseBrNumber(valueMatch[1]);
      if (totalPrice > 0 && totalPrice <= 50000) {
        const rawName = cleanName(pending);
        let qty = 1;
        let unit: string | undefined;
        let name: string | undefined;

        // Quantidade + unidade no início do item, padrão cupom fiscal:
        // "2 UN COCA" | "1,500 KG CARNE" | "0,100 L LEITE" | "3 X PACOTE" | "1,200 M2 FORRO"
        const uq = rawName.match(/^([\d]+(?:[.,]\d+)?)\s*([A-Za-z]{1,4}|M2|M²|KG|ML|G|L)?\s+(.+)$/);
        if (uq) {
          const parsedQty = parseQty(uq[1]);
          const rawUnit = (uq[2] || '').toUpperCase();
          // Só aceita como unidade se for conhecida (evita "1 PNEU ARO 13")
          const isKnownUnit =
            rawUnit !== '' &&
            (rawUnit === 'X' || UNITS.some(u => rawUnit.startsWith(u) || u.startsWith(rawUnit)));
          if (parsedQty > 0 && parsedQty <= 10000 && isKnownUnit) {
            qty = parsedQty;
            if (rawUnit !== 'X') {
              unit = UNITS.find(u => rawUnit.startsWith(u) || u.startsWith(rawUnit)) || rawUnit;
            }
            name = cleanName(uq[3]);
          }
        }

        // Sem quantidade/unidade: remove número de item ("02 ARROZ" → "ARROZ")
        if (!name) name = cleanName(rawName).replace(/^\d{1,3}\s+/, '');

        if (name && name.length >= 2 && !NOISE_ITEM.test(name)) {
          const key = name.toLowerCase();
          const idx = seen.get(key);
          if (idx !== undefined) {
            items[idx].quantity += qty;
            items[idx].totalPrice += totalPrice;
            items[idx].unitPrice = items[idx].totalPrice / items[idx].quantity;
          } else {
            seen.set(key, items.length);
            items.push({
              name,
              quantity: qty,
              unit,
              totalPrice,
              unitPrice: qty > 0 ? totalPrice / qty : totalPrice,
            });
          }
        }
      }
      pending = '';
    } else {
      pending += ' ' + part;
    }
  }

  return applyDiscount(items, discountTotal).slice(0, 50);
};

const parseDescription = (text: string): string => {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
  for (const line of lines.slice(0, 8)) {
    if (/TOTAL|VALOR|CUPOM|NF|NOTA|COMPROVANTE|ORÇAMENTO|ORCAMENTO|CNPJ|CPF|CHAVE|RECEBER|PAGAR|VENCIMENTO|DATA|DESCRICAO|DESCRIÇÃO|QTD|ITEM|HORA|ESTABELECIMENTO|ENDERECO|TELEFONE|DOCUMENTO|LOJA|CAIXA/i.test(line)) continue;
    if (/R\$\s*[\d.,]+/.test(line)) continue;
    if (/^\d[\d.,]*$/.test(line)) continue;
    if (line.length < 3) continue;
    return line;
  }
  return 'Comprovante';
};

// Aplica escala de cinza + aumento de contraste (cupom térmico) para o OCR
// reconhecer melhor o texto pequeno impresso.
const enhanceImage = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const contrast = 1.8;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    let g = (gray - 128) * contrast + 128;
    g = g < 0 ? 0 : g > 255 ? 255 : g;
    data[i] = g;
    data[i + 1] = g;
    data[i + 2] = g;
  }
  ctx.putImageData(imageData, 0, 0);
};

// Redimensiona, normaliza e comprime a imagem antes do OCR para acelerar e
// melhorar a leitura no celular
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
        enhanceImage(ctx, width, height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (blob) resolve(blob);
            else reject(new Error('Falha ao gerar imagem'));
          },
          'image/jpeg',
          0.9
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

export function ReceiptScanner({ onScanComplete, onClose, categories }: ReceiptScannerProps) {
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

    try {
      const resized = await resizeImage(file);

      const worker = await createWorker('por', 1, {
        workerPath: '/tesseract/worker.min.js',
        corePath: '/tesseract/tesseract-core-lstm.wasm.js',
        langPath: '/tesseract/',
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      try {
        // PSM 6: bloco de texto uniforme — ideal para cupom fiscal de 80mm
        await worker.setParameters({ tessedit_pageseg_mode: '6' });

        const { data } = await worker.recognize(resized);
        const text = data.text || '';

        const discountTotal = parseDiscount(text);
        const rawItems = parseItems(text, discountTotal);
        const items = rawItems.map(item => ({
          ...item,
          categoryId: classifyText(item.name, categories),
        }));

        onScanComplete({
          description: parseDescription(text),
          amount: parseAmount(text),
          date: parseDate(text),
          items,
          rawText: text,
        });

        if (items.length > 0) {
          const categorized = items.filter(i => i.categoryId).length;
          toast.success(
            `${items.length} ${items.length === 1 ? 'item lido' : 'itens lidos'} · ${categorized} categorizados automaticamente`
          );
        } else {
          toast.success('Comprovante lido! Confira os dados antes de salvar.');
        }
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
  }, [onScanComplete, onClose, categories]);

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
