import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";

interface FAQProps {
  onNavigateToContact?: () => void;
}

export function FAQ({ onNavigateToContact }: FAQProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  
  const faqData = useQuery(api.faq.getPublishedFAQs);

  if (faqData === undefined) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin animate-amano-glow"></div>
      </div>
    );
  }

  const categories = faqData.map(group => group.category);
  const filteredData = selectedCategory === "all" ? faqData : faqData.filter(group => group.category === selectedCategory);

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ヘッダー */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4 amano-text-glow">
          よくある質問
        </h1>
        <p className="text-gray-300 text-lg">
          GIIIN/ギイーンについてのよくある質問をまとめました
        </p>
      </div>

      {/* カテゴリフィルター */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              selectedCategory === "all"
                ? "bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white shadow-lg amano-card-glow"
                : "amano-bg-card text-gray-300 hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600"
            }`}
          >
            すべて
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white shadow-lg amano-card-glow"
                  : "amano-bg-card text-gray-300 hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* FAQ項目 */}
      <div className="space-y-6">
        {filteredData.map((group) => (
          <div key={group.category} className="space-y-4">
            {categories.length > 1 && selectedCategory === "all" && (
              <h2 className="text-2xl font-bold text-yellow-400 amano-text-glow border-b border-purple-500 pb-2">
                {group.category}
              </h2>
            )}
            
            <div className="space-y-3">
              {group.items.map((item) => (
                <div
                  key={item._id}
                  className="amano-bg-card rounded-lg border border-purple-500 overflow-hidden amano-card-glow transition-all duration-300 hover:shadow-2xl"
                >
                  <button
                    onClick={() => toggleExpanded(item._id)}
                    className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gradient-to-r hover:from-purple-600/20 hover:to-blue-600/20 transition-all duration-300"
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-yellow-400 amano-text-glow">
                        Q. {item.question}
                      </h3>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className={`text-2xl text-cyan-400 transition-transform duration-300 ${
                        expandedItems.has(item._id) ? "rotate-180" : ""
                      }`}>
                        ▼
                      </span>
                    </div>
                  </button>
                  
                  {expandedItems.has(item._id) && (
                    <div className="px-6 pb-6 animate-slideDown">
                      <div className="border-t border-purple-500/30 pt-4">
                        <div className="flex items-start space-x-3">
                          <span className="text-cyan-400 font-bold text-lg flex-shrink-0 mt-1">A.</span>
                          <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {item.answer}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* FAQ項目がない場合 */}
      {categories.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">❓</div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            FAQがまだ準備されていません
          </h3>
          <p className="text-gray-500">
            しばらくお待ちください
          </p>
        </div>
      )}

      {/* お問い合わせへの誘導 */}
      <div className="amano-bg-card p-6 rounded-lg border border-purple-500 text-center amano-card-glow">
        <h3 className="text-xl font-bold text-yellow-400 mb-2 amano-text-glow">
          他にご質問がございますか？
        </h3>
        <p className="text-gray-300 mb-4">
          こちらに掲載されていない質問がございましたら、お気軽にお問い合わせください。
        </p>
        <button
          onClick={() => {
            if (onNavigateToContact) {
              onNavigateToContact();
            }
          }}
          className="bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white px-6 py-3 rounded-lg font-medium hover:from-yellow-500 hover:via-purple-500 hover:to-cyan-400 transition-all duration-500 transform hover:scale-105 amano-crystal-border animate-amano-glow"
        >
          お問い合わせページへ
        </button>
      </div>
    </div>
  );
}
