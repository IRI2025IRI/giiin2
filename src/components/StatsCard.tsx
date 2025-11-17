interface StatsCardProps {
  title: string;
  value: number;
  icon: string;
  color: "blue" | "green" | "purple" | "orange";
}

export function StatsCard({ title, value, icon, color }: StatsCardProps) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 shadow-blue-200",
    green: "from-green-500 to-green-600 shadow-green-200",
    purple: "from-purple-500 to-purple-600 shadow-purple-200",
    orange: "from-orange-500 to-orange-600 shadow-orange-200",
  };

  return (
    <div className={`bg-gradient-to-r ${colorClasses[color]} text-white rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 animate-slideUp`}>
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
