'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './InputGuide.module.css';

interface InputGuideProps {
  /** 占位符提示文本 */
  placeholder?: string;
  /** 示例需求列表 */
  examples?: string[];
  /** 输入值 */
  value?: string;
  /** 输入变化回调 */
  onChange?: (value: string) => void;
  /** 提交回调 */
  onSubmit?: (value: string) => void;
  /** 最大行数 */
  maxRows?: number;
  /** 是否显示文件上传 */
  showFileUpload?: boolean;
  /** 文件上传回调 */
  onFileUpload?: (content: string, fileName: string) => void;
  /** 是否可跳过引导 */
  skippable?: boolean;
  /** 跳过回调 */
  onSkip?: () => void;
}

export function InputGuide({
  placeholder = '描述你想要创建的应用...',
  examples = [],
  value = '',
  onChange,
  onSubmit,
  maxRows = 10,
  showFileUpload = true,
  onFileUpload,
  skippable = false,
  onSkip,
}: InputGuideProps) {
  const [inputValue, setInputValue] = useState(value);
  const [showExamples, setShowExamples] = useState(!value);
  const [isDragOver, setIsDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整文本区域高度
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(
        textarea.scrollHeight,
        textarea.clientHeight * maxRows
      );
      textarea.style.height = `${Math.max(32, newHeight)}px`;
    }
  }, [maxRows]);

  useEffect(() => {
    adjustHeight();
  }, [inputValue, adjustHeight]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowExamples(newValue.length === 0);
    onChange?.(newValue);
  };

  const handleExampleClick = (example: string) => {
    setInputValue(example);
    setShowExamples(false);
    onChange?.(example);
    textareaRef.current?.focus();
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSubmit?.(inputValue.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // 文件处理
  const handleFile = useCallback(async (file: File) => {
    const validTypes = ['.txt', '.md', 'text/plain', 'text/markdown'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(ext) && !validTypes.includes(file.type)) {
      alert('仅支持 .txt 和 .md 文件');
      return;
    }

    try {
      const content = await file.text();
      onFileUpload?.(content, file.name);
      setInputValue((prev) => prev + (prev ? '\n\n' : '') + content);
      setShowExamples(false);
    } catch (err) {
      console.error('File read error:', err);
    }
  }, [onFileUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(handleFile);
  }, [handleFile]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const fileItem = items.find(item => item.type.startsWith('text/'));
    
    if (fileItem) {
      // 处理粘贴的文件
    }
  }, []);

  return (
    <div className={styles.container}>
      {/* 示例展示 */}
      {showExamples && examples.length > 0 && (
        <div className={styles.examples}>
          <div className={styles.examplesLabel}>试试这些例子：</div>
          <div className={styles.examplesList}>
            {examples.map((example, index) => (
              <button
                key={index}
                className={styles.exampleButton}
                onClick={() => handleExampleClick(example)}
                type="button"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 输入区域 */}
      <div 
        className={`${styles.inputWrapper} ${isDragOver ? styles.dragOver : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder={placeholder}
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          rows={3}
        />
        
        {/* 操作栏 */}
        <div className={styles.toolbar}>
          <div className={styles.toolbarLeft}>
            {/* 文件上传 */}
            {showFileUpload && (
              <label className={styles.uploadButton}>
                <input
                  type="file"
                  accept=".txt,.md"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  hidden
                />
                📎 上传文件
              </label>
            )}
            <span className={styles.hint}>Ctrl+Enter 提交</span>
          </div>
          
          <div className={styles.toolbarRight}>
            {skippable && onSkip && (
              <button 
                className={styles.skipButton}
                onClick={onSkip}
                type="button"
              >
                跳过
              </button>
            )}
            <button
              className={styles.submitButton}
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              type="button"
            >
              生成应用
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
