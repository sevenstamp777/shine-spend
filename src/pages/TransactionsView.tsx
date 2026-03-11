import { useState, useMemo } from 'react';
import { Search, Filter, X, Calendar, CreditCard, Download } from 'lucide-react';
import { Transaction, Category, PaymentMethod, TransactionType } from '@/types/finance';
import { TransactionItem } from '@/components/dashboard/TransactionItem';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatMonthYear } from '@/lib/formatters';
import { PaymentMethodIcon, CategoryIcon } from '@/components/icons/CategoryIcon';
import { Label } from '@/components/ui/label';

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onTransactionClick: (transaction: Transaction) => void;
}

const normalize = (value: string) => value.toLowerCase().trim();

export function TransactionsView({
  transactions,
  categories,
  paymentMethods,
  onTransactionClick,
}: TransactionsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchItems, setSearchItems] = useState(false);

  const categoriesById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const paymentMethodsById = useMemo(() => new Map(paymentMethods.map((paymentMethod) => [paymentMethod.id, paymentMethod])), [paymentMethods]);

  const getCategoryById = (id: string) => categoriesById.get(id);
  const getPaymentMethodById = (id: string) => paymentMethodsById.get(id);

  const filteredTransactions = useMemo(() => {
    const query = normalize(searchQuery);

    return transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        const dateLabel = transactionDate.toLocaleDateString('pt-BR');
        const category = getCategoryById(t.categoryId);
        const payment = getPaymentMethodById(t.paymentMethodId);

        let matchesSearch = query.length === 0;

        if (query.length > 0) {
          const baseMatch = [
            t.description,
            t.notes || '',
            category?.name || '',
            payment?.name || '',
            dateLabel,
            t.type === 'expense' ? 'despesa' : 'receita',
          ].some(value => normalize(value).includes(query));

          const itemMatch = searchItems && t.items?.some(item => {
            const itemCategoryName = item.categoryId ? getCategoryById(item.categoryId)?.name || '' : '';
            return [item.name, item.brand || '', itemCategoryName].some(v => normalize(v).includes(query));
          });

          matchesSearch = baseMatch || Boolean(itemMatch);
        }

        const matchesType = typeFilter === 'all' || t.type === typeFilter;
        const matchesCategory = categoryFilter === 'all' || t.categoryId === categoryFilter || Boolean(t.items?.some(i => i.categoryId === categoryFilter));
        const matchesPaymentMethod = paymentMethodFilter === 'all' || t.paymentMethodId === paymentMethodFilter;

        let matchesDateFrom = true;
        let matchesDateTo = true;

        if (dateFrom) {
          matchesDateFrom = transactionDate >= new Date(dateFrom);
        }

        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999);
          matchesDateTo = transactionDate <= toDate;
        }

        return matchesSearch && matchesType && matchesCategory && matchesPaymentMethod && matchesDateFrom && matchesDateTo;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchQuery, searchItems, typeFilter, categoryFilter, paymentMethodFilter, dateFrom, dateTo, categoriesById, paymentMethodsById, getCategoryById, getPaymentMethodById]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach(t => {
      const monthKey = formatMonthYear(new Date(t.date));
      groups[monthKey] ||= [];
      groups[monthKey].push(t);
    });
    return groups;
  }, [filteredTransactions]);

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setPaymentMethodFilter('all');
    setDateFrom('');
    setDateTo('');
    setSearchItems(false);
  };

  const exportToCsv = () => {
    const headers = [
      'Data', 'Tipo', 'Descricao', 'Categoria', 'MeioPagamento', 'ValorTotal', 'Item', 'Marca', 'Qtd', 'ValorUnitario', 'DescontoR$', 'Desconto%', 'AcrescimoR$', 'Acrescimo%', 'CategoriaItem', 'TotalItem', 'Observacoes',
    ];

    const rows: string[][] = [];

    filteredTransactions.forEach(t => {
      const base = [
        new Date(t.date).toISOString().split('T')[0],
        t.type,
        t.description,
        getCategoryById(t.categoryId)?.name || '',
        getPaymentMethodById(t.paymentMethodId)?.name || '',
        t.amount.toFixed(2),
      ];

      if (t.items?.length) {
        t.items.forEach(item => {
          rows.push([
            ...base,
            item.name,
            item.brand || '',
            String(item.quantity),
            item.unitPrice.toFixed(2),
            (item.discount || 0).toFixed(2),
            (item.discountPercent || 0).toFixed(2),
            (item.surcharge || 0).toFixed(2),
            (item.surchargePercent || 0).toFixed(2),
            item.categoryId ? (getCategoryById(item.categoryId)?.name || '') : '',
            item.totalPrice.toFixed(2),
            t.notes || '',
          ]);
        });
      } else {
        rows.push([...base, '', '', '', '', '', '', '', '', '', '', t.notes || '']);
      }
    });

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-app-pro-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters = searchQuery || typeFilter !== 'all' || categoryFilter !== 'all' || paymentMethodFilter !== 'all' || dateFrom || dateTo;
  const activeFiltersCount = [typeFilter !== 'all', categoryFilter !== 'all', paymentMethodFilter !== 'all', dateFrom, dateTo].filter(Boolean).length;

  return (
    <div className="pb-32">
      <div className="sticky top-0 bg-background z-20 pb-4">
        <h1 className="text-2xl font-bold text-foreground mb-4 animate-fade-in">Extrato</h1>

        <div className="relative mb-3">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchItems ? 'Buscar descrição, item, marca, data, categoria...' : 'Buscar lançamentos...'}
            className="pl-11 h-12 bg-card"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => setSearchItems(!searchItems)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${searchItems ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            Busca completa (itens e marcas)
          </button>
          <Button variant="outline" size="sm" onClick={exportToCsv} className="ml-auto">
            <Download size={14} className="mr-1" /> Exportar CSV
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant={showFilters ? 'default' : 'outline'} size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
            <Filter size={14} />
            Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">Limpar filtros</Button>
          )}
        </div>

        {showFilters && (
          <div className="mt-3 p-4 bg-card rounded-xl border border-border space-y-4 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="income">Receitas</SelectItem>
                    <SelectItem value="expense">Despesas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Categoria</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="bg-background"><SelectValue placeholder="Categoria" /></SelectTrigger>
                  <SelectContent className="bg-popover max-h-60">
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2"><CategoryIcon name={cat.icon} size={14} /><span>{cat.name}</span></div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><CreditCard size={12} /> Meio de Pagamento</Label>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Todos os meios" /></SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">Todos</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      <div className="flex items-center gap-2"><PaymentMethodIcon type={method.type} size={14} /><span>{method.name}</span></div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5"><Calendar size={12} /> Período</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="bg-background" />
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="bg-background" />
              </div>
            </div>
          </div>
        )}
      </div>

      {hasActiveFilters && (
        <div className="text-sm text-muted-foreground mb-4">
          {filteredTransactions.length} {filteredTransactions.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}
        </div>
      )}

      {Object.keys(groupedTransactions).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground animate-fade-in"><p>Nenhum lançamento encontrado</p></div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([month, monthTransactions]) => (
            <div key={month} className="animate-fade-in">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 capitalize">{month}</h3>
              <div className="bg-card rounded-2xl overflow-hidden shadow-soft">
                {monthTransactions.map((transaction, index) => (
                  <div key={transaction.id}>
                    <TransactionItem
                      transaction={transaction}
                      category={getCategoryById(transaction.categoryId)}
                      paymentMethod={getPaymentMethodById(transaction.paymentMethodId)}
                      categories={categories}
                      onClick={() => onTransactionClick(transaction)}
                      showDetails
                    />
                    {index < monthTransactions.length - 1 && <div className="h-px bg-border mx-4" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
