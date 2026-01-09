import {
  Home,
  Building,
  Wifi,
  Play,
  Zap,
  Droplets,
  Utensils,
  Car,
  Gamepad2,
  HeartPulse,
  ShoppingBag,
  GraduationCap,
  Briefcase,
  Laptop,
  TrendingUp,
  Coins,
  CreditCard,
  Wallet,
  Banknote,
  HelpCircle,
  LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Home,
  Building,
  Wifi,
  Play,
  Zap,
  Droplets,
  Utensils,
  Car,
  Gamepad2,
  HeartPulse,
  ShoppingBag,
  GraduationCap,
  Briefcase,
  Laptop,
  TrendingUp,
  Coins,
  CreditCard,
  Wallet,
  Banknote,
};

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export function CategoryIcon({ name, className = '', size = 20 }: CategoryIconProps) {
  const Icon = iconMap[name] || HelpCircle;
  return <Icon className={className} size={size} />;
}

export function PaymentMethodIcon({ type, className = '', size = 20 }: { type: string; className?: string; size?: number }) {
  const iconByType: Record<string, LucideIcon> = {
    credit_card: CreditCard,
    cash: Banknote,
    bank_account: Wallet,
  };
  
  const Icon = iconByType[type] || Wallet;
  return <Icon className={className} size={size} />;
}
