import { useState } from "react";

export function TermsAndPrivacy() {
  const [activeSection, setActiveSection] = useState("terms");

  const sections = [
    { id: "terms", label: "利用規約", icon: "📋" },
    { id: "privacy", label: "プライバシーポリシー", icon: "🔒" },
    { id: "disclaimer", label: "免責事項", icon: "⚠️" },
    { id: "cookie", label: "Cookieポリシー", icon: "🍪" },
  ];

  const renderTerms = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-yellow-400 mb-4 amano-text-glow">📋 利用規約</h2>
        <p className="text-gray-300">
          本利用規約（以下「本規約」）は、本サイト（以下「本サイト」）が提供する
          市議会議員の公的活動に関する情報提供サービス（以下「本サービス」）の利用条件を定めるものです。
          利用者は、本規約に同意した上で本サービスを利用するものとします。
        </p>
      </div>

      <div className="space-y-6">
        <div className="amano-bg-glass rounded-xl p-6 amano-crystal-border">
          <h3 className="text-xl font-bold text-cyan-400 mb-4 amano-text-glow">第1条（目的）</h3>
          <p className="text-gray-300 leading-relaxed">
            本サービスは、市議会議員の公的活動情報を可視化し、
            市民の理解促進および議会の透明性向上を目的とするものであり、
            特定政党・特定議員の支持または批判を目的としたサイトではありません。
          </p>
        </div>

        <div className="amano-bg-glass rounded-xl p-6 amano-crystal-border">
          <h3 className="text-xl font-bold text-cyan-400 mb-4 amano-text-glow">第2条（取り扱う情報）</h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            本サイトは、以下の公開情報を元にデータを整理・可視化します。
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>市議会会議録</li>
            <li>行政機関の公開資料</li>
            <li>議員本人が公開した情報（SNS、ブログ、公式発表等）</li>
            <li>その他、公共性の高い公的活動に関連する情報</li>
          </ul>
          <p className="text-yellow-400 mt-4 font-medium">
            ※非公開情報・個人情報（住所・電話番号・家族情報など）は取り扱いません。
          </p>
        </div>

        <div className="amano-bg-glass rounded-xl p-6 amano-crystal-border">
          <h3 className="text-xl font-bold text-cyan-400 mb-4 amano-text-glow">第3条（禁止行為）</h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            利用者は以下の行為を禁止します。
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>本サイトの情報を選挙運動に利用する行為</li>
            <li>特定議員に対する誹謗中傷や名誉毀損に該当する行為</li>
            <li>虚偽情報の投稿・拡散</li>
            <li>法令や公序良俗に違反する行為</li>
            <li>サイト運営を妨げる行為</li>
            <li>不正アクセス等のセキュリティを侵害する行為</li>
          </ul>
        </div>

        <div className="amano-bg-glass rounded-xl p-6 amano-crystal-border">
          <h3 className="text-xl font-bold text-cyan-400 mb-4 amano-text-glow">第4条（情報の正確性）</h3>
          <p className="text-gray-300 leading-relaxed">
            本サイトは正確な情報提供に努めますが、
            全ての情報の正確性・完全性を保証するものではありません。
            誤りがある場合は速やかに修正します。
          </p>
        </div>

        <div className="amano-bg-glass rounded-xl p-6 amano-crystal-border">
          <h3 className="text-xl font-bold text-cyan-400 mb-4 amano-text-glow">第5条（知的財産）</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>本サイトのデザイン、データ処理ロジック、可視化グラフの著作権は運営者に帰属します。</li>
            <li>公開された行政資料の引用部分については、出典を明記しています。</li>
          </ul>
        </div>

        <div className="amano-bg-glass rounded-xl p-6 amano-crystal-border">
          <h3 className="text-xl font-bold text-cyan-400 mb-4 amano-text-glow">第6条（免責事項）</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>本サイトは政治的中立を保ちながら運営しています。</li>
            <li>本サイトの情報を利用して行われた判断・行動（投票行動等）について、運営者は責任を負いません。</li>
            <li>選挙期間中、不適切と判断した情報は予告なく非公開とする場合があります。</li>
          </ul>
        </div>

        <div className="amano-bg-glass rounded-xl p-6 amano-crystal-border">
          <h3 className="text-xl font-bold text-cyan-400 mb-4 amano-text-glow">第7条（規約変更）</h3>
          <p className="text-gray-300 leading-relaxed">
            本規約は必要に応じて変更します。
            改定後、サイト内で告知した時点で効力を持ちます。
          </p>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-400 font-medium">制定日：2025年12月1日</p>
        </div>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-yellow-400 mb-4 amano-text-glow">🔒 プライバシーポリシー</h2>
        <p className="text-gray-300">
          本サイト（以下「当サイト」）は、利用者の個人情報を適切に取り扱うため、
          以下の通りプライバシーポリシーを制定します。
        </p>
      </div>

      <div className="space-y-6">
        <div className="amano-bg-glass rounded-xl p-6 amano-crystal-border">
          <h3 className="text-xl font-bold text-cyan-400 mb-4 amano-text-glow">第1条（基本方針）</h3>
          <p className="text-gray-300 leading-relaxed">
            当サイトは、市議会議員の公的活動情報を扱うものであり、
            利用者個人のデータ収集は必要最小限とします。
          </p>
        </div>

        <div className="amano-bg-glass rounded-xl p-6 amano-crystal-border">
          <h3 className="text-xl font-bold text-cyan-400 mb-4 amano-text-glow">第2条（取得する情報）</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>利用者が問い合わせフォームで提供した情報（氏名、メールアドレス等）</li>
            <li>アクセス解析に必要な匿名データ（IPアドレス、ブラウザ情報等）</li>
            <li>Cookie による利用状況データ（匿名）</li>
          </ul>
          <p className="text-yellow-400 mt-4 font-medium">
            ※公人である議員の私生活情報・住所・家族情報などは一切取得しません。
          </p>
        </div>

        <div className="amano-bg-glass rounded-xl p-6 amano-crystal-border">
          <h3 className="text-xl font-bold text-cyan-400 mb-4 amano-text-glow">第3条（利用目的）</h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            取得した情報は以下の目的のみで使用します。
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>問い合わせへの対応</li>
            <li>サイト改善のための分析</li>
            <li>利便性向上のためのアクセス解析</li>
          </ul>
        </div>

        <div className="amano-bg-glass rounded-xl p-6 amano-crystal-border">
          <h3 className="text-xl font-bold text-cyan-400 mb-4 amano-text-glow">第4条（第三者提供）</h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            以下の場合を除き個人情報を第三者へ提供しません。
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>本人の同意がある場合</li>
            <li>法令に基づき開示を求められた場合</li>
          </ul>
        </div>

        <div className="amano-bg-glass rounded-xl p-6 amano-crystal-border">
          <h3 className="text-xl font-bold text-cyan-400 mb-4 amano-text-glow">第5条（外部サービスの利用）</h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            当サイトは以下の外部サービスを利用する場合があります。
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
            <li>Google Analytics</li>
            <li>Convex（ホスティング）</li>
            <li>その他データ可視化ツール</li>
          </ul>
          <p className="text-gray-300 mt-4">
            各サービスは独自ポリシーに従い運営されています。
          </p>
        </div>

        <div className="amano-bg-glass rounded-xl p-6 amano-crystal-border">
          <h3 className="text-xl font-bold text-cyan-400 mb-4 amano-text-glow">第6条（安全管理）</h3>
          <p className="text-gray-300 leading-relaxed">
            取得した情報は適切なセキュリティ対策により保護します。
          </p>
        </div>

        <div className="amano-bg-glass rounded-xl p-6 amano-crystal-border">
          <h3 className="text-xl font-bold text-cyan-400 mb-4 amano-text-glow">第7条（改定）</h3>
          <p className="text-gray-300 leading-relaxed">
            当ポリシーは必要に応じて改定されます。
          </p>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-400 font-medium">制定日：2025年12月1日</p>
        </div>
      </div>
    </div>
  );

  const renderDisclaimer = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-yellow-400 mb-4 amano-text-glow">⚠️ 免責事項</h2>
      </div>

      <div className="space-y-6">
        <div className="amano-bg-glass rounded-xl p-6 amano-crystal-border">
          <p className="text-gray-300 leading-relaxed mb-4">
            当サイトは、市議会議員の公的活動を客観的に可視化することを目的としています。
            特定政党・候補者を支持、反対する意図はありません。
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            掲載情報は公開資料・議員本人の発信・行政資料等を元に作成していますが、
            その正確性・完全性を保証するものではありません。
          </p>
          <p className="text-gray-300 leading-relaxed mb-4">
            誤りがあれば速やかに訂正いたします。
          </p>
          <p className="text-yellow-400 font-medium">
            当サイトの情報を基にした政治判断・投票行動について、
            当サイトは一切の責任を負いません。
          </p>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-400 font-medium">制定日：2025年12月1日</p>
        </div>
      </div>
    </div>
  );

  const renderCookie = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-yellow-400 mb-4 amano-text-glow">🍪 Cookieポリシー</h2>
        <p className="text-gray-300">
          当サイトでは、利用者の利便性向上およびアクセス解析のため、
          Cookieを使用する場合があります。
        </p>
      </div>

      <div className="space-y-6">
        <div className="amano-bg-glass rounded-xl p-6 amano-crystal-border">
          <ul className="list-disc list-inside text-gray-300 space-y-3 ml-4">
            <li>
              Cookieは、利用者のデバイスに保存される小さなデータで、
              個人を特定する情報は含まれません。
            </li>
            <li>
              利用者はブラウザ設定によりCookieの拒否が可能です。
            </li>
            <li>
              Cookie拒否の場合、一部機能が利用できなくなる場合があります。
            </li>
            <li>
              アクセス解析ツール（Google Analytics等）で使用されるCookieは
              サイト改善のみに利用されます。
            </li>
          </ul>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-400 font-medium">制定日：2025年12月1日</p>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "terms":
        return renderTerms();
      case "privacy":
        return renderPrivacy();
      case "disclaimer":
        return renderDisclaimer();
      case "cookie":
        return renderCookie();
      default:
        return renderTerms();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent mb-4 amano-text-glow">
          📋 利用規約・プライバシーポリシー
        </h1>
        <p className="text-gray-300 text-lg">
          GIIIN/ギイーンの利用に関する重要な情報をご確認ください
        </p>
      </div>

      {/* Navigation */}
      <div className="amano-bg-glass rounded-xl p-4 amano-crystal-border">
        <div className="flex flex-wrap justify-center gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                activeSection === section.id
                  ? "bg-gradient-to-r from-yellow-500 via-purple-500 to-cyan-400 text-white shadow-lg amano-card-glow"
                  : "text-gray-300 amano-bg-card hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-600"
              }`}
            >
              <span>{section.icon}</span>
              <span className="hidden sm:inline">{section.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="animate-fadeIn">
        {renderContent()}
      </div>


    </div>
  );
}
