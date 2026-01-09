import { LayoutDashboard, Receipt, Layers, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

type TabId = 'dashboard' | 'transactions' | 'categories' | 'payments';

interface BottomNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs = [
  { id: 'dashboard' as TabId, label: 'Início', icon: LayoutDashboard },
  { id: 'transactions' as TabId, label: 'Extrato', icon: Receipt },
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
                "flex flex-col items-center py-3 px-4 transition-all duration-200",
                "min-w-[64px]",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-all duration-200",
                isActive && "bg-primary/10"
              )}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                "text-xs mt-1 font-medium transition-all",
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
