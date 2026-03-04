import { User } from 'lucide-react';

export function Header() {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <header className="flex items-center justify-between py-4 animate-fade-in">
      <div>
        <p className="text-muted-foreground text-sm">{getGreeting()} 👋</p>
        <h1 className="text-xl font-bold text-foreground">Minhas Finanças</h1>
      </div>
      
      <button className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
        <User size={20} />
      </button>
    </header>
  );
}
