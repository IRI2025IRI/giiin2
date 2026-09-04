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

  const newsReveal = useReveal<HTMLDivElement>();

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
            議員活動を、<br />もっと身近に。
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
        {/* スライドショー（スライドが無い場合は何も描画しない） */}
        <Slideshow />

        {/* 最新お知らせ */}
        {recentNews && recentNews.length > 0 && (
          <div ref={newsReveal.ref} className={`ga-block ${newsReveal.className}`}>
            <div className="ga-section-head">
              <span className="ga-bignum">02</span>
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
      </div>
    </div>
  );
}
