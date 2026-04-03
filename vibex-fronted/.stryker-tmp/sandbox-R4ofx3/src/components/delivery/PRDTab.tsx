/**
 * PRDTab - PRD 导出 Tab
 */
// @ts-nocheck


'use client';

import React, { useState } from 'react';
import { useDeliveryStore } from '@/stores/deliveryStore';
import { FileText } from 'lucide-react';
import styles from './delivery.module.css';

const PRD_SECTIONS = [
  {
    id: 'overview',
    title: '项目概述',
    content: `## 项目概述

- 项目名称: 电商系统
- 领域: 电商平台
- 核心目标: 构建高效的电商交易平台`,
  },
  {
    id: 'contexts',
    title: '限界上下文',
    content: `## 限界上下文

### 商品域
商品目录和库存管理

### 订单域
订单处理和履约

### 用户域
用户账号和权限管理`,
  },
  {
    id: 'flows',
    title: '业务流程',
    content: `## 业务流程

### 下单流程
1. 用户浏览商品
2. 加入购物车
3. 确认订单
4. 发起支付
5. 支付成功

### 注册流程
1. 填写注册信息
2. 验证邮箱
3. 完成注册`,
  },
  {
    id: 'components',
    title: '组件架构',
    content: `## 组件架构

### 商品服务
商品相关业务逻辑

### 订单控制器
订单 API 接口

### 用户仓储
用户数据持久化`,
  },
];

export function PRDTab() {
  const { exportItem, isExporting, exportProgress } = useDeliveryStore();
  const [showFullPRD, setShowFullPRD] = useState(false);
  
  const isCurrentExport = exportProgress?.type === 'prd';
  const isExportingPRD = isCurrentExport && exportProgress?.status === 'exporting';
  
  const handleExport = async (format: 'markdown' | 'pdf') => {
    await exportItem('prd', 'prd-main', format);
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.sectionHeader}>
        <span className={styles.count}>PRD 大纲</span>
        <div className={styles.prdExportActions}>
          <button 
            className={styles.exportBtn}
            onClick={() => handleExport('markdown')}
            disabled={isExporting}
          >
            Markdown
          </button>
          <button 
            className={styles.exportBtn}
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
          >
            PDF
          </button>
          <button className={styles.exportBtn}>
            飞书文档
          </button>
        </div>
      </div>
      
      {isExportingPRD && (
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${exportProgress?.progress || 0}%` }}
          />
        </div>
      )}
      
      <div className={styles.prdOutline}>
        {PRD_SECTIONS.map((section) => (
          <div key={section.id} className={styles.prdSection}>
            <h3 className={styles.prdSectionTitle}>
              <FileText size={16} />
              {section.title}
            </h3>
            {showFullPRD && (
              <pre className={styles.prdSectionContent}>{section.content}</pre>
            )}
          </div>
        ))}
      </div>
      
      <button 
        className={styles.previewBtn}
        onClick={() => setShowFullPRD(!showFullPRD)}
        style={{ marginTop: '16px' }}
      >
        {showFullPRD ? '收起完整 PRD' : '展开完整 PRD'}
      </button>
    </div>
  );
}
