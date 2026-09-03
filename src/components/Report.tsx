import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useReveal } from "../hooks/useGaAnimations";
import { formatResponseContent } from "../lib/textHighlight";
import { sessionReportSummaries } from "../data/sessionReportSummaries";

interface ReportProps {
  onMemberClick?: (memberId: Id<"councilMembers">) => void;
}

interface ReportQuestion {
  _id: Id<"questions">;
  title: string;
  category: string;
  content: string;
  status: "pending" | "answered" | "archived";
  councilMemberId: Id<"councilMembers">;
  memberName: string;
  memberParty?: string;
  answer: string;
}

export function Report({ onMemberClick }: ReportProps) {
  const sessionNumbers = useQuery(api.questions.getSessionNumbers);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const sessionOptions = useMemo(() => {
    if (!sessionNumbers) return [];
    return [...sessionNumbers].sort().reverse();
  }, [sessionNumbers]);

  const activeSession = selectedSession ?? sessionOptions[0] ?? null;

  const reportData = useQuery(
    api.questions.getSessionReportData,
    activeSession ? { sessionNumber: activeSession } : "skip"
  ) as ReportQuestion[] | undefined;

  const byCategory = useMemo(() => {
    if (!reportData) return [];
    const map = new Map<string, ReportQuestion[]>();
    reportData.forEach((q) => {
      if (!map.has(q.category)) map.set(q.category, []);
      map.get(q.category)!.push(q);
    });
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [reportData]);

  if (sessionNumbers === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="ga-spinner"></div>
      </div>
    );
  }

  if (sessionOptions.length === 0 || !activeSession) {
    return (
      <div className="ga-page">
        <div className="ga-main">
          <div className="ga-empty ga-surface-card">
            <p>まだレポートを作成できる質問データがありません。</p>
          </div>
        </div>
      </div>
    );
  }

  const summary = sessionReportSummaries[activeSession];
  const totalQuestions = reportData?.length ?? 0;
  const memberCount = reportData ? new Set(reportData.map((q) => q.memberName)).size : 0;
  const categoryCount = byCategory.length;
  const answeredCount = reportData ? reportData.filter((q) => q.status === "answered").length : 0;

  return (
    <div className="ga-page">
      <div className="ga-hero">
        <div className="ga-hero-inner">
          <div className="ga-hero-eyebrow">
            <span className="ga-rule" />
            <span className="ga-eyebrow">General Questions Report</span>
          </div>
          <h1>一般質問レポート</h1>
          <div className="ga-field" style={{ maxWidth: 360, marginTop: 8 }}>
            {sessionOptions.length > 1 ? (
              <select
                value={activeSession}
                onChange={(e) => setSelectedSession(e.target.value)}
                className="ga-select"
                style={{ fontWeight: 700, color: "var(--ga-teal-deep)" }}
              >
                {sessionOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <div style={{ fontWeight: 700, color: "var(--ga-teal-deep)", fontSize: "1.1rem" }}>{activeSession}</div>
            )}
          </div>
          <p style={{ color: "#2c3b3e", maxWidth: "56ch", lineHeight: 1.9, margin: "18px 0 0", fontSize: "0.94rem" }}>
            「一般質問」とは、議員が市政全般について市長や担当部署に直接ただす、議会のもっとも重要な場のひとつです。
            ここでは、この回の質問と答弁を、テーマ（分野）ごとに整理してご紹介します。
          </p>
        </div>
        <div className="ga-stat-row">
          <div className="ga-stat"><div className="ga-eyebrow">質問数</div><div className="ga-value">{totalQuestions}<small style={{ fontSize: "0.5em", fontWeight: 700, marginLeft: 2, color: "var(--ga-muted)" }}>件</small></div></div>
          <div className="ga-stat"><div className="ga-eyebrow">質問した議員</div><div className="ga-value">{memberCount}<small style={{ fontSize: "0.5em", fontWeight: 700, marginLeft: 2, color: "var(--ga-muted)" }}>人</small></div></div>
          <div className="ga-stat"><div className="ga-eyebrow">取り上げられたテーマ</div><div className="ga-value">{categoryCount}<small style={{ fontSize: "0.5em", fontWeight: 700, marginLeft: 2, color: "var(--ga-muted)" }}>分野</small></div></div>
          <div className="ga-stat"><div className="ga-eyebrow">回答済み</div><div className="ga-value">{answeredCount}<small style={{ fontSize: "0.5em", fontWeight: 700, marginLeft: 2, color: "var(--ga-muted)" }}>/{totalQuestions}件</small></div></div>
        </div>
      </div>

      <div className="ga-main">
        <div className="ga-block no-print flex justify-end">
          <button onClick={() => window.print()} className="ga-btn ga-btn-ghost">
            PDFを保存
          </button>
        </div>

        <div className="ga-block ga-surface-card">
          <h2 className="text-base font-bold mb-2" style={{ color: "var(--ga-ink)" }}>このレポートの見方</h2>
          <p className="text-sm" style={{ color: "var(--ga-muted)", lineHeight: 1.9 }}>
            テーマ（カテゴリ）ごとに区切り、その分野で誰がどんな質問をし、市がどう答えたか（質疑応答）を、実際のやりとりつきでご紹介しています。
            テーマが変わるところは、色味と大きな数字の切り替えで区切りが分かるようにしています。「続きを読む」でその質問の全文をご覧いただけます。
            内容はすべて実際の質問・答弁データをもとに自動的にまとめたもので、要約文はAIによる生成ではありません。
          </p>
        </div>

        {summary && (
          <div className="ga-block ga-report-summary">
            <span className="ga-report-badge">5分でわかる、まとめ</span>
            <p className="lead">{summary.lead}</p>
            <div className="list">
              {summary.highlights.map((text, i) => (
                <div key={i} className="item">
                  <span className="num">{String(i + 1).padStart(2, "0")}</span>
                  <p>{text}</p>
                </div>
              ))}
            </div>
            <p className="close">{summary.closing}</p>
          </div>
        )}
      </div>

      {!reportData ? (
        <div className="flex items-center justify-center py-12">
          <div className="ga-spinner"></div>
        </div>
      ) : (
        byCategory.map(([category, items], idx) => (
          <ReportThemeSection
            key={category}
            category={category}
            items={items}
            index={idx}
            onMemberClick={onMemberClick}
          />
        ))
      )}

      <div className="ga-main" style={{ paddingTop: 0 }}>
        <div className="ga-block">
          <p className="text-xs" style={{ color: "var(--ga-muted)", borderTop: "1px solid var(--ga-line)", paddingTop: 20 }}>
            ※ このレポートは三原市議会公式サイトで公開されている会議録・議事情報をもとに作成しています。実際の答弁内容は、各質問のページからご確認いただけます。
          </p>
        </div>
      </div>
    </div>
  );
}

function ReportThemeSection({
  category,
  items,
  index,
  onMemberClick,
}: {
  category: string;
  items: ReportQuestion[];
  index: number;
  onMemberClick?: (memberId: Id<"councilMembers">) => void;
}) {
  const reveal = useReveal<HTMLDivElement>();
  const tone = index % 2 === 0 ? "tone-teal" : "tone-gold";
  const num = String(index + 1).padStart(2, "0");
  const isInView = reveal.className.includes("in-view");

  return (
    <div ref={reveal.ref} className={`ga-report-theme ${tone} ${isInView ? "in-view" : ""}`}>
      <span className="bg-num">{num}</span>
      <div className="ga-report-theme-inner">
        <div className="ga-section-head">
          <span className="ga-bignum">{num}</span>
          <div className="ga-headline">
            <span className="ga-eyebrow">Theme</span>
            <h2>{category}（{items.length}件）</h2>
          </div>
        </div>
        <div className="ga-report-qlist">
          {items.map((q) => (
            <ReportQuestionCard key={q._id} question={q} onMemberClick={onMemberClick} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportQuestionCard({
  question,
  onMemberClick,
}: {
  question: ReportQuestion;
  onMemberClick?: (memberId: Id<"councilMembers">) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasAnswer = !!question.answer.trim();

  return (
    <div className="ga-report-qcard">
      <div className="who">
        <button
          onClick={() => onMemberClick?.(question.councilMemberId)}
          className="ga-avatar"
          style={{ width: 32, height: 32, fontSize: "0.72rem", border: "none", cursor: onMemberClick ? "pointer" : "default", padding: 0 }}
        >
          {question.memberName.charAt(0)}
        </button>
        <button
          onClick={() => onMemberClick?.(question.councilMemberId)}
          className="name"
          style={{ background: "none", border: "none", cursor: onMemberClick ? "pointer" : "default", padding: 0, font: "inherit" }}
        >
          {question.memberName}
        </button>
        {question.memberParty && <span className="ga-pill status">{question.memberParty}</span>}
      </div>
      <p className="title">{question.title}</p>
      <div className={`ga-report-qa ${expanded ? "expanded" : ""}`}>
        <div className="text">
          {hasAnswer ? formatResponseContent(question.answer) : question.content}
        </div>
        <button className="ga-report-qa-toggle" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "閉じる ▴" : "続きを読む ▾"}
        </button>
      </div>
    </div>
  );
}
