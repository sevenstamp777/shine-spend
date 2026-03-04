import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingActionButtonProps {
  onClick: () => void;
  className?: string;
}

export function FloatingActionButton({ onClick, className }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-24 right-6 z-40",
        "w-14 h-14 rounded-full",
        "bg-primary text-primary-foreground",
        "shadow-lg shadow-primary/30",
        "flex items-center justify-center",
        "transition-all duration-200",
        "hover:scale-110 hover:shadow-xl hover:shadow-primary/40",
        "active:scale-95",
        "animate-float",
        className
      )}
      aria-label="Adicionar lançamento"
    >
      <Plus size={26} strokeWidth={2.5} />
    </button>
  );
}
