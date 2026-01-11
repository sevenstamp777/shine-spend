import { useState, useMemo } from 'react';
import { Search, Filter, X } from 'lucide-react';
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

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onTransactionClick: (transaction: Transaction) => void;
}

export function TransactionsView({
  transactions,
  categories,
  paymentMethods,
  onTransactionClick,
}: TransactionsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || t.type === typeFilter;
        const matchesCategory = categoryFilter === 'all' || t.categoryId === categoryFilter;
        return matchesSearch && matchesType && matchesCategory;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchQuery, typeFilter, categoryFilter]);

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    
    filteredTransactions.forEach(t => {
      const monthKey = formatMonthYear(new Date(t.date));
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(t);
    });

    return groups;
  }, [filteredTransactions]);

  const getCategoryById = (id: string) => categories.find(c => c.id === id);
  const getPaymentMethodById = (id: string) => paymentMethods.find(m => m.id === id);

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
  };

  const hasActiveFilters = searchQuery || typeFilter !== 'all' || categoryFilter !== 'all';

  return (
    <div className="pb-32">
      <div className="sticky top-0 bg-background z-20 pb-4">
        <h1 className="text-2xl font-bold text-foreground mb-4 animate-fade-in">Extrato</h1>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar lançamentos..."
            className="pl-11 h-12 bg-card"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter size={16} />
            Filtros
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground"
            >
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-2 gap-3 mt-3 animate-fade-in">
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="income">Receitas</SelectItem>
                <SelectItem value="expense">Despesas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                <SelectItem value="all">Todas</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Transaction Groups */}
      {Object.keys(groupedTransactions).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground animate-fade-in">
          <p>Nenhum lançamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([month, monthTransactions]) => (
            <div key={month} className="animate-fade-in">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 capitalize">
                {month}
              </h3>
              <div className="bg-card rounded-2xl overflow-hidden shadow-soft">
                {monthTransactions.map((transaction, index) => (
                  <div key={transaction.id}>
                    <TransactionItem
                      transaction={transaction}
                      category={getCategoryById(transaction.categoryId)}
                      paymentMethod={getPaymentMethodById(transaction.paymentMethodId)}
                      onClick={() => onTransactionClick(transaction)}
                      showDetails={true}
                    />
                    {index < monthTransactions.length - 1 && (
                      <div className="h-px bg-border mx-4" />
                    )}
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
