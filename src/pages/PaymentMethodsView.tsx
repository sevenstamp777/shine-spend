import { useState } from 'react';
import { Plus, Trash2, Pencil, X, CreditCard } from 'lucide-react';
import { PaymentMethod, PaymentMethodType } from '@/types/finance';
import { PaymentMethodIcon } from '@/components/icons/CategoryIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface PaymentMethodsViewProps {
  paymentMethods: PaymentMethod[];
  onAddPaymentMethod: (method: Omit<PaymentMethod, 'id'>) => void;
  onUpdatePaymentMethod: (id: string, method: Partial<PaymentMethod>) => void;
  onDeletePaymentMethod: (id: string) => void;
}

export function PaymentMethodsView({
  paymentMethods,
  onAddPaymentMethod,
  onUpdatePaymentMethod,
  onDeletePaymentMethod,
}: PaymentMethodsViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [type, setType] = useState<PaymentMethodType>('bank_account');
  const [limit, setLimit] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');

  const creditCards = paymentMethods.filter(m => m.type === 'credit_card');
  const otherMethods = paymentMethods.filter(m => m.type !== 'credit_card');

  const openEditForm = (method: PaymentMethod) => {
    setEditingMethod(method);
    setName(method.name);
    setType(method.type);
    setLimit(method.limit?.toString() || '');
    setClosingDay(method.closingDay?.toString() || '');
    setDueDay(method.dueDay?.toString() || '');
    setShowForm(true);
  };

  const openNewForm = () => {
    setEditingMethod(null);
    setName('');
    setType('bank_account');
    setLimit('');
    setClosingDay('');
    setDueDay('');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const methodData = {
      name,
      type,
      limit: type === 'credit_card' && limit ? parseFloat(limit) : undefined,
      closingDay: type === 'credit_card' && closingDay ? parseInt(closingDay) : undefined,
      dueDay: type === 'credit_card' && dueDay ? parseInt(dueDay) : undefined,
    };

    if (editingMethod) {
      onUpdatePaymentMethod(editingMethod.id, methodData);
    } else {
      onAddPaymentMethod(methodData);
    }

    resetForm();
  };

  const resetForm = () => {
    setName('');
    setType('bank_account');
    setLimit('');
    setClosingDay('');
    setDueDay('');
    setShowForm(false);
    setEditingMethod(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      onDeletePaymentMethod(deleteId);
      setDeleteId(null);
    }
  };

  const getTypeLabel = (type: PaymentMethodType) => {
    switch (type) {
      case 'credit_card': return 'Cartão de Crédito';
      case 'cash': return 'Dinheiro';
      case 'bank_account': return 'Conta/PIX';
    }
  };

  return (
    <div className="pb-32">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground animate-fade-in">Meios de Pagamento</h1>
        <Button
          onClick={openNewForm}
          size="sm"
          className="gap-2"
        >
          <Plus size={18} />
          Novo
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 mb-6 shadow-soft animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">
              {editingMethod ? 'Editar Meio de Pagamento' : 'Novo Meio de Pagamento'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Cartão Itaú"
                className="h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as PaymentMethodType)}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="bank_account">Conta/PIX</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {type === 'credit_card' && (
              <>
                <div className="space-y-2">
                  <Label>Limite</Label>
                  <Input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    placeholder="5000"
                    className="h-11"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Dia de Fechamento</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={closingDay}
                      onChange={(e) => setClosingDay(e.target.value)}
                      placeholder="15"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dia de Vencimento</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={dueDay}
                      onChange={(e) => setDueDay(e.target.value)}
                      placeholder="22"
                      className="h-11"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {editingMethod ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Credit Cards */}
      {creditCards.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Cartões de Crédito</h2>
          <div className="space-y-3">
            {creditCards.map((method) => (
              <div
                key={method.id}
                className="bg-card rounded-2xl p-4 shadow-soft animate-fade-in"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                      <CreditCard size={22} className="text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{method.name}</p>
                      <p className="text-sm text-muted-foreground">Cartão de Crédito</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditForm(method)}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteId(method.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                {(method.limit || method.closingDay || method.dueDay) && (
                  <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4 text-center">
                    {method.limit && (
                      <div>
                        <p className="text-xs text-muted-foreground">Limite</p>
                        <p className="font-semibold text-foreground">{formatCurrency(method.limit)}</p>
                      </div>
                    )}
                    {method.closingDay && (
                      <div>
                        <p className="text-xs text-muted-foreground">Fechamento</p>
                        <p className="font-semibold text-foreground">Dia {method.closingDay}</p>
                      </div>
                    )}
                    {method.dueDay && (
                      <div>
                        <p className="text-xs text-muted-foreground">Vencimento</p>
                        <p className="font-semibold text-foreground">Dia {method.dueDay}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Methods */}
      {otherMethods.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Outros</h2>
          <div className="bg-card rounded-2xl overflow-hidden shadow-soft">
            {otherMethods.map((method, index) => (
              <div key={method.id}>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      method.type === 'cash' ? "bg-warning/10" : "bg-primary/10"
                    )}>
                      <PaymentMethodIcon 
                        type={method.type} 
                        size={20} 
                        className={method.type === 'cash' ? "text-warning" : "text-primary"}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{method.name}</p>
                      <p className="text-xs text-muted-foreground">{getTypeLabel(method.type)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditForm(method)}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => setDeleteId(method.id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                {index < otherMethods.length - 1 && <div className="h-px bg-border mx-4" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir meio de pagamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Os lançamentos associados permanecerão no sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
