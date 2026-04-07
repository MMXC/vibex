/**
 * Step 1: Clarification Page
 * 需求澄清 - 智能模板推荐集成
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSmartRecommenderStore, Recommendation } from '@/stores/smartRecommenderStore';
import { initOfflineListener } from '@/utils/design/fallbackStrategy';
import { DesignStepLayout } from '@/components/design/DesignStepLayout';
import { extractKeywords, KeywordExtractionResult } from '@/utils/design/keywordExtractor';

export default function ClarificationPage() {
  const [requirementInput, setRequirementInput] = useState('');
  const [keywords, setKeywords] = useState<KeywordExtractionResult | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // 初始化离线监听
  useEffect(() => {
    const cleanup = initOfflineListener();
    return cleanup;
  }, []);

  // 检查离线状态
  useEffect(() => {
    setIsOffline(typeof navigator !== 'undefined' && !navigator.onLine);
  }, []);

  // 处理输入变化（带防抖）
  useEffect(() => {
    if (requirementInput.length < 2) {
      setKeywords(null);
      setRecommendations([]);
      return;
    }

    const timer = setTimeout(() => {
      // 提取关键词
      const extracted = extractKeywords(requirementInput);
      setKeywords(extracted);

      // 简单的本地匹配（无需 Fuse.js）
      const templateMap: Record<string, { name: string; keywords: string[] }> = {
        'ecommerce': { name: '电商平台', keywords: ['电商', '商品', '购物车', '订单', '支付'] },
        'user-management': { name: '用户管理系统', keywords: ['用户', '注册', '登录', '权限', '角色'] },
        'oa': { name: 'OA 办公系统', keywords: ['OA', '办公', '审批', '考勤'] },
        'crm': { name: 'CRM系统', keywords: ['CRM', '客户', '销售', '线索', '商机'] },
        'blog': { name: '博客系统', keywords: ['博客', '文章', '评论', '标签'] },
        'education': { name: '在线教育平台', keywords: ['教育', '课程', '学习', '考试'] },
        'social': { name: '社交应用', keywords: ['社交', '好友', '关注', '动态'] },
      };

      const matched: Recommendation[] = [];
      for (const [id, template] of Object.entries(templateMap)) {
        const matchedKw = template.keywords.filter(kw => 
          requirementInput.toLowerCase().includes(kw.toLowerCase())
        );
        if (matchedKw.length > 0) {
          matched.push({
            template: { id, name: template.name, keywords: template.keywords, pattern: /./, structure: {} },
            confidence: matchedKw.length / template.keywords.length,
            reason: `匹配关键词: ${matchedKw.join(', ')}`,
            matchedKeywords: matchedKw,
          });
        }
      }

      // 按置信度排序
      matched.sort((a, b) => b.confidence - a.confidence);
      setRecommendations(matched.slice(0, 3));
    }, 300);

    return () => clearTimeout(timer);
  }, [requirementInput]);

  const handleSelectTemplate = useCallback((templateId: string) => {
    setSelectedTemplate(templateId);
  }, []);

  return (
    <DesignStepLayout currentStep={1}>
    <div className="design-step">
      <h1>需求澄清</h1>

      {/* 离线提示 */}
      {isOffline && (
        <div className="offline-banner">
          ⚠️ 当前处于离线模式，使用缓存推荐
        </div>
      )}

      {/* 关键词展示 */}
      {keywords && keywords.keywords.length > 0 && (
        <div className="keywords-section">
          <h3>检测到关键词</h3>
          <div className="keyword-tags">
            {keywords.keywords.slice(0, 6).map((kw, idx) => (
              <span key={idx} className="keyword-tag">
                {kw.keyword} ({kw.category})
              </span>
            ))}
          </div>
          {keywords.industries.length > 0 && (
            <p className="industry-detected">行业: {keywords.industries.join(', ')}</p>
          )}
        </div>
      )}

      {/* 输入区域 */}
      <div className="input-section">
        <label htmlFor="requirement">描述你的需求</label>
        <textarea
          id="requirement"
          value={requirementInput}
          onChange={(e) => setRequirementInput(e.target.value)}
          placeholder="例如：我想做一个电商平台，包含商品展示、购物车、订单管理和支付功能..."
          rows={5}
        />
      </div>

      {/* 智能推荐 */}
      {recommendations.length > 0 && (
        <div className="recommendations-section">
          <h3>🎯 智能推荐</h3>
          <p className="recommendation-hint">根据你的描述，推荐以下模板</p>
          
          <div className="recommendation-list">
            {recommendations.map((rec) => (
              <div 
                key={rec.template.id}
                className={`recommendation-card ${selectedTemplate === rec.template.id ? 'selected' : ''}`}
                onClick={() => handleSelectTemplate(rec.template.id)}
              >
                <div className="rec-header">
                  <span className="rec-name">{rec.template.name}</span>
                  <span className="rec-confidence">
                    {Math.round(rec.confidence * 100)}% 匹配
                  </span>
                </div>
                <p className="rec-reason">{rec.reason}</p>
                {rec.matchedKeywords.length > 0 && (
                  <div className="rec-keywords">
                    {rec.matchedKeywords.map(kw => (
                      <span key={kw} className="rec-kw">{kw}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {requirementInput.length >= 5 && recommendations.length === 0 && (
        <div className="no-recommendation">
          <p>未找到匹配的模板</p>
          <p className="hint">试试输入更详细的描述，如"用户登录注册"、"商品管理等"</p>
        </div>
      )}

      <style jsx>{`
        .design-step {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .step-description {
          color: #666;
          margin-bottom: 2rem;
        }

        .offline-banner {
          background: #fff3cd;
          color: #856404;
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1.5rem;
        }

        .keywords-section {
          background: #f8f9fa;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
        }

        .keyword-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .keyword-tag {
          background: #e3f2fd;
          color: #1565c0;
          padding: 0.25rem 0.75rem;
          border-radius: 16px;
          font-size: 0.875rem;
        }

        .industry-detected {
          margin-top: 0.75rem;
          color: #666;
          font-size: 0.875rem;
        }

        .input-section {
          margin-bottom: 2rem;
        }

        .input-section label {
          display: block;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .input-section textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
          resize: vertical;
        }

        .input-section textarea:focus {
          outline: none;
          border-color: #1976d2;
        }

        .recommendations-section {
          background: #f0f7ff;
          padding: 1.5rem;
          border-radius: 8px;
          border: 1px solid #e3f2fd;
        }

        .recommendations-section h3 {
          margin: 0 0 0.5rem 0;
        }

        .recommendation-hint {
          color: #666;
          margin-bottom: 1rem;
        }

        .recommendation-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .recommendation-card {
          background: white;
          padding: 1rem;
          border-radius: 8px;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
        }

        .recommendation-card:hover {
          border-color: #90caf9;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .recommendation-card.selected {
          border-color: #1976d2;
          background: #e3f2fd;
        }

        .rec-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .rec-name {
          font-weight: 600;
        }

        .rec-confidence {
          color: #2e7d32;
          font-size: 0.875rem;
        }

        .rec-reason {
          color: #666;
          font-size: 0.875rem;
          margin: 0 0 0.5rem 0;
        }

        .rec-keywords {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
        }

        .rec-kw {
          background: #e8f5e9;
          color: #2e7d32;
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .no-recommendation {
          text-align: center;
          padding: 2rem;
          color: #666;
        }

        .no-recommendation .hint {
          font-size: 0.875rem;
          color: #999;
        }
      `}</style>
    </div>
    </DesignStepLayout>
  );
}
