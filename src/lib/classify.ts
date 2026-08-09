import { Category } from '@/types/finance';

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
  // Categorias genéricas (app zerado / sem histórico sincronizado)
  transporte: [
    'uber', 'taxi', 'onibus', 'passagem', 'gasolina', 'combustivel', 'posto',
    'estacionamento', 'pedagio',
  ],
  compras: [
    'roupa', 'calcado', 'tenis', 'camiseta', 'shopping', 'magazine', 'casa bahia',
    'renner', 'cea', 'hikari', 'casas', 'eletro', 'shampoo', 'sabonete', 'papel higienico',
  ],
  lazer: ['cinema', 'ingresso', 'jogo', 'lanchonete', 'restaurante', 'delivery', 'ifood'],
  educacao: ['livro', 'escola', 'faculdade', 'curso', 'material escolar', 'ufscar', 'creche'],
  contas: ['agua', 'luz', 'energia', 'internet', 'tv', 'assinatura', 'mensalidade', 'taxa'],
};

// Categorias equivalentes: chave da planilha pode não existir no aparelho zerado.
// Ex.: "carro" cai em "Carro" se existir; senão em "Transporte".
const CATEGORY_ALIASES: Record<string, string[]> = {
  alimentacao: ['alimentacao'],
  'alimentacao caes': ['alimentacao caes', 'alimentacao'],
  carro: ['carro', 'transporte'],
  casa: ['casa', 'moradia', 'compras'],
  combustivel: ['combustivel', 'transporte'],
  'higiene pessoal': ['higiene pessoal', 'compras'],
  igreja: ['igreja'],
  moradia: ['moradia', 'casa'],
  negocios: ['negocios'],
  saude: ['saude'],
  'saude caes': ['saude caes', 'saude'],
  telefone: ['telefone', 'contas'],
  transporte: ['transporte', 'carro', 'combustivel'],
  compras: ['compras', 'higiene pessoal', 'casa'],
  lazer: ['lazer'],
  educacao: ['educacao'],
  contas: ['contas', 'telefone'],
};

const normalizeCategory = (category: Category) => normalize(category.name);

const findCategoryByAlias = (key: string, categories: Category[]): Category | undefined => {
  const aliases = CATEGORY_ALIASES[key] || [key];
  for (const alias of aliases) {
    const cat = categories.find(c => normalizeCategory(c) === alias);
    if (cat) return cat;
  }
  return undefined;
};

// Encontra a categoria mais provável para um item via palavras-chave.
export const classifyText = (name: string, categories: Category[]): string | undefined => {
  if (categories.length === 0) return undefined;
  const itemName = normalize(name);

  // Ordena chaves por tamanho (mais específicas primeiro)
  const keys = Object.keys(CATEGORY_KEYWORDS).sort((a, b) => b.length - a.length);

  for (const key of keys) {
    const cat = findCategoryByAlias(key, categories);
    if (!cat) continue;

    for (const kw of CATEGORY_KEYWORDS[key]) {
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
