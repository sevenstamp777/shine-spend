import { useState, useRef, useCallback } from 'react';
import { Camera, X, Loader2, ScanText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createWorker } from 'tesseract.js';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Category } from '@/types/finance';

export interface OcrItem {
  name: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
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

// Remoção de acentos + caixa baixa para casar palavras-chave
const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

// Palavras-chave por categoria (nome normalizado). Chaves mais longas
// (ex: "saúde cães") têm prioridade sobre as genéricas ("saúde").
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  alimentacao: [
    'mercado', 'supermercado', 'atacadao', 'padaria', 'feira', 'hortifruti', 'horti',
    'pao', 'leite', 'arroz', 'feijao', 'macarrao', 'oleo', 'acucar', 'farinha',
    'carne', 'frios', 'queijo', 'presunto', 'laticinio', 'bebida', 'refrigerante',
    'cerveja', 'agua', 'suco', 'cafe', 'lanche', 'esfiha', 'pizza', 'salgado',
    'doce', 'bala', 'chocolate', 'biscoito', 'bolacha', 'bolo', 'fruta', 'verdura',
    'legume', 'salgadinho', 'acougue', 'muffato', 'amigao', 'assai', 'proenca',
    'rondon', 'bandeirante', 'loqueti',
  ],
  'alimentacao caes': [
    'racao', 'petshop', 'pet shop', 'cachorro', 'gatinho', 'gato', 'pedigree',
    'whiskas', 'puppy', 'osso', 'petisco', 'parada animal', 'pantanal',
  ],
  carro: [
    'pneu', 'oficina', 'mecanico', 'mecanica', 'autopecas', 'bateria', 'revisao',
    'escapamento', 'alinhamento', 'balanceamento', 'lavagem', 'estacionamento',
    'seguro auto', 'multa', 'youse',
  ],
  casa: [
    'gas', 'condominio', 'moveis', 'mobilia', 'utensilio', 'ferragem', 'ferramenta',
    'lampada', 'tinta', 'hidraulica', 'eletrica', 'martelo', 'casa osasco', 'osasco',
  ],
  combustivel: [
    'posto', 'gasolina', 'etanol', 'alcool', 'diesel', 'gnv', 'combustivel',
    'ipiranga', 'shell', 'br', 'tanaka', 'lalo', 'estoril', 'colina',
  ],
  'higiene pessoal': [
    'shampoo', 'sabonete', 'creme dental', 'papel higienico', 'desodorante',
    'perfume', 'perfumaria', 'cosmetico', 'gilete', 'condicionador', 'higiene',
    'pasta de dente', 'sabao', 'detergente',
  ],
  igreja: ['dizimo', 'oferta', 'igreja', 'congregacao', 'landmark'],
  moradia: ['aluguel', 'condominio'],
  negocios: [
    'negocio', 'loja', 'estoque', 'fornecedor', 'material escritorio', 'sebrae',
    'canhoto', 'embalagem', 'etiqueta',
  ],
  saude: [
    'farmacia', 'drogaria', 'remedio', 'medicamento', 'consulta', 'medico',
    'clinica', 'dentista', 'exame', 'hospital', 'fisioterapia', 'psicologo',
    'raia', 'total', 'univet', 'cobasi',
  ],
  'saude caes': ['veterinario', 'vet', 'castracao', 'vacina pet', 'consulta pet'],
  telefone: ['tim', 'vivo', 'claro', 'oi', 'telefone', 'celular', 'internet', 'fibra', 'plano'],
};

const normalizeCategory = (category: Category) => normalize(category.name);

// Encontra a categoria mais provável para um item via palavras-chave.
const classifyCategory = (name: string, categories: Category[]): string | undefined => {
  if (categories.length === 0) return undefined;
  const itemName = normalize(name);

  // Ordena chaves por tamanho (mais específicas primeiro)
  const keys = Object.keys(CATEGORY_KEYWORDS).sort((a, b) => b.length - a.length);

  for (const key of keys) {
    const keywords = CATEGORY_KEYWORDS[key];
    const cat = categories.find(c => normalizeCategory(c) === key);
    if (!cat) continue;

    for (const kw of keywords) {
      // Keywords curtas casam como palavra inteira (evita "oi" dentro de "noite")
      const hit = kw.length < 4
        ? new RegExp(`\\b${kw}\\b`).test(itemName)
        : itemName.includes(kw);
      if (hit) return cat.id;
    }
  }

  // Fallback: categoria "Outros"
  const others = categories.find(c => normalizeCategory(c) === 'outros');
  return others?.id;
};

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

