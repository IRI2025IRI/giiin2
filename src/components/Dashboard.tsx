import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Slideshow } from "./Slideshow";
import { useCountUp, useReveal } from "../hooks/useGaAnimations";

import { TopMembers } from "./TopMembers";
import { RecentQuestions } from "./RecentQuestions";

interface DashboardProps {
  onMemberClick: (memberId: Id<"councilMembers">) => void;
  onNewsClick: (newsId: Id<"news">) => void;
  onViewChange: (view: string) => void;
  onQuestionClick?: (questionId: Id<"questions">) => void;
}

export function Dashboard({ onMemberClick, onNewsClick, onViewChange, onQuestionClick }: DashboardProps) {
  const recentNews = useQuery(api.news.getRecent, { limit: 3 });
  const stats = useQuery(api.questions.getStats);

  const totalQuestions = useCountUp(stats?.totalQuestions, 0);
  const totalMembers = useCountUp(stats?.totalMembers, 100);
  const answerRate = useCountUp(stats?.answerRate, 200);
  const noticesCount = useCountUp(stats?.noticesCount, 300);

  const quickAccess = useReveal<HTMLDivElement>();
  const newsReveal = useReveal<HTMLDivElement>();
  const guideReveal = useReveal<HTMLDivElement>();

  const handleQuestionClick = (questionId: Id<"questions">) => {
    if (onQuestionClick) {
      onQuestionClick(questionId);
    } else {
      // Fallback to questions list view
      onViewChange("questions");
    }
  };

  return (
    <div className="ga-page">
      {/* ヒーロー：見出し＋実績サマリー */}
      <div className="ga-hero">
        <div className="ga-hero-bignum">01</div>
        <div className="ga-hero-inner">
          <div className="ga-hero-eyebrow">
            <span className="ga-rule" />
            <span className="ga-eyebrow">三原市議会 見える化プロジェクト</span>
          </div>
          <h1>
            議員活動を、<br className="sm:hidden" />もっと身近に。
          </h1>
          <p>
            質問・回答、議員情報、統計データを通じて、三原市議会の動きをわかりやすくお届けします。
          </p>
        </div>

        <div className="ga-stat-row">
          <div className="ga-stat">
            <div className="ga-eyebrow">総質問数</div>
            <div className="ga-value">{stats ? totalQuestions : "–"}</div>
          </div>
          <div className="ga-stat">
            <div className="ga-eyebrow">議員数</div>
            <div className="ga-value">{stats ? totalMembers : "–"}</div>
          </div>
          <div className="ga-stat">
            <div className="ga-eyebrow">回答率</div>
            <div className="ga-value">{stats ? `${answerRate}%` : "–"}</div>
          </div>
          <div className="ga-stat">
            <div className="ga-eyebrow">お知らせ</div>
            <div className="ga-value">{stats ? noticesCount : "–"}</div>
          </div>
        </div>
      </div>

      <div className="ga-main">
        {/* スライドショー */}
        <div className="ga-block" style={{ borderRadius: 16, overflow: "hidden", boxShadow: "var(--ga-shadow)" }}>
          <Slideshow />
        </div>

        {/* クイックアクセス */}
        <div ref={quickAccess.ref} className={`ga-block ${quickAccess.className}`}>
          <div className="ga-section-head">
            <span className="ga-bignum">02</span>
            <div className="ga-headline">
              <span className="ga-eyebrow">Quick Access</span>
              <h2>クイックアクセス</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { key: "questions", label: "質問・回答" },
              { key: "members", label: "議員一覧" },
              { key: "rankings", label: "統計" },
              { key: "news", label: "お知らせ" },
            ].map((item, index) => (
              <button
                key={item.key}
                onClick={() => onViewChange(item.key)}
                className="ga-surface-card text-center transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="ga-jf" style={{ fontSize: "1.5rem", fontWeight: 300, color: "var(--ga-gold)" }}>
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="text-sm font-medium mt-1" style={{ color: "var(--ga-ink)" }}>{item.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 質問数の多い議員 */}
        <div className="ga-block">
          <div className="ga-section-head">
            <span className="ga-bignum">03</span>
            <div className="ga-headline">
              <span className="ga-eyebrow">Ranking</span>
              <h2>質問数の多い議員</h2>
            </div>
            <button className="ga-link" onClick={() => onViewChange("rankings")}>
              すべて見る →
            </button>
          </div>
          <TopMembers onMemberClick={onMemberClick} />
        </div>

        {/* 最近の質問 */}
        <div className="ga-block">
          <div className="ga-section-head">
            <span className="ga-bignum">04</span>
            <div className="ga-headline">
              <span className="ga-eyebrow">Latest Q&amp;A</span>
              <h2>最近の質問</h2>
            </div>
            <button className="ga-link" onClick={() => onViewChange("questions")}>
              すべて見る →
            </button>
          </div>
          <RecentQuestions onQuestionClick={handleQuestionClick} />
        </div>

        {/* 最新お知らせ */}
        {recentNews && recentNews.length > 0 && (
          <div ref={newsReveal.ref} className={`ga-block ${newsReveal.className}`}>
            <div className="ga-section-head">
              <span className="ga-bignum">05</span>
              <div className="ga-headline">
                <span className="ga-eyebrow">News</span>
                <h2>最新お知らせ</h2>
              </div>
              <button className="ga-link" onClick={() => onViewChange("news")}>
                すべて見る →
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {recentNews.map((news) => (
                <div
                  key={news._id}
                  onClick={() => onNewsClick(news._id)}
                  className="ga-surface-card cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold" style={{ color: "var(--ga-ink)" }}>{news.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: "var(--ga-muted)" }}>
                      <span>{new Date(news.publishDate).toLocaleDateString("ja-JP")}</span>
                      <span className="ga-pill cat">{news.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 使い方ガイド */}
        <div ref={guideReveal.ref} className={`ga-block ${guideReveal.className}`}>
          <div className="ga-section-head">
            <span className="ga-bignum">06</span>
            <div className="ga-headline">
              <span className="ga-eyebrow">Guide</span>
              <h2>使い方ガイド</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "検索", body: "議員名やキーワードで質問を簡単に検索できます" },
              { title: "分析", body: "議員の活動状況を確認できます" },
              { title: "参加", body: "気になる機能で関心のある質問を評価できます" },
            ].map((step, index) => (
              <div key={step.title} className="ga-surface-card text-center">
                <div className="ga-jf" style={{ fontSize: "2rem", fontWeight: 300, color: "var(--ga-gold)" }}>
                  {String(index + 1).padStart(2, "0")}
                </div>
                <h3 className="font-bold mt-1 mb-2">{step.title}</h3>
                <p className="text-sm" style={{ color: "var(--ga-muted)" }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
