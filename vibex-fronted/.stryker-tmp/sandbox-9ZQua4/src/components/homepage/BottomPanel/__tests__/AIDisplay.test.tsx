/**
 * AIDisplay Tests
 * Epic 7: AI 展示区
 * ST-7.1: 三列卡片布局
 * ST-7.2: 卡片内容填充
 * ST-7.3: 卡片点击展开详情
 */
// @ts-nocheck


import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AIDisplay } from '../AIDisplay';

describe('AIDisplay', () => {
  describe('ST-7.1: 三列卡片布局', () => {
    it('渲染三个卡片', () => {
      render(<AIDisplay />);
      const cards = screen.getAllByRole('button');
      expect(cards).toHaveLength(3);
    });

    it('data-testid="ai-display"', () => {
      render(<AIDisplay />);
      expect(screen.getByTestId('ai-display')).toBeInTheDocument();
    });
  });

  describe('ST-7.2: 卡片内容填充', () => {
    it('第一个卡片: 智能诊断', () => {
      render(<AIDisplay />);
      const cards = screen.getAllByRole('button');
      expect(cards[0]).toHaveTextContent('智能诊断');
      expect(cards[0]).toHaveTextContent('🔍');
    });

    it('第二个卡片: 应用优化', () => {
      render(<AIDisplay />);
      const cards = screen.getAllByRole('button');
      expect(cards[1]).toHaveTextContent('应用优化');
      expect(cards[1]).toHaveTextContent('✨');
    });

    it('第三个卡片: AI对话澄清', () => {
      render(<AIDisplay />);
      const cards = screen.getAllByRole('button');
      expect(cards[2]).toHaveTextContent('AI对话澄清');
      expect(cards[2]).toHaveTextContent('💬');
    });

    it('诊断数量 badge', () => {
      render(<AIDisplay diagnosisCount={5} />);
      const cards = screen.getAllByRole('button');
      expect(cards[0]).toHaveTextContent('5');
    });

    it('优化数量 badge', () => {
      render(<AIDisplay optimizeCount={3} />);
      const cards = screen.getAllByRole('button');
      expect(cards[1]).toHaveTextContent('3');
    });

    it('对话澄清轮次 badge', () => {
      render(<AIDisplay clarificationRounds={2} />);
      const cards = screen.getAllByRole('button');
      expect(cards[2]).toHaveTextContent('2');
    });

    it('数量为 0 时不显示 badge', () => {
      render(<AIDisplay diagnosisCount={0} optimizeCount={0} clarificationRounds={0} />);
      const cards = screen.getAllByRole('button');
      // badge 仅在 count > 0 时显示
      cards.forEach(card => {
        // Badge class should not appear
        const badge = card.querySelector('[class*="badge"]');
        expect(badge).toBeNull();
      });
    });
  });

  describe('ST-7.3: 卡片点击', () => {
    it('诊断卡片点击调用 onDiagnose', () => {
      const onDiagnose = jest.fn();
      render(<AIDisplay onDiagnose={onDiagnose} />);
      const cards = screen.getAllByRole('button');
      fireEvent.click(cards[0]);
      expect(onDiagnose).toHaveBeenCalledTimes(1);
    });

    it('优化卡片点击调用 onOptimize', () => {
      const onOptimize = jest.fn();
      render(<AIDisplay onOptimize={onOptimize} />);
      const cards = screen.getAllByRole('button');
      fireEvent.click(cards[1]);
      expect(onOptimize).toHaveBeenCalledTimes(1);
    });

    it('对话澄清卡片点击调用 onClarify', () => {
      const onClarify = jest.fn();
      render(<AIDisplay onClarify={onClarify} />);
      const cards = screen.getAllByRole('button');
      fireEvent.click(cards[2]);
      expect(onClarify).toHaveBeenCalledTimes(1);
    });
  });
});
