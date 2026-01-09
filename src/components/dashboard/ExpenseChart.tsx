import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CategoryExpense } from '@/types/finance';
import { formatCurrency, formatPercentage } from '@/lib/formatters';
import { CategoryIcon } from '@/components/icons/CategoryIcon';

interface ExpenseChartProps {
  data: CategoryExpense[];
}

export function ExpenseChart({ data }: ExpenseChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-soft animate-fade-in stagger-2">
        <h3 className="font-semibold text-foreground mb-4">Despesas por Categoria</h3>
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          <p>Nenhuma despesa este mês</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.categoryName}</p>
          <p className="text-sm text-muted-foreground">{formatCurrency(data.amount)}</p>
          <p className="text-xs text-muted-foreground">{formatPercentage(data.percentage)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-soft animate-fade-in stagger-2">
      <h3 className="font-semibold text-foreground mb-4">Despesas por Categoria</h3>
      
      <div className="flex flex-col lg:flex-row items-center gap-6">
        <div className="w-48 h-48 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="amount"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 w-full space-y-3">
          {data.slice(0, 5).map((item, index) => (
            <div 
              key={item.categoryId} 
              className="flex items-center gap-3 animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${item.color}20`, color: item.color }}
              >
                <CategoryIcon name={item.categoryIcon} size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-foreground truncate">
                    {item.categoryName}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {formatPercentage(item.percentage)}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${item.percentage}%`,
                      backgroundColor: item.color 
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
