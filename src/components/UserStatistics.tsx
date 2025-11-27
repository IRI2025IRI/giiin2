import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

export function UserStatistics() {
  const [activeTab, setActiveTab] = useState<"overview" | "detailed">("overview");
  const statistics = useQuery(api.userDemographics.getStatistics);
  const detailedStats = useQuery(api.userDemographics.getDetailedStatistics);

  if (!statistics) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">統計データを読み込み中...</p>
        </div>
      </div>
    );
  }

  const renderChart = (data: Record<string, number>, title: string, color: string) => {
    const total = Object.values(data).reduce((sum, value) => sum + value, 0);
    
    return (
      <div className="amano-bg-card rounded-lg p-6 amano-crystal-border">
        <h3 className="text-lg font-bold text-yellow-400 mb-4 amano-text-glow">{title}</h3>
        <div className="space-y-3">
          {Object.entries(data).map(([key, value]) => {
            const percentage = total > 0 ? (value / total) * 100 : 0;
            return (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300 text-sm">{key}</span>
                  <span className="text-white font-medium">
                    {value}人 ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ${color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-600">
          <p className="text-gray-400 text-sm">合計: {total}人</p>
        </div>
      </div>
    );
  };

  const renderCrossTable = (data: Record<string, number>, title: string, rowLabels: string[], colLabels: string[]) => {
    return (
      <div className="amano-bg-card rounded-lg p-6 amano-crystal-border">
        <h3 className="text-lg font-bold text-yellow-400 mb-4 amano-text-glow">{title}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2 text-gray-300"></th>
                {colLabels.map(col => (
                  <th key={col} className="text-center p-2 text-gray-300 border-b border-gray-600">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowLabels.map(row => (
                <tr key={row}>
                  <td className="p-2 text-gray-300 font-medium border-r border-gray-600">{row}</td>
                  {colLabels.map(col => {
                    const key = `${row}_${col}`;
                    const value = data[key] || 0;
                    return (
                      <td key={col} className="text-center p-2 text-white">
                        {value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow">
          📊 ユーザー統計
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "overview"
                ? "bg-gradient-to-r from-yellow-500 to-purple-500 text-white"
                : "amano-bg-card text-gray-300 hover:text-yellow-400"
            }`}
          >
            概要
          </button>
          <button
            onClick={() => setActiveTab("detailed")}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
              activeTab === "detailed"
                ? "bg-gradient-to-r from-yellow-500 to-purple-500 text-white"
                : "amano-bg-card text-gray-300 hover:text-yellow-400"
            }`}
          >
            詳細分析
          </button>
        </div>
      </div>

      {activeTab === "overview" && (
        <>
          {/* 概要統計 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="amano-bg-card rounded-lg p-6 text-center amano-crystal-border">
              <div className="text-3xl font-bold text-yellow-400 amano-text-glow">
                {statistics.totalUsers}
              </div>
              <div className="text-gray-300 mt-2">総ユーザー数</div>
            </div>
            <div className="amano-bg-card rounded-lg p-6 text-center amano-crystal-border">
              <div className="text-3xl font-bold text-cyan-400 amano-text-glow">
                {statistics.demographicsCompleted}
              </div>
              <div className="text-gray-300 mt-2">属性情報登録済み</div>
            </div>
            <div className="amano-bg-card rounded-lg p-6 text-center amano-crystal-border">
              <div className="text-3xl font-bold text-purple-400 amano-text-glow">
                {statistics.demographicsCompletionRate.toFixed(1)}%
              </div>
              <div className="text-gray-300 mt-2">登録完了率</div>
            </div>
          </div>

          {/* 属性別統計 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {renderChart(statistics.ageGroupStats, "年代別分布", "bg-gradient-to-r from-blue-500 to-purple-500")}
            {renderChart(statistics.genderStats, "性別分布", "bg-gradient-to-r from-pink-500 to-red-500")}
            {renderChart(statistics.regionStats, "地域分布", "bg-gradient-to-r from-green-500 to-teal-500")}
          </div>

          {/* 月別登録者数 */}
          <div className="amano-bg-card rounded-lg p-6 amano-crystal-border">
            <h3 className="text-lg font-bold text-yellow-400 mb-4 amano-text-glow">月別登録者数（過去12ヶ月）</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Object.entries(statistics.monthlyRegistrations)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([month, count]) => (
                  <div key={month} className="text-center">
                    <div className="text-2xl font-bold text-cyan-400 amano-text-glow">{count}</div>
                    <div className="text-gray-400 text-sm">{month}</div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}

      {activeTab === "detailed" && detailedStats && (
        <div className="space-y-6">
          <p className="text-gray-300 text-sm">
            クロス集計により、ユーザー属性の詳細な分析を確認できます。
          </p>

          {/* 年代×性別 */}
          {renderCrossTable(
            detailedStats.ageGenderCross,
            "年代×性別 クロス集計",
            ["10代", "20代", "30代", "40代", "50代", "60代", "70代以上"],
            ["男性", "女性", "その他", "回答しない"]
          )}

          {/* 年代×地域 */}
          {renderCrossTable(
            detailedStats.ageRegionCross,
            "年代×地域 クロス集計",
            ["10代", "20代", "30代", "40代", "50代", "60代", "70代以上"],
            ["三原市民", "その他市民"]
          )}

          {/* 性別×地域 */}
          {renderCrossTable(
            detailedStats.genderRegionCross,
            "性別×地域 クロス集計",
            ["男性", "女性", "その他", "回答しない"],
            ["三原市民", "その他市民"]
          )}
        </div>
      )}

      <div className="text-center text-gray-400 text-sm">
        最終更新: {new Date(statistics.lastUpdated).toLocaleString('ja-JP')}
      </div>
    </div>
  );
}
