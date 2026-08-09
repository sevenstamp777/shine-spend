import { useState } from 'react';
import { Pencil, Trash2, X, TrendingUp } from 'lucide-react';
import { Category, Budget, Transaction } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/formatters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface BudgetsViewProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  onAddBudget: (budget: { categoryId: string; categoryName: string; limit: number }) => void;
  onDeleteBudget: (categoryId: string) => void;
}

export function BudgetsView({
  budgets,
  categories,
  transactions,
  onAddBudget,
  onDeleteBudget,
}: BudgetsViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [limit, setLimit] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const expenseCategories = categories.filter(c => c.type === 'expense');

  const spentInCurrentMonth = (categoryId: string) => {
    const now = new Date();
    return transactions
      .filter(t =>
        t.type === 'expense' &&
        t.categoryId === categoryId &&
        new Date(t.date).getMonth() === now.getMonth() &&
        new Date(t.date).getFullYear() === now.getFullYear()
      )
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categories.find(c => c.id === categoryId);
    if (!cat || !limit) return;
    onAddBudget({
      categoryId: cat.id,
      categoryName: cat.name,
      limit: parseFloat(limit),
    });
    setCategoryId('');
    setLimit('');
    setShowForm(false);
  };

  const sorted = [...budgets].sort((a, b) => b.limit - a.limit);

  return (
    <div className="pb-32">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground animate-fade-in">Orçamento</h1>
        <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
          <Pencil size={16} />
          Definir
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 mb-6 shadow-soft animate-scale-in">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="bg-popover max-h-48">
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Limite mensal (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                placeholder="0,00"
                className="h-11"
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">Salvar</Button>
            </div>
          </div>
        </form>
      )}

      {sorted.length === 0 && (
        <div className="bg-card rounded-2xl p-8 shadow-soft text-center">
          <TrendingUp size={40} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">
            Defina limites de gasto por categoria para acompanhar seu orçamento mensal.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {sorted.map((budget) => {
          const spent = spentInCurrentMonth(budget.categoryId);
          const pct = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
          const status = pct >= 100 ? 'destructive' : pct >= 80 ? 'warning' : 'success';
          return (
            <div key={budget.categoryId} className="bg-card rounded-2xl p-5 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{budget.categoryName}</p>
                  <button
                    onClick={() => setDeleteId(budget.categoryId)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(spent)} / {formatCurrency(budget.limit)}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    status === 'destructive' && "bg-destructive",
                    status === 'warning' && "bg-amber-500",
                    status === 'success' && "bg-success"
                  )}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className={cn(
                  "text-xs font-medium",
                  status === 'destructive' && "text-destructive",
                  status === 'warning' && "text-amber-500",
                  status === 'success' && "text-success"
                )}>
                  {pct >= 100 ? 'Estourado' : pct >= 80 ? 'Atenção' : 'OK'} · {pct.toFixed(0)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(Math.max(0, budget.limit - spent))} restantes
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover orçamento?</AlertDialogTitle>
            <AlertDialogDescription>
              O limite desta categoria será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) onDeleteBudget(deleteId); setDeleteId(null); }} className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
