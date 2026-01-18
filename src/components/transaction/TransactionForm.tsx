import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Transaction, TransactionType, TransactionItem, Category, PaymentMethod } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryIcon, PaymentMethodIcon } from '@/components/icons/CategoryIcon';
import { TransactionItemsEditor } from './TransactionItemsEditor';
import { cn } from '@/lib/utils';

interface TransactionFormProps {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  transaction?: Transaction | null;
  onSave: (data: Omit<Transaction, 'id'>) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function TransactionForm({
  categories,
  paymentMethods,
  transaction,
  onSave,
  onDelete,
  onClose,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(transaction?.type || 'expense');
  const [description, setDescription] = useState(transaction?.description || '');
  const [amount, setAmount] = useState(transaction?.amount?.toString() || '');
  const [categoryId, setCategoryId] = useState(transaction?.categoryId || '');
  const [paymentMethodId, setPaymentMethodId] = useState(transaction?.paymentMethodId || '');
  const [date, setDate] = useState(
    transaction?.date 
      ? new Date(transaction.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(transaction?.notes || '');
  const [items, setItems] = useState<TransactionItem[]>(transaction?.items || []);

  const filteredCategories = categories.filter(c => c.type === type);

  // For expenses: items are required and category comes from items
  // For income: category selector is shown (no items)
  const isExpense = type === 'expense';
  
  // Validation for expenses: must have items and all items must have categories
  const itemsValid = !isExpense || (items.length > 0 && items.every(item => item.categoryId));

  useEffect(() => {
    // Reset category when type changes if current category doesn't match
    const currentCategory = categories.find(c => c.id === categoryId);
    if (currentCategory && currentCategory.type !== type) {
      setCategoryId('');
    }
    // Clear items when switching to income
    if (type === 'income') {
      setItems([]);
    }
  }, [type, categoryId, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For expenses: require items with categories
    if (isExpense) {
      if (items.length === 0) {
        return;
      }
      if (!items.every(item => item.categoryId)) {
        return;
      }
    }
    
    // For income: require category
    if (!isExpense && !categoryId) {
      return;
    }

    if (!description || !amount || !paymentMethodId) {
      return;
    }

    // For expenses, use the first item's category as the "main" category (for backwards compatibility)
    // The real category breakdown comes from items
    const mainCategoryId = isExpense 
      ? (items[0]?.categoryId || categoryId) 
      : categoryId;

    onSave({
      description,
      amount: parseFloat(amount),
      type,
      date: new Date(date),
      categoryId: mainCategoryId,
      paymentMethodId,
      notes: notes || undefined,
      items: isExpense && items.length > 0 ? items : undefined,
    });
  };

  const handleAmountChange = (value: string) => {
    // Allow only numbers and one decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(cleaned);
  };

  const handleTotalChange = (total: number) => {
    setAmount(total.toFixed(2));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div 
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full sm:max-w-lg bg-card rounded-t-3xl sm:rounded-2xl shadow-soft-xl animate-slide-up sm:animate-scale-in max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-card z-10 px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              {transaction ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X size={20} />
            </Button>
          </div>

          {/* Type Toggle */}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={cn(
                "flex-1 py-3 rounded-xl font-medium transition-all duration-200",
                type === 'expense'
                  ? "bg-destructive text-destructive-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={cn(
                "flex-1 py-3 rounded-xl font-medium transition-all duration-200",
                type === 'income'
                  ? "bg-success text-success-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              Receita
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-muted-foreground">Valor Total</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0,00"
                className="pl-12 text-2xl font-semibold h-14"
                required
              />
            </div>
          </div>

          {/* Items Editor (Cupom Fiscal) - ONLY for expenses and REQUIRED */}
          {isExpense && (
            <TransactionItemsEditor
              items={items}
              onChange={setItems}
              totalAmount={parseFloat(amount) || 0}
              onTotalChange={handleTotalChange}
              categories={categories}
              required={true}
            />
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-muted-foreground">Descrição</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Compras no supermercado"
              className="h-12"
              required
            />
          </div>

          {/* Category - ONLY for income */}
          {!isExpense && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger className="h-12 bg-background">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent className="bg-popover max-h-60">
                  {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-3">
                        <CategoryIcon name={category.icon} size={18} />
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Payment Method */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Meio de Pagamento</Label>
            <Select value={paymentMethodId} onValueChange={setPaymentMethodId} required>
              <SelectTrigger className="h-12 bg-background">
                <SelectValue placeholder="Selecione o meio de pagamento" />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    <div className="flex items-center gap-3">
                      <PaymentMethodIcon type={method.type} size={18} />
                      <span>{method.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-muted-foreground">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-12"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-muted-foreground">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes adicionais..."
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            {transaction && onDelete && (
              <Button
                type="button"
                variant="outline"
                onClick={onDelete}
                className="flex-1 h-12 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                Excluir
              </Button>
            )}
            <Button
              type="submit"
              disabled={!itemsValid}
              className={cn(
                "flex-1 h-12 font-semibold",
                type === 'income' ? "bg-success hover:bg-success/90" : ""
              )}
            >
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
