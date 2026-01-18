import { useState } from 'react';
import { Plus, Trash2, Tag, Percent } from 'lucide-react';
import { TransactionItem, Category } from '@/types/finance';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/formatters';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategoryIcon } from '@/components/icons/CategoryIcon';

interface TransactionItemsEditorProps {
  items: TransactionItem[];
  onChange: (items: TransactionItem[]) => void;
  totalAmount: number;
  onTotalChange: (total: number) => void;
  categories: Category[];
  required?: boolean; // For expenses, items are required
}

export function TransactionItemsEditor({
  items,
  onChange,
  totalAmount,
  onTotalChange,
  categories,
  required = false,
}: TransactionItemsEditorProps) {
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDiscount, setNewItemDiscount] = useState('');
  const [newItemCategoryId, setNewItemCategoryId] = useState('');

  // Filter only expense categories for items
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const calculateItemTotal = (qty: number, price: number, discount: number) => {
    const subtotal = qty * price;
    return Math.max(0, subtotal - discount);
  };

  const itemsTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const difference = totalAmount - itemsTotal;

  // Check if all items have categories
  const allItemsHaveCategory = items.every(item => item.categoryId);

  const handleAddItem = () => {
    if (!newItemName || !newItemPrice || !newItemCategoryId) return;

    const qty = parseFloat(newItemQty) || 1;
    const price = parseFloat(newItemPrice) || 0;
    const discount = parseFloat(newItemDiscount) || 0;

    const newItem: TransactionItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      quantity: qty,
      unitPrice: price,
      discount: discount > 0 ? discount : undefined,
      totalPrice: calculateItemTotal(qty, price, discount),
      categoryId: newItemCategoryId,
    };

    onChange([...items, newItem]);
    setNewItemName('');
    setNewItemQty('1');
    setNewItemPrice('');
    setNewItemDiscount('');
    setNewItemCategoryId('');

    // Auto-update total if needed
    if (items.length === 0) {
      onTotalChange(newItem.totalPrice);
    }
  };

  const handleRemoveItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof TransactionItem, value: string) => {
    onChange(items.map(item => {
      if (item.id !== id) return item;

      const updated = { ...item };
      
      if (field === 'name') {
        updated.name = value;
      } else if (field === 'quantity') {
        updated.quantity = parseFloat(value) || 0;
        updated.totalPrice = calculateItemTotal(updated.quantity, updated.unitPrice, updated.discount || 0);
      } else if (field === 'unitPrice') {
        updated.unitPrice = parseFloat(value) || 0;
        updated.totalPrice = calculateItemTotal(updated.quantity, updated.unitPrice, updated.discount || 0);
      } else if (field === 'discount') {
        updated.discount = parseFloat(value) || 0;
        updated.totalPrice = calculateItemTotal(updated.quantity, updated.unitPrice, updated.discount || 0);
      } else if (field === 'categoryId') {
        updated.categoryId = value || undefined;
      }

      return updated;
    }));
  };

  const handleSyncTotal = () => {
    onTotalChange(itemsTotal);
  };

  const getCategoryById = (id: string | undefined) => {
    if (!id) return null;
    return categories.find(c => c.id === id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Itens do cupom fiscal {required && <span className="text-destructive">*</span>}
        </span>
        {items.length > 0 && (
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {items.length} {items.length === 1 ? 'item' : 'itens'}
          </span>
        )}
      </div>

      {required && items.length === 0 && (
        <p className="text-xs text-destructive">
          Adicione pelo menos um item para salvar a despesa
        </p>
      )}

      {required && items.length > 0 && !allItemsHaveCategory && (
        <p className="text-xs text-destructive">
          Todos os itens devem ter uma categoria
        </p>
      )}

      <div className="bg-muted/30 rounded-xl p-4 space-y-4 border border-border">
        {/* Items List */}
        {items.length > 0 && (
          <div className="space-y-3">
            {items.map((item, index) => {
              const itemCategory = getCategoryById(item.categoryId);
              const missingCategory = required && !item.categoryId;
              return (
                <div
                  key={item.id}
                  className={`bg-background rounded-lg p-3 space-y-2 ${missingCategory ? 'ring-2 ring-destructive' : ''}`}
                >
                  {/* Row 1: Name and Remove */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5">
                      {index + 1}.
                    </span>
                    <Input
                      value={item.name}
                      onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                      placeholder="Nome do item"
                      className="flex-1 h-8 text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(item.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  {/* Row 2: Category (REQUIRED) */}
                  <div className="flex items-center gap-2 pl-7">
                    <Tag size={14} className={`shrink-0 ${missingCategory ? 'text-destructive' : 'text-muted-foreground'}`} />
                    <Select 
                      value={item.categoryId || ''} 
                      onValueChange={(v) => handleUpdateItem(item.id, 'categoryId', v)}
                    >
                      <SelectTrigger className={`h-8 text-sm flex-1 ${missingCategory ? 'border-destructive bg-destructive/10' : 'bg-muted/50'}`}>
                        <SelectValue placeholder="Selecione a categoria *">
                          {itemCategory ? (
                            <div className="flex items-center gap-2">
                              <CategoryIcon name={itemCategory.icon} size={14} />
                              <span>{itemCategory.name}</span>
                            </div>
                          ) : (
                            <span className="text-destructive">Selecione a categoria *</span>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-popover max-h-48">
                        {expenseCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <CategoryIcon name={cat.icon} size={14} />
                              <span>{cat.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Row 3: Qty, Price, Discount, Total */}
                  <div className="flex items-center gap-2 pl-7">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                      className="w-14 h-8 text-sm text-center"
                      min="0"
                      step="0.01"
                      title="Quantidade"
                    />
                    <span className="text-muted-foreground text-sm">×</span>
                    <div className="relative w-20">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        R$
                      </span>
                      <Input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItem(item.id, 'unitPrice', e.target.value)}
                        className="h-8 text-sm pl-7"
                        min="0"
                        step="0.01"
                        title="Preço unitário"
                      />
                    </div>
                    <div className="relative w-20">
                      <Percent size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type="number"
                        value={item.discount || ''}
                        onChange={(e) => handleUpdateItem(item.id, 'discount', e.target.value)}
                        className="h-8 text-sm pl-7 text-green-600"
                        min="0"
                        step="0.01"
                        placeholder="Desc."
                        title="Desconto em R$"
                      />
                    </div>
                    <span className="text-sm font-medium w-20 text-right">
                      {formatCurrency(item.totalPrice)}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Items Summary */}
            <div className="space-y-1 pt-2 border-t border-border mt-2">
              {totalDiscount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">
                    Total de descontos:
                  </span>
                  <span className="font-medium text-green-600">
                    -{formatCurrency(totalDiscount)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Subtotal dos itens:
                </span>
                <span className="font-semibold">
                  {formatCurrency(itemsTotal)}
                </span>
              </div>
            </div>

            {Math.abs(difference) > 0.01 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-amber-600 dark:text-amber-400">
                  Diferença com valor total:
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSyncTotal}
                    className="h-6 text-xs"
                  >
                    Sincronizar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add New Item */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Adicionar item:</div>
          
          {/* Name input */}
          <div className="flex gap-2">
            <Input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Nome do item"
              className="flex-1 h-9"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem())}
            />
          </div>

          {/* Category select (REQUIRED - first position) */}
          <div className="flex gap-2">
            <Select value={newItemCategoryId} onValueChange={setNewItemCategoryId}>
              <SelectTrigger className={`flex-1 h-9 bg-background ${!newItemCategoryId && newItemName ? 'border-amber-500' : ''}`}>
                <SelectValue placeholder="Categoria do item *">
                  {newItemCategoryId ? (
                    <div className="flex items-center gap-2">
                      <CategoryIcon name={getCategoryById(newItemCategoryId)?.icon || ''} size={14} />
                      <span>{getCategoryById(newItemCategoryId)?.name}</span>
                    </div>
                  ) : (
                    'Categoria do item *'
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-popover max-h-48">
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <CategoryIcon name={cat.icon} size={14} />
                      <span>{cat.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Qty, Price, Discount */}
          <div className="flex gap-2">
            <Input
              type="number"
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
              placeholder="Qtd"
              className="w-16 h-9 text-center"
              min="0"
              step="0.01"
            />
            <div className="relative flex-1">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                R$
              </span>
              <Input
                type="number"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                placeholder="Preço"
                className="h-9 pl-7"
                min="0"
                step="0.01"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddItem())}
              />
            </div>
            <div className="relative w-24">
              <Percent size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="number"
                value={newItemDiscount}
                onChange={(e) => setNewItemDiscount(e.target.value)}
                placeholder="Desc."
                className="h-9 pl-7"
                min="0"
                step="0.01"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={handleAddItem}
              className="h-9 w-9 shrink-0"
              disabled={!newItemName || !newItemPrice || !newItemCategoryId}
            >
              <Plus size={16} />
            </Button>
          </div>
          
          {newItemName && newItemPrice && !newItemCategoryId && (
            <p className="text-xs text-amber-600">
              Selecione uma categoria para adicionar o item
            </p>
          )}
        </div>

        {items.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Adicione itens para detalhar sua compra como um cupom fiscal
          </p>
        )}
      </div>
    </div>
  );
}
