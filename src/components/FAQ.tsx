import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function FAQ() {
  const faqData = useQuery(api.faq.getPublishedFAQs) || [];
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 全てのFAQアイテムをフラットな配列に変換
  const allFaqItems = faqData.flatMap(categoryData => categoryData.items);

  // カテゴリ一覧を取得
  const categories = ["all", ...faqData.map(categoryData => categoryData.category)];

  // フィルタリング
  const filteredItems = allFaqItems.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleContactClick = () => {
    // URLを更新してお問い合わせページに遷移
    const url = new URL(window.location.href);
    url.searchParams.set("view", "contact");
    url.searchParams.delete("member");
    url.searchParams.delete("news");
    url.searchParams.delete("article");
    url.searchParams.delete("question");
    window.history.pushState({}, "", url.toString());
    
    // ページをリロードしてお問い合わせページを表示
    window.location.reload();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent amano-text-glow mb-4">
          💡 よくある質問
        </h1>
        <p className="text-gray-300 text-lg">
          GIIIN/ギイーンについてよくお寄せいただく質問をまとめました
        </p>
      </div>

      {/* 検索・フィルター */}
      <div className="amano-bg-card rounded-xl p-6 amano-crystal-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 検索 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              🔍 キーワード検索
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="質問や回答を検索..."
              className="auth-input-field"
            />
          </div>

          {/* カテゴリフィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              📂 カテゴリ
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="auth-input-field"
            >
              <option value="all">すべて</option>
              {categories.filter(cat => cat !== "all").map((category: string) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* FAQ一覧 */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="amano-bg-card rounded-xl p-8 text-center amano-crystal-border">
            <div className="text-6xl mb-4">🤔</div>
            <h3 className="text-xl font-bold text-yellow-400 mb-2">
              該当する質問が見つかりませんでした
            </h3>
            <p className="text-gray-300">
              検索条件を変更するか、お問い合わせフォームからご質問ください。
            </p>
          </div>
        ) : (
          filteredItems.map((item: any, index: number) => (
            <FAQItem key={item._id} item={item} index={index} />
          ))
        )}
      </div>

      {/* お問い合わせへの誘導 */}
      <div className="amano-bg-card rounded-xl p-6 text-center amano-crystal-border">
        <h3 className="text-xl font-bold text-yellow-400 mb-4 amano-text-glow">
          🤝 解決しない場合は
        </h3>
        <p className="text-gray-300 mb-6">
          お探しの情報が見つからない場合は、お気軽にお問い合わせください。
          <br />
          できるだけ迅速にご回答いたします。
        </p>
        <button
          onClick={handleContactClick}
          className="px-6 py-3 bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-105"
        >
          📧 お問い合わせページへ
        </button>
      </div>
    </div>
  );
}

function FAQItem({ item, index }: { item: any, index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="amano-bg-card rounded-xl amano-crystal-border overflow-hidden animate-slideUp"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-6 text-left hover:bg-purple-800/20 transition-colors"
      >
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <span className="text-2xl">❓</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-1 rounded-full text-xs">
                {item.category}
              </span>
            </div>
            <h3 className="text-lg font-bold text-yellow-400 mb-2">
              {item.question}
            </h3>
          </div>
          <div className="flex-shrink-0">
            <span className={`text-xl transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
              ⌄
            </span>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="px-6 pb-6 animate-slideDown">
          <div className="border-t border-purple-500/30 pt-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <span className="text-2xl">💡</span>
              </div>
              <div className="flex-1">
                <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                  {item.answer}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
