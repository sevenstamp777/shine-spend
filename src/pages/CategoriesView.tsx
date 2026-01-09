import { useState } from 'react';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import { Category, TransactionType, ExpenseType } from '@/types/finance';
import { CategoryIcon } from '@/components/icons/CategoryIcon';
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
import { cn } from '@/lib/utils';

const availableIcons = [
  'Home', 'Building', 'Wifi', 'Play', 'Zap', 'Droplets',
  'Utensils', 'Car', 'Gamepad2', 'HeartPulse', 'ShoppingBag',
  'GraduationCap', 'Briefcase', 'Laptop', 'TrendingUp', 'Coins',
];

interface CategoriesViewProps {
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (id: string, category: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
}

export function CategoriesView({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: CategoriesViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [expenseType, setExpenseType] = useState<ExpenseType>('variable');
  const [icon, setIcon] = useState('Coins');

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  const openEditForm = (category: Category) => {
    setEditingCategory(category);
    setName(category.name);
    setType(category.type);
    setExpenseType(category.expenseType || 'variable');
    setIcon(category.icon);
    setShowForm(true);
  };

  const openNewForm = () => {
    setEditingCategory(null);
    setName('');
    setType('expense');
    setExpenseType('variable');
    setIcon('Coins');
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingCategory) {
      onUpdateCategory(editingCategory.id, {
        name,
        type,
        expenseType: type === 'expense' ? expenseType : undefined,
        icon,
      });
    } else {
      onAddCategory({
        name,
        type,
        expenseType: type === 'expense' ? expenseType : undefined,
        icon,
      });
    }

    resetForm();
  };

  const resetForm = () => {
    setName('');
    setType('expense');
    setExpenseType('variable');
    setIcon('Coins');
    setShowForm(false);
    setEditingCategory(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      onDeleteCategory(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="pb-32">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground animate-fade-in">Categorias</h1>
        <Button
          onClick={openNewForm}
          size="sm"
          className="gap-2"
        >
          <Plus size={18} />
          Nova
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 mb-6 shadow-soft animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
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
                placeholder="Ex: Academia"
                className="h-11"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as TransactionType)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="expense">Despesa</SelectItem>
                    <SelectItem value="income">Receita</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {type === 'expense' && (
                <div className="space-y-2">
                  <Label>Gasto</Label>
                  <Select value={expenseType} onValueChange={(v) => setExpenseType(v as ExpenseType)}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="fixed">Fixo</SelectItem>
                      <SelectItem value="variable">Variável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="grid grid-cols-8 gap-2">
                {availableIcons.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                      icon === iconName
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    <CategoryIcon name={iconName} size={18} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" className="flex-1">
                {editingCategory ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Expense Categories */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Despesas</h2>
        <div className="bg-card rounded-2xl overflow-hidden shadow-soft">
          {expenseCategories.map((category, index) => (
            <div key={category.id}>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-destructive-muted flex items-center justify-center">
                    <CategoryIcon name={category.icon} size={20} className="text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{category.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {category.expenseType === 'fixed' ? 'Gasto fixo' : 'Gasto variável'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditForm(category)}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => setDeleteId(category.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              {index < expenseCategories.length - 1 && <div className="h-px bg-border mx-4" />}
            </div>
          ))}
        </div>
      </div>

      {/* Income Categories */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">Receitas</h2>
        <div className="bg-card rounded-2xl overflow-hidden shadow-soft">
          {incomeCategories.map((category, index) => (
            <div key={category.id}>
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success-muted flex items-center justify-center">
                    <CategoryIcon name={category.icon} size={20} className="text-success" />
                  </div>
                  <p className="font-medium text-foreground">{category.name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditForm(category)}
                    className="p-2 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => setDeleteId(category.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              {index < incomeCategories.length - 1 && <div className="h-px bg-border mx-4" />}
            </div>
          ))}
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
            <AlertDialogDescription>
              Os lançamentos associados não serão excluídos, mas ficarão sem categoria.
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