// Linhas que são cabeçalho/rodapé do cupom — ignoradas como item
const NOISE_ITEM = /TOTAL|SUBTOTAL|TROCO|DINHEIRO|CARTAO|CREDITO|DEBITO|PIX|CUPOM|CNPJ|CPF|CHAVE|DATA|HORA|COMPROVANTE|VENCIMENTO|NSU|AUTORIZACAO|CANAIS|DESCONTO|ITEM|DESCRICAO|QTD|PRECO|UNID|CANCELADO|ESTABELECIMENTO|ENDERECO|TELEFONE|DOCUMENTO|LOJA|CAIXA|OPERADOR|VOLUME|UNIT|VALOR/i;

// Unidades de medida comuns em cupom fiscal
const UNITS = ['KG', 'L', 'ML', 'G', 'M2', 'M', 'CX', 'PC', 'PCT', 'DZ', 'GR', 'UN', 'LT', 'KIT'];

// Converte quantidade no padrão brasileiro ("1,500" → 1.5; "2" → 2; "1.5" → 1.5)
const parseQty = (s: string): number => {
  if (s.includes(',')) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  return parseFloat(s);
};

// Extrai itens individuais do cupom (linhas terminando em valor no padrão 0,00).
// Reconhece o formato de cupom fiscal: [qtd UN] NOME DO PRODUTO ... VALOR
const parseItems = (text: string): OcrItem[] => {
  const lines = text
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const items: OcrItem[] = [];
  const seen = new Map<string, number>();

  for (const line of lines) {
    const m = line.match(/^(.*?)[R$\s]*([\d]+[.,]\d{2})\s*$/);
    if (!m) continue;
    const totalPrice = parseFloat(m[2].replace('.', '').replace(',', '.'));
    if (!(totalPrice > 0) || totalPrice > 50000) continue;

    let name = m[1].trim();
    if (!name) continue;

    // Quantidade + unidade no início, padrão cupom fiscal:
    // "2 UN COCA" | "1,500 KG CARNE" | "0,100 L LEITE" | "3 X PACOTE"
    let qty = 1;
    let unit: string | undefined;
    const uq = name.match(/^([\d]+(?:[.,]\d+)?)\s*([A-Za-z]{1,4}|M²|KG|ML|G|L)?\s+(.+)$/);
    if (uq) {
      const parsedQty = parseQty(uq[1]);
      const rawUnit = (uq[2] || '').toUpperCase();
      // Só aceita como unidade se for conhecida (evita "1 PNEU ARO 13")
      const isKnownUnit = rawUnit !== '' && (rawUnit === 'X' || UNITS.some(u => rawUnit.startsWith(u) || u.startsWith(rawUnit)));
      if (parsedQty > 0 && parsedQty <= 10000 && isKnownUnit) {
        qty = parsedQty;
        if (rawUnit !== 'X') {
          unit = UNITS.find(u => rawUnit.startsWith(u) || u.startsWith(rawUnit)) || rawUnit;
        }
        name = uq[3].trim();
      }
    }

    // Limpa artefatos de OCR
    name = name.replace(/[|.;:_]{2,}/g, ' ').replace(/\s+/g, ' ').trim();
    name = name.replace(/^\d+\s*/, '');

    if (!name || name.length < 2) continue;
    if (NOISE_ITEM.test(name)) continue;

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

  return items.slice(0, 50);
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
        const { data } = await worker.recognize(resized);
        const text = data.text || '';

        const rawItems = parseItems(text);
        const items = rawItems.map(item => ({
          ...item,
          categoryId: classifyCategory(item.name, categories),
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
