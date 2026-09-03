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
    <div className="ga-page">
      <div className="ga-page-header">
        <h1>よくある質問</h1>
        <p>GIIIN/ギイーンについてよくお寄せいただく質問をまとめました</p>
      </div>

      <div className="ga-main">
        {/* 検索・フィルター */}
        <div className="ga-block ga-surface-card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="ga-field">
              <label>キーワード検索</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="質問や回答を検索..."
                className="ga-input"
              />
            </div>

            <div className="ga-field">
              <label>カテゴリ</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="ga-select"
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
        <div className="ga-block space-y-4">
          {filteredItems.length === 0 ? (
            <div className="ga-empty ga-surface-card">
              <h3 className="text-xl font-bold mb-2" style={{ color: "var(--ga-ink)" }}>
                該当する質問が見つかりませんでした
              </h3>
              <p>検索条件を変更するか、お問い合わせフォームからご質問ください。</p>
            </div>
          ) : (
            filteredItems.map((item: any) => (
              <FAQItem key={item._id} item={item} />
            ))
          )}
        </div>

        {/* お問い合わせへの誘導 */}
        <div className="ga-block ga-surface-card text-center">
          <h3 className="text-xl font-bold mb-4" style={{ color: "var(--ga-ink)" }}>解決しない場合は</h3>
          <p className="mb-6" style={{ color: "var(--ga-muted)" }}>
            お探しの情報が見つからない場合は、お気軽にお問い合わせください。
            <br />
            できるだけ迅速にご回答いたします。
          </p>
          <button onClick={handleContactClick} className="ga-btn ga-btn-primary">
            お問い合わせページへ
          </button>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ item }: { item: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="ga-surface-card" style={{ padding: 0, overflow: "hidden" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left transition-colors"
        style={{ padding: 20, background: "none", border: "none", cursor: "pointer" }}
      >
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="mb-2">
              <span className="ga-pill cat">{item.category}</span>
            </div>
            <h3 className="text-lg font-bold" style={{ color: "var(--ga-ink)" }}>
              {item.question}
            </h3>
          </div>
          <div className="flex-shrink-0">
            <span
              className="text-xl transition-transform duration-300"
              style={{ display: "inline-block", transform: isOpen ? "rotate(180deg)" : "none", color: "var(--ga-gold)" }}
            >
              ⌄
            </span>
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 animate-slideDown">
          <div className="pt-4" style={{ borderTop: "1px solid var(--ga-line)" }}>
            <div className="leading-relaxed whitespace-pre-wrap" style={{ color: "var(--ga-muted)" }}>
              {item.answer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
