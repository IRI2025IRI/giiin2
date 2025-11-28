import { useState, useEffect } from "react";
import { Id } from "../../convex/_generated/dataModel";

export function useUrlNavigation() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedMemberId, setSelectedMemberId] = useState<Id<"councilMembers"> | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<Id<"questions"> | null>(null);
  const [selectedNewsId, setSelectedNewsId] = useState<Id<"news"> | null>(null);

  // URLからパラメータを読み取る
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    const memberId = params.get("member");
    const questionId = params.get("question");
    const newsId = params.get("news");

    if (tab) {
      // 後方互換性のため "rankings" を "joho" にマッピング
      if (tab === "rankings") {
        setActiveTab("joho");
      } else {
        setActiveTab(tab);
      }
    }
    if (memberId) {
      setSelectedMemberId(memberId as Id<"councilMembers">);
    }
    if (questionId) {
      setSelectedQuestionId(questionId as Id<"questions">);
    }
    if (newsId) {
      setSelectedNewsId(newsId as Id<"news">);
    }
  }, []);

  // URLを更新する関数
  const updateURL = (
    tab: string,
    memberId?: Id<"councilMembers"> | null,
    questionId?: Id<"questions"> | null,
    newsId?: Id<"news"> | null
  ) => {
    const params = new URLSearchParams();
    
    // "joho" をそのままURLに保存
    if (tab !== "dashboard") {
      params.set("tab", tab);
    }
    
    if (memberId) {
      params.set("member", memberId);
    }
    if (questionId) {
      params.set("question", questionId);
    }
    if (newsId) {
      params.set("news", newsId);
    }

    const newURL = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState({}, "", newURL);
  };

  // タブ変更時にURLを更新
  const handleSetActiveTab = (tab: string) => {
    setActiveTab(tab);
    updateURL(tab, selectedMemberId, selectedQuestionId, selectedNewsId);
  };

  // メンバー選択時にURLを更新
  const handleSetSelectedMemberId = (memberId: Id<"councilMembers"> | null) => {
    setSelectedMemberId(memberId);
    if (memberId) {
      setActiveTab("members");
      updateURL("members", memberId, null, selectedNewsId);
    } else {
      updateURL(activeTab, null, selectedQuestionId, selectedNewsId);
    }
  };

  // 質問選択時にURLを更新
  const handleSetSelectedQuestionId = (questionId: Id<"questions"> | null) => {
    setSelectedQuestionId(questionId);
    if (questionId) {
      setActiveTab("questions");
      updateURL("questions", selectedMemberId, questionId, selectedNewsId);
    } else {
      updateURL(activeTab, selectedMemberId, null, selectedNewsId);
    }
  };

  // ニュース選択時にURLを更新
  const handleSetSelectedNewsId = (newsId: Id<"news"> | null) => {
    setSelectedNewsId(newsId);
    if (newsId) {
      setActiveTab("news");
      updateURL("news", selectedMemberId, selectedQuestionId, newsId);
    } else {
      updateURL(activeTab, selectedMemberId, selectedQuestionId, null);
    }
  };

  return {
    activeTab,
    selectedMemberId,
    selectedQuestionId,
    selectedNewsId,
    setActiveTab: handleSetActiveTab,
    setSelectedMemberId: handleSetSelectedMemberId,
    setSelectedQuestionId: handleSetSelectedQuestionId,
    setSelectedNewsId: handleSetSelectedNewsId,
  };
}
