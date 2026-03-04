import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatMonthYear } from '@/lib/formatters';
import { Button } from '@/components/ui/button';

interface MonthSelectorProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const goToPreviousMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate);
  };

  const goToCurrentMonth = () => {
    onMonthChange(new Date());
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return (
      selectedMonth.getMonth() === now.getMonth() &&
      selectedMonth.getFullYear() === now.getFullYear()
    );
  };

  return (
    <div className="flex items-center justify-between animate-fade-in">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPreviousMonth}
          className="h-9 w-9 rounded-full"
        >
          <ChevronLeft size={20} />
        </Button>
        
        <button
          onClick={goToCurrentMonth}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-card hover:bg-accent transition-colors"
        >
          <Calendar size={18} className="text-primary" />
          <span className="font-semibold text-foreground capitalize">
            {formatMonthYear(selectedMonth)}
          </span>
        </button>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          className="h-9 w-9 rounded-full"
          disabled={isCurrentMonth()}
        >
          <ChevronRight size={20} />
        </Button>
      </div>

      {!isCurrentMonth() && (
        <Button
          variant="outline"
          size="sm"
          onClick={goToCurrentMonth}
          className="text-xs"
        >
          Mês atual
        </Button>
      )}
    </div>
  );
}
