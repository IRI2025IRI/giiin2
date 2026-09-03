import type { ReactNode } from "react";

// 1行のテキスト中の特定フレーズだけをReact要素に置き換える（HTML注入なし）
export function highlightPhrase(nodes: ReactNode[], phrase: string, className: string): ReactNode[] {
  const result: ReactNode[] = [];
  nodes.forEach((node) => {
    if (typeof node !== "string") {
      result.push(node);
      return;
    }
    const segments = node.split(phrase);
    segments.forEach((segment, i) => {
      if (i > 0) {
        result.push(
          <span key={`${phrase}-${result.length}`} className={className}>{phrase}</span>
        );
      }
      if (segment) result.push(segment);
    });
  });
  return result;
}

// 回答内容の「質問側の内容」「市側の回答」キーワードを装飾する
export function formatResponseContent(content: string) {
  return content.split("\n").map((line, lineIndex) => {
    let parts: ReactNode[] = [line];

    if (line.includes("質問側の内容")) {
      parts = highlightPhrase(parts, "質問側の内容", "ga-kw q");
    }

    if (line.includes("市側の回答")) {
      parts = highlightPhrase(parts, "市側の回答", "ga-kw a");
    }

    return <div key={lineIndex} className="mb-1">{parts}</div>;
  });
}
