import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function UserStatistics() {
  const statistics = useQuery(api.userDemographics.getStatistics);

  if (!statistics) {
    return (
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin animate-amano-glow"></div>
          <span className="text-gray-300">統計情報を読み込み中...</span>
        </div>
      </div>
    );
  }

  // キーマッピング
  const ageGroupMapping = {
    "10s": "10代",
    "20s": "20代", 
    "30s": "30代",
    "40s": "40代",
    "50s": "50代",
    "60s": "60代",
    "70splus": "70代以上"
  };

  const genderMapping = {
    "male": "男性",
    "female": "女性",
    "other": "その他",
    "no_answer": "回答しない"
  };

  const regionMapping = {
    "mihara_citizen": "三原市民",
    "other_citizen": "その他市民"
  };

  const renderChart = (data: Record<string, number>, title: string, colors: string[], keyMapping?: Record<string, string>) => (
    <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
      <h3 className="text-lg font-semibold text-yellow-400 amano-text-glow mb-4">{title}</h3>
      <div className="space-y-3">
        {Object.entries(data).map(([key, value], index) => {
          const percentage = statistics.total > 0 ? (value / statistics.total * 100).toFixed(1) : "0";
          const colorClass = colors[index % colors.length];
          
          return (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${colorClass}`}></div>
                <span className="text-gray-300">{keyMapping ? keyMapping[key] || key : key}</span>
              </div>
              <div className="text-right">
                <div className="text-white font-semibold">{value}人</div>
                <div className="text-xs text-gray-400">{percentage}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
          ユーザー統計情報
        </h2>
        <p className="text-gray-300 mt-2">
          登録ユーザー総数: <span className="text-yellow-400 font-semibold">{statistics.total}人</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderChart(
          statistics.ageGroup,
          "年代別分布",
          ["bg-purple-500", "bg-blue-500", "bg-cyan-500", "bg-green-500", "bg-yellow-500", "bg-orange-500", "bg-red-500"],
          ageGroupMapping
        )}

        {renderChart(
          statistics.gender,
          "性別分布",
          ["bg-blue-500", "bg-pink-500", "bg-purple-500", "bg-gray-500"],
          genderMapping
        )}

        {renderChart(
          statistics.region,
          "地域分布",
          ["bg-green-500", "bg-orange-500"],
          regionMapping
        )}
      </div>

      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <h3 className="text-lg font-semibold text-yellow-400 amano-text-glow mb-4">統計情報について</h3>
        <div className="text-gray-300 space-y-2 text-sm">
          <p>• この統計情報は、より良いサービス提供のために活用されます</p>
          <p>• 個人を特定できる情報は含まれていません</p>
          <p>• データは匿名化されて処理されています</p>
          <p>• 統計情報は定期的に更新されます</p>
        </div>
      </div>
    </div>
  );
}
