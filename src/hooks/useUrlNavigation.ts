import { useState, useEffect } from 'react';
import { Id } from '../../convex/_generated/dataModel';

export interface NavigationState {
  activeTab: string;
  selectedMemberId: Id<"councilMembers"> | null;
  selectedQuestionId: Id<"questions"> | null;
  selectedNewsId: Id<"news"> | null;
}

export function useUrlNavigation() {
  const [state, setState] = useState<NavigationState>({
    activeTab: "dashboard",
    selectedMemberId: null,
    selectedQuestionId: null,
    selectedNewsId: null,
  });

  // URLからパラメータを読み取る関数
  const parseUrlParams = (): NavigationState => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab') || 'dashboard';
    const memberId = params.get('member') as Id<"councilMembers"> | null;
    const questionId = params.get('question') as Id<"questions"> | null;
    const newsId = params.get('news') as Id<"news"> | null;

    return {
      activeTab: tab,
      selectedMemberId: memberId,
      selectedQuestionId: questionId,
      selectedNewsId: newsId,
    };
  };

  // URLパラメータを更新する関数
  const updateUrl = (newState: Partial<NavigationState>) => {
    const params = new URLSearchParams();
    
    // activeTabは常に設定
    if (newState.activeTab) {
      params.set('tab', newState.activeTab);
    } else if (state.activeTab) {
      params.set('tab', state.activeTab);
    }

    // 選択されたアイテムのIDを設定
    if (newState.selectedMemberId) {
      params.set('member', newState.selectedMemberId);
    }
    if (newState.selectedQuestionId) {
      params.set('question', newState.selectedQuestionId);
    }
    if (newState.selectedNewsId) {
      params.set('news', newState.selectedNewsId);
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState(null, '', newUrl);
  };

  // 初期化時にURLパラメータを読み取り
  useEffect(() => {
    const initialState = parseUrlParams();
    setState(initialState);
  }, []);

  // ブラウザの戻る/進むボタンに対応
  useEffect(() => {
    const handlePopState = () => {
      const newState = parseUrlParams();
      setState(newState);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 状態更新関数
  const updateState = (newState: Partial<NavigationState>) => {
    const updatedState = { ...state, ...newState };
    setState(updatedState);
    updateUrl(updatedState);
  };

  // 個別の更新関数
  const setActiveTab = (tab: string) => {
    // タブ変更時は選択されたアイテムをクリア
    const newState: NavigationState = {
      activeTab: tab,
      selectedMemberId: null,
      selectedQuestionId: null,
      selectedNewsId: null,
    };
    setState(newState);
    updateUrl(newState);
  };

  const setSelectedMemberId = (memberId: Id<"councilMembers"> | null) => {
    const newState = {
      ...state,
      selectedMemberId: memberId,
      selectedQuestionId: null, // 議員選択時は質問選択をクリア
      selectedNewsId: null,
      activeTab: memberId ? 'members' : state.activeTab,
    };
    setState(newState);
    updateUrl(newState);
  };

  const setSelectedQuestionId = (questionId: Id<"questions"> | null) => {
    const newState = {
      ...state,
      selectedQuestionId: questionId,
      selectedNewsId: null,
      activeTab: questionId ? 'questions' : state.activeTab,
    };
    setState(newState);
    updateUrl(newState);
  };

  const setSelectedNewsId = (newsId: Id<"news"> | null) => {
    const newState = {
      ...state,
      selectedNewsId: newsId,
      selectedMemberId: null,
      selectedQuestionId: null,
      activeTab: newsId ? 'news' : state.activeTab,
    };
    setState(newState);
    updateUrl(newState);
  };

  return {
    ...state,
    setActiveTab,
    setSelectedMemberId,
    setSelectedQuestionId,
    setSelectedNewsId,
    updateState,
  };
}
