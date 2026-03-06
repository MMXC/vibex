/**
 * TemplateRating - 模板评分组件
 * 
 * 5星评分组件，支持显示平均分和用户评分
 */

import { useState } from 'react';
import styles from './TemplateRating.module.css';

export interface TemplateRatingProps {
  value?: number;           // 当前评分 (0-5)
  average?: number;         // 平均评分
  count?: number;           // 评分次数
  onChange?: (rating: number) => void;  // 评分变化回调
  readonly?: boolean;        // 只读模式
  size?: 'small' | 'medium' | 'large';
}

export function TemplateRating({ 
  value = 0, 
  average, 
  count = 0, 
  onChange,
  readonly = false,
  size = 'medium'
}: TemplateRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);
  
  const displayValue = hoverValue || value;
  
  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };
  
  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };
  
  const handleMouseLeave = () => {
    setHoverValue(0);
  };
  
  return (
    <div className={`${styles.rating} ${styles[size]}`}>
      <div className={styles.stars} onMouseLeave={handleMouseLeave}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            className={`${styles.star} ${star <= displayValue ? styles.filled : ''} ${readonly ? styles.readonly : ''}`}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            disabled={readonly}
            aria-label={`${star} 星`}
          >
            ★
          </button>
        ))}
      </div>
      
      {average !== undefined && (
        <span className={styles.average}>
          {average.toFixed(1)}
        </span>
      )}
      
      {count > 0 && (
        <span className={styles.count}>
          ({count})
        </span>
      )}
    </div>
  );
}

export default TemplateRating;
