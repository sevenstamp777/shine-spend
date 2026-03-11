import { useState } from 'react';
import { Plus, Trash2, Tag } from 'lucide-react';
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
  required?: boolean;
}

const calcTotal = (
  quantity: number,
  unitPrice: number,
  discount = 0,
  discountPercent = 0,
  surcharge = 0,
  surchargePercent = 0,
) => {
  const subtotal = quantity * unitPrice;
  const discountByPercent = subtotal * (discountPercent / 100);
  const surchargeByPercent = subtotal * (surchargePercent / 100);
  return Math.max(0, subtotal - discount - discountByPercent + surcharge + surchargeByPercent);
};

export function TransactionItemsEditor({
  items,
  onChange,
  totalAmount,
  onTotalChange,
  categories,
  required = false,
}: TransactionItemsEditorProps) {
  const [newItemName, setNewItemName] = useState('');
  const [newItemBrand, setNewItemBrand] = useState('');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemDiscount, setNewItemDiscount] = useState('');
  const [newItemDiscountPercent, setNewItemDiscountPercent] = useState('');
  const [newItemSurcharge, setNewItemSurcharge] = useState('');
  const [newItemSurchargePercent, setNewItemSurchargePercent] = useState('');
  const [newItemCategoryId, setNewItemCategoryId] = useState('');

  const expenseCategories = categories.filter(c => c.type === 'expense');

  const itemsTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const difference = totalAmount - itemsTotal;
  const allItemsHaveCategory = items.every(item => item.categoryId);

  const handleAddItem = () => {
    if (!newItemName || !newItemPrice || !newItemCategoryId) return;

    const qty = parseFloat(newItemQty) || 1;
    const price = parseFloat(newItemPrice) || 0;
    const discount = parseFloat(newItemDiscount) || 0;
    const discountPercent = parseFloat(newItemDiscountPercent) || 0;
    const surcharge = parseFloat(newItemSurcharge) || 0;
    const surchargePercent = parseFloat(newItemSurchargePercent) || 0;

    const newItem: TransactionItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      brand: newItemBrand.trim() || undefined,
      quantity: qty,
      unitPrice: price,
      discount: discount > 0 ? discount : undefined,
      discountPercent: discountPercent > 0 ? discountPercent : undefined,
      surcharge: surcharge > 0 ? surcharge : undefined,
      surchargePercent: surchargePercent > 0 ? surchargePercent : undefined,
      totalPrice: calcTotal(qty, price, discount, discountPercent, surcharge, surchargePercent),
      categoryId: newItemCategoryId,
    };

    onChange([...items, newItem]);
    setNewItemName('');
    setNewItemBrand('');
    setNewItemQty('1');
    setNewItemPrice('');
    setNewItemDiscount('');
    setNewItemDiscountPercent('');
    setNewItemSurcharge('');
    setNewItemSurchargePercent('');
    setNewItemCategoryId('');

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
      const numberValue = parseFloat(value) || 0;

      if (field === 'name') updated.name = value;
      if (field === 'brand') updated.brand = value || undefined;
      if (field === 'quantity') updated.quantity = numberValue;
      if (field === 'unitPrice') updated.unitPrice = numberValue;
      if (field === 'discount') updated.discount = numberValue || undefined;
      if (field === 'discountPercent') updated.discountPercent = numberValue || undefined;
      if (field === 'surcharge') updated.surcharge = numberValue || undefined;
      if (field === 'surchargePercent') updated.surchargePercent = numberValue || undefined;
      if (field === 'categoryId') updated.categoryId = value || undefined;

      updated.totalPrice = calcTotal(
        updated.quantity,
        updated.unitPrice,
        updated.discount || 0,
        updated.discountPercent || 0,
        updated.surcharge || 0,
        updated.surchargePercent || 0,
      );

      return updated;
    }));
  };

  const getCategoryById = (id: string | undefined) => {
    if (!id) return null;
    return categories.find(c => c.id === id);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Itens da nota {required && <span className="text-destructive">*</span>}
        </span>
      </div>

      <div className="bg-muted/30 rounded-xl p-4 space-y-4 border border-border">
        {items.length > 0 && (
          <div className="space-y-3">
            {items.map((item, index) => {
              const itemCategory = getCategoryById(item.categoryId);
              const missingCategory = required && !item.categoryId;
              return (
                <div key={item.id} className={`bg-background rounded-lg p-3 space-y-2 ${missingCategory ? 'ring-2 ring-destructive' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5">{index + 1}.</span>
                    <Input value={item.name} onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)} placeholder="Nome do item" className="flex-1 h-8 text-sm" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  <div className="pl-7">
                    <Input value={item.brand || ''} onChange={(e) => handleUpdateItem(item.id, 'brand', e.target.value)} placeholder="Marca (opcional)" className="h-8 text-sm" />
                  </div>

                  <div className="flex items-center gap-2 pl-7">
                    <Tag size={14} className={`shrink-0 ${missingCategory ? 'text-destructive' : 'text-muted-foreground'}`} />
                    <Select value={item.categoryId || ''} onValueChange={(v) => handleUpdateItem(item.id, 'categoryId', v)}>
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

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pl-7">
                    <Input type="number" value={item.quantity} onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)} min="0" step="0.01" className="h-8 text-sm" placeholder="Qtd" />
                    <Input type="number" value={item.unitPrice} onChange={(e) => handleUpdateItem(item.id, 'unitPrice', e.target.value)} min="0" step="0.01" className="h-8 text-sm" placeholder="Unit. R$" />
                    <Input type="number" value={item.discount || ''} onChange={(e) => handleUpdateItem(item.id, 'discount', e.target.value)} min="0" step="0.01" className="h-8 text-sm" placeholder="Desc. R$" />
                    <Input type="number" value={item.discountPercent || ''} onChange={(e) => handleUpdateItem(item.id, 'discountPercent', e.target.value)} min="0" step="0.01" className="h-8 text-sm" placeholder="Desc. %" />
                    <Input type="number" value={item.surcharge || ''} onChange={(e) => handleUpdateItem(item.id, 'surcharge', e.target.value)} min="0" step="0.01" className="h-8 text-sm" placeholder="Acr. R$" />
                    <Input type="number" value={item.surchargePercent || ''} onChange={(e) => handleUpdateItem(item.id, 'surchargePercent', e.target.value)} min="0" step="0.01" className="h-8 text-sm" placeholder="Acr. %" />
                    <div className="col-span-2 text-sm font-medium text-right self-center">
                      {formatCurrency(item.totalPrice)}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total itens:</span>
                <span className="font-semibold">{formatCurrency(itemsTotal)}</span>
              </div>
              {Math.abs(difference) > 0.01 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Diferença para valor total:</span>
                  <span>{formatCurrency(difference)}</span>
                </div>
              )}
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => onTotalChange(itemsTotal)}>
                  Sincronizar valor total
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 pt-2 border-t border-border">
          <Input value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Nome do item *" className="h-9 text-sm" />
          <Input value={newItemBrand} onChange={(e) => setNewItemBrand(e.target.value)} placeholder="Marca (opcional)" className="h-9 text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" value={newItemQty} onChange={(e) => setNewItemQty(e.target.value)} min="0" step="0.01" className="h-9 text-sm" placeholder="Qtd" />
            <Input type="number" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)} min="0" step="0.01" className="h-9 text-sm" placeholder="Unit. R$ *" />
            <Input type="number" value={newItemDiscount} onChange={(e) => setNewItemDiscount(e.target.value)} min="0" step="0.01" className="h-9 text-sm" placeholder="Desc. R$" />
            <Input type="number" value={newItemDiscountPercent} onChange={(e) => setNewItemDiscountPercent(e.target.value)} min="0" step="0.01" className="h-9 text-sm" placeholder="Desc. %" />
            <Input type="number" value={newItemSurcharge} onChange={(e) => setNewItemSurcharge(e.target.value)} min="0" step="0.01" className="h-9 text-sm" placeholder="Acr. R$" />
            <Input type="number" value={newItemSurchargePercent} onChange={(e) => setNewItemSurchargePercent(e.target.value)} min="0" step="0.01" className="h-9 text-sm" placeholder="Acr. %" />
          </div>
          <Select value={newItemCategoryId} onValueChange={setNewItemCategoryId}>
            <SelectTrigger className="h-9 text-sm bg-background">
              <SelectValue placeholder="Categoria do item *" />
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

          <Button type="button" onClick={handleAddItem} className="w-full h-9" variant="outline">
            <Plus size={16} className="mr-2" />
            Adicionar item
          </Button>
        </div>

        {required && items.length > 0 && !allItemsHaveCategory && (
          <p className="text-xs text-destructive">Todos os itens devem ter uma categoria.</p>
        )}
      </div>
    </div>
  );
}
