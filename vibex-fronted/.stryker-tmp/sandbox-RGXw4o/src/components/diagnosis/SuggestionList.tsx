/**
 * SuggestionList - 建议列表组件
 */
// @ts-nocheck


interface SuggestionListProps {
  suggestions: string[];
}

export default function SuggestionList({ suggestions }: SuggestionListProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="suggestion-list">
      <h3>优化建议</h3>
      <ul>
        {suggestions.map((suggestion, index) => (
          <li key={index}>
            <span className="bullet">•</span>
            {suggestion}
          </li>
        ))}
      </ul>

      <style jsx>{`
        .suggestion-list {
          padding: 1rem;
          background: #fff8e1;
          border-radius: 4px;
          border-left: 4px solid #ffc107;
        }

        h3 {
          margin: 0 0 0.75rem 0;
          font-size: 1rem;
          color: #f57c00;
        }

        ul {
          margin: 0;
          padding-left: 1.25rem;
        }

        li {
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .bullet {
          color: #ffc107;
          margin-right: 0.5rem;
        }
      `}</style>
    </div>
  );
}
