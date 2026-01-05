import { useState, useRef } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

export function DataMigration() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const [importOptions, setImportOptions] = useState({
    clearExistingData: false,
    skipDuplicates: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportAllData = useAction(api.dataMigration.exportAllData);
  const importAllData = useAction(api.dataMigration.importAllData);

  const showMessage = (msg: string, type: "success" | "error" | "info" = "info") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 10000);
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const result = await exportAllData();
      
      // JSONファイルとしてダウンロード
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `convex-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      showMessage("データのエクスポートが完了しました", "success");
    } catch (error) {
      console.error("Export error:", error);
      showMessage(`エクスポートエラー: ${error}`, "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        setSelectedFile(file);
        showMessage(`ファイル「${file.name}」が選択されました`, "info");
      } else {
        showMessage("JSONファイルを選択してください", "error");
        event.target.value = '';
      }
    }
  };

  const handleImportData = async () => {
    if (!selectedFile) {
      showMessage("インポートするファイルを選択してください", "error");
      return;
    }

    setIsImporting(true);
    try {
      // ファイルを読み込み
      const fileContent = await selectedFile.text();
      
      // データをインポート
      const result = await importAllData({
        jsonData: fileContent,
        options: importOptions
      });

      if (result.success) {
        let statsMessage = "インポート完了:\n";
        if (result.stats) {
          const tableNames: Record<string, string> = {
            councilMembers: "議員情報",
            questions: "質問",
            responses: "回答",
            news: "お知らせ",
            slideshowSlides: "スライドショー",
            faqItems: "FAQ",
            contactMessages: "お問い合わせ",
            likes: "気になる",
            userDemographics: "ユーザー属性"
          };
          
          Object.entries(result.stats).forEach(([table, stats]: [string, any]) => {
            if (stats.imported > 0 || stats.skipped > 0) {
              const displayName = tableNames[table] || table;
              statsMessage += `${displayName}: ${stats.imported}件追加, ${stats.skipped}件スキップ\n`;
            }
          });
        }
        showMessage(statsMessage, "success");
        
        // ファイル選択をリセット
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        showMessage(result.message, "error");
      }
    } catch (error) {
      console.error("Import error:", error);
      showMessage(`インポートエラー: ${error}`, "error");
    } finally {
      setIsImporting(false);
    }
  };

  const resetFileSelection = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-yellow-400 amano-text-glow">
          🔄 データ移行
        </h2>
      </div>

      {/* メッセージ表示 */}
      {message && (
        <div className={`p-4 rounded-lg border whitespace-pre-line ${
          messageType === "success" ? "bg-green-900/20 border-green-500/30 text-green-400" :
          messageType === "error" ? "bg-red-900/20 border-red-500/30 text-red-400" :
          "bg-blue-900/20 border-blue-500/30 text-blue-400"
        }`}>
          {message}
        </div>
      )}

      {/* データエクスポート */}
      <div className="amano-bg-card rounded-xl p-6 border border-purple-500/30">
        <h3 className="text-lg font-bold text-yellow-400 mb-4 amano-text-glow">
          📤 データエクスポート
        </h3>
        
        <div className="space-y-4">
          <div>
            <button
              onClick={handleExportAll}
              disabled={isExporting}
              className="auth-button w-full disabled:opacity-50"
            >
              {isExporting ? "エクスポート中..." : "全データをエクスポート"}
            </button>
            <p className="text-sm text-gray-400 mt-2">
              以下のデータをエクスポートします：<br/>
              • 議員情報 (councilMembers)<br/>
              • 質問・回答 (questions, responses)<br/>
              • お知らせ (news)<br/>
              • スライドショー (slideshowSlides)<br/>
              • FAQ (faqItems)<br/>
              • お問い合わせ (contactMessages)<br/>
              • 気になる情報 (likes)<br/>
              • ユーザー属性 (userDemographics)
            </p>
          </div>
        </div>
      </div>

      {/* データインポート */}
      <div className="amano-bg-card rounded-xl p-6 border border-purple-500/30">
        <h3 className="text-lg font-bold text-yellow-400 mb-4 amano-text-glow">
          📥 データインポート
        </h3>
        
        <div className="space-y-4">
          {/* ファイル選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              インポートファイル選択
            </label>
            <div className="flex items-center space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                ファイルを選択
              </button>
              {selectedFile && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-green-400">
                    {selectedFile.name}
                  </span>
                  <button
                    onClick={resetFileSelection}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* インポートオプション */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-300">インポートオプション</h4>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={importOptions.clearExistingData}
                onChange={(e) => setImportOptions(prev => ({
                  ...prev,
                  clearExistingData: e.target.checked
                }))}
                className="rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
              />
              <span className="text-sm text-gray-300">
                既存データをクリアしてからインポート
              </span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={importOptions.skipDuplicates}
                onChange={(e) => setImportOptions(prev => ({
                  ...prev,
                  skipDuplicates: e.target.checked
                }))}
                className="rounded border-gray-600 bg-gray-800 text-yellow-400 focus:ring-yellow-400"
              />
              <span className="text-sm text-gray-300">
                重複データをスキップ
              </span>
            </label>
          </div>

          {/* 警告メッセージ */}
          {importOptions.clearExistingData && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <span className="text-red-400">⚠️</span>
                <div className="text-sm text-red-300">
                  <p className="font-semibold mb-1">警告</p>
                  <p>既存の全データが削除されます。この操作は元に戻せません。</p>
                </div>
              </div>
            </div>
          )}

          {/* インポート実行ボタン */}
          <button
            onClick={handleImportData}
            disabled={!selectedFile || isImporting}
            className="auth-button w-full disabled:opacity-50"
          >
            {isImporting ? "インポート中..." : "データをインポート"}
          </button>
        </div>
      </div>

      {/* 改善点の説明 */}
      <div className="amano-bg-card rounded-xl p-6 border border-green-500/30">
        <h3 className="text-lg font-bold text-green-400 mb-4 amano-text-glow">
          ✨ インポート機能の改善点
        </h3>
        
        <div className="space-y-3 text-sm text-gray-300">
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
            <h4 className="font-semibold text-green-400 mb-2">🔧 修正された問題:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>質問データ:</strong> 議員名での関連付けを改善し、IDマッピングを追加</li>
              <li><strong>お知らせ・スライドショー:</strong> 現在のユーザーIDを正しく設定</li>
              <li><strong>重複チェック:</strong> より適切な条件で重複を判定</li>
              <li><strong>関連データ:</strong> IDの関連性を保持するマッピング機能を追加</li>
              <li><strong>エラーハンドリング:</strong> 詳細なログ出力で問題を特定しやすく</li>
            </ul>
          </div>
          
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
            <h4 className="font-semibold text-blue-400 mb-2">📈 改善された機能:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>議員データを最初にインポートし、IDマッピングを作成</li>
              <li>質問データで議員との関連付けを確実に実行</li>
              <li>回答データで質問との関連付けを確実に実行</li>
              <li>気になるデータで質問IDの関連付けを確認</li>
              <li>エクスポート時に関連情報（議員名、質問タイトル）を含める</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 使用方法 */}
      <div className="amano-bg-card rounded-xl p-6 border border-purple-500/30">
        <h3 className="text-lg font-bold text-yellow-400 mb-4 amano-text-glow">
          📖 使用方法
        </h3>
        
        <div className="space-y-4 text-sm text-gray-300">
          <div>
            <h4 className="font-semibold text-gray-200 mb-2">データエクスポートの手順:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>「全データをエクスポート」ボタンをクリック</li>
              <li>JSONファイルが自動的にダウンロードされます</li>
              <li>このファイルを他のConvexプロジェクトで使用できます</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-200 mb-2">データインポートの手順:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>エクスポートしたJSONファイルを選択</li>
              <li>インポートオプションを設定</li>
              <li>「データをインポート」ボタンをクリック</li>
              <li>インポート結果を確認</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-200 mb-2">インポートオプション:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>既存データをクリア:</strong> インポート前に全データを削除</li>
              <li><strong>重複データをスキップ:</strong> 同じデータがある場合は追加しない</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-gray-200 mb-2">注意点:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>ユーザーデータ（認証情報）は移行されません</li>
              <li>ファイルストレージのデータは別途移行が必要です</li>
              <li>IDの関連性を保つため、関連テーブルは順序よく移行されます</li>
              <li>大量のデータの場合、処理に時間がかかる場合があります</li>
            </ul>
          </div>

          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <span className="text-yellow-400">💡</span>
              <div className="text-sm text-yellow-300">
                <p className="font-semibold mb-1">推奨インポート手順:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>まずテスト環境でインポートを試行</li>
                  <li>「重複データをスキップ」を有効にして安全にインポート</li>
                  <li>必要に応じて「既存データをクリア」を使用</li>
                  <li>インポート後にデータの整合性を確認</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
