import { LayoutDashboard, Receipt, Layers, CreditCard, Package, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabId = 'dashboard' | 'transactions' | 'categories' | 'payments' | 'products' | 'budgets';

interface BottomNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs = [
  { id: 'dashboard' as TabId, label: 'Início', icon: LayoutDashboard },
  { id: 'transactions' as TabId, label: 'Extrato', icon: Receipt },
  { id: 'products' as TabId, label: 'Produtos', icon: Package },
  { id: 'budgets' as TabId, label: 'Orçamento', icon: Target },
  { id: 'categories' as TabId, label: 'Categorias', icon: Layers },
  { id: 'payments' as TabId, label: 'Pagamentos', icon: CreditCard },
];

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border px-2 pb-safe">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center py-2.5 px-1 transition-all duration-200",
                "flex-1 min-w-0"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-200",
                isActive && "bg-primary/10"
              )}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                "text-[11px] mt-1 font-medium truncate max-w-full transition-all",
                isActive && "text-primary"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
