/**
 * DateRangePicker.tsx — E4: Template Advanced Search & Filtering
 *
 * Dual calendar date range picker for filtering templates by creation date.
 */
'use client';

import React, { useState } from 'react';
import styles from './DateRangePicker.module.css';

interface DateRange {
  start: number | null;
  end: number | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
}

const DAYS = ['日', '一', '二', '三', '四', '五', '六'];
const MONTHS = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function dateToTimestamp(year: number, month: number, day: number): number {
  return new Date(year, month, day, 0, 0, 0, 0).getTime();
}

function formatDate(ts: number | null): string {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isSameDay(ts1: number, ts2: number): boolean {
  const d1 = new Date(ts1);
  const d2 = new Date(ts2);
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = '选择日期范围',
}: DateRangePickerProps) {
  const now = new Date();
  const [leftYear, setLeftYear] = useState(now.getFullYear());
  const [leftMonth, setLeftMonth] = useState(now.getMonth());
  const [isOpen, setIsOpen] = useState(false);
  const [selecting, setSelecting] = useState<'start' | 'end'>('start');
  const [hoverDate, setHoverDate] = useState<number | null>(null);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const rightMonth = leftMonth === 11 ? 0 : leftMonth + 1;
  const rightYear = leftMonth === 11 ? leftYear + 1 : leftYear;

  const prevMonth = () => {
    if (leftMonth === 0) {
      setLeftMonth(11);
      setLeftYear(y => y - 1);
    } else {
      setLeftMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (leftMonth === 11) {
      setLeftMonth(0);
      setLeftYear(y => y + 1);
    } else {
      setLeftMonth(m => m + 1);
    }
  };

  const handleDayClick = (year: number, month: number, day: number) => {
    const ts = dateToTimestamp(year, month, day);
    if (selecting === 'start') {
      onChange({ start: ts, end: null });
      setSelecting('end');
    } else {
      if (value.start !== null && ts < value.start) {
        onChange({ start: ts, end: value.start });
      } else {
        onChange({ start: value.start, end: ts });
      }
      setSelecting('start');
      setIsOpen(false);
    }
  };

  const clearRange = () => {
    onChange({ start: null, end: null });
    setSelecting('start');
  };

  const isInRange = (ts: number): boolean => {
    if (!value.start) return false;
    const end = value.end ?? hoverDate;
    if (!end) return false;
    const [lo, hi] = value.start <= end ? [value.start, end] : [end, value.start];
    return ts > lo && ts < hi;
  };

  const isStart = (ts: number) => value.start !== null && isSameDay(ts, value.start);
  const isEnd = (ts: number) => value.end !== null && isSameDay(ts, value.end);

  const renderCalendar = (year: number, month: number) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    return (
      <div className={styles.calendar}>
        <div className={styles.monthLabel}>{MONTHS[month]} {year}</div>
        <div className={styles.weekDays}>
          {DAYS.map(d => <span key={d} className={styles.weekDay}>{d}</span>)}
        </div>
        <div className={styles.days}>
          {cells.map((day, idx) => {
            if (day === null) return <span key={`empty-${idx}`} className={styles.empty} />;
            const ts = dateToTimestamp(year, month, day);
            const isToday = isSameDay(ts, today);
            const inRange = isInRange(ts);
            const isStartDay = isStart(ts);
            const isEndDay = isEnd(ts);
            const isSelecting = selecting === 'start' ? isStartDay : isEndDay;

            return (
              <button
                key={day}
                type="button"
                className={[
                  styles.day,
                  isToday ? styles.today : '',
                  inRange ? styles.inRange : '',
                  isStartDay ? styles.startDay : '',
                  isEndDay ? styles.endDay : '',
                  isSelecting ? styles.selecting : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleDayClick(year, month, day)}
                onMouseEnter={() => selecting === 'end' && setHoverDate(ts)}
                onMouseLeave={() => selecting === 'end' && setHoverDate(null)}
                aria-label={`${year}年${month + 1}月${day}日`}
                aria-pressed={isStartDay || isEndDay}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const hasValue = value.start !== null || value.end !== null;

  return (
    <div className={styles.container}>
      {/* Trigger */}
      <button
        type="button"
        className={`${styles.trigger} ${hasValue ? styles.triggerActive : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="日期范围选择器"
      >
        <span className={styles.icon}>📅</span>
        {hasValue ? (
          <span className={styles.rangeLabel}>
            {formatDate(value.start)} ~ {formatDate(value.end)}
          </span>
        ) : (
          <span className={styles.placeholder}>{placeholder}</span>
        )}
        {hasValue && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={(e) => { e.stopPropagation(); clearRange(); }}
            aria-label="清除日期范围"
          >
            ×
          </button>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className={styles.dropdown} role="dialog" aria-label="选择日期范围">
          <div className={styles.header}>
            <span className={styles.selectingHint}>
              {selecting === 'start' ? '选择开始日期' : '选择结束日期'}
            </span>
            <button type="button" className={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
          </div>
          <div className={styles.calendars}>
            <button type="button" className={styles.navBtn} onClick={prevMonth} aria-label="上个月">‹</button>
            {renderCalendar(leftYear, leftMonth)}
            {renderCalendar(rightYear, rightMonth)}
            <button type="button" className={styles.navBtn} onClick={nextMonth} aria-label="下个月">›</button>
          </div>
        </div>
      )}
    </div>
  );
}
