import { cn, formatCurrency } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number | string;
  isCurrency?: boolean;
  className?: string;
}

export default function KPICard({ title, value, isCurrency, className }: KPICardProps) {
  const displayValue = isCurrency ? formatCurrency(Number(value)) : value;
  return (
    <div className={cn("bg-gray-800 rounded-xl p-5 border border-gray-700", className)}>
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <p className="text-white text-2xl font-bold">{displayValue}</p>
    </div>
  );
}
