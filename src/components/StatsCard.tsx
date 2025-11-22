interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
  delay?: number;
}

export function StatsCard({ title, value, icon, color, delay = 0 }: StatsCardProps) {
  return (
    <div 
      className={`bg-gradient-to-r ${color} text-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slideUp amano-card-glow`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium opacity-90 mb-1 truncate">{title}</p>
          <p className="text-xl sm:text-3xl font-bold animate-countUp">{value.toLocaleString()}</p>
        </div>
        <div className="text-2xl sm:text-4xl opacity-80 ml-2 flex-shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}
