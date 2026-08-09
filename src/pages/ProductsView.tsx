import { useState } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { Product, Category } from '@/types/finance';
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

interface ProductsViewProps {
  products: Product[];
  categories: Category[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onDeleteProduct: (id: string) => void;
}

export function ProductsView({
  products,
  categories,
  onAddProduct,
  onDeleteProduct,
}: ProductsViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const expenseCategories = categories.filter(c => c.type === 'expense');

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onAddProduct({ name: name.trim(), categoryId: categoryId || undefined });
    setName('');
    setCategoryId('');
    setShowForm(false);
  };

  const getCategoryName = (id?: string) => {
    if (!id) return '';
    return categories.find(c => c.id === id)?.name || '';
  };

  return (
    <div className="pb-32">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground animate-fade-in">Produtos</h1>
        <Button onClick={() => setShowForm(true)} size="sm" className="gap-2">
          <Plus size={18} />
          Novo
        </Button>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar produto..."
          className="h-11 pl-10 bg-background"
        />
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-5 mb-6 shadow-soft animate-scale-in">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do produto</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Arroz parbolizado"
                className="h-11"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent className="bg-popover max-h-48">
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      <div className="bg-card rounded-2xl overflow-hidden shadow-soft">
        {filtered.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            Nenhum produto encontrado
          </p>
        )}
        {filtered.map((product, index) => (
          <div key={product.id}>
            <div className="flex items-center justify-between p-4">
              <div className="min-w-0">
                <p className="font-medium text-foreground truncate">{product.name}</p>
                {getCategoryName(product.categoryId) && (
                  <p className="text-xs text-muted-foreground">
                    {getCategoryName(product.categoryId)}
                  </p>
                )}
              </div>
              <button
                onClick={() => setDeleteId(product.id)}
                className="p-2 text-muted-foreground hover:text-destructive transition-colors shrink-0"
              >
                <Trash2 size={18} />
              </button>
            </div>
            {index < filtered.length - 1 && <div className="h-px bg-border mx-4" />}
          </div>
        ))}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir produto?</AlertDialogTitle>
            <AlertDialogDescription>
              O produto será removido do catálogo. Lançamentos existentes não são afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) onDeleteProduct(deleteId); setDeleteId(null); }} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
