/**
 * 🏷️ Timeline组件的数据类型定义
 * 
 * 这个文件定义了Timeline组件使用的所有数据类型和接口。
 * 使用TypeScript类型可以确保数据的正确性，避免运行时错误。
 * 
 * 🎯 核心概念：
 * - BaseTimelineItem：最基本的时间线项目，只需要4个字段
 * - TimelineItem<T>：可扩展的时间线项目，支持自定义字段
 * - SortedTimelineData：分组后的时间线数据结构
 * 
 * 💡 使用示例：
 * interface MyProject extends BaseTimelineItem {
 *   priority: 'High' | 'Medium' | 'Low';
 *   team: string;
 * }
 * 
 * const project: MyProject = {
 *   id: "1",
 *   name: "网站重构", 
 *   startDate: new Date("2024-01-01"),
 *   endDate: new Date("2024-03-01"),
 *   priority: "High",
 *   team: "前端团队"
 * };
 */

import React from "react";
import type { RainbowColorVar, SemanticColorVar } from "../../../styles/color";
import { getSemanticColor } from "../../../styles/color";

/**
 * Timeline 颜色类型 - 支持以下三种颜色使用方式：
 * 
 * ✅ 支持的使用方式:
 * 1. getRainbowColor('rose') → 返回 '--color-chart--rainbow-rose' (设计系统 Rainbow 颜色)
 * 2. getSemanticColor('success') → 返回 '--color--semantic-success' (设计系统 Semantic 颜色)
 * 3. 直接 CSS 颜色值，包括：
 *    - '#fafafa' (十六进制颜色)
 *    - 'var(--my-custom-var)' (CSS 变量函数)
 *    - 'rgba(255, 255, 255, 0.5)' (其他 CSS 颜色格式)
 * 
 * 📝 示例用法:
 * ```typescript
 * const colorMap = {
 *   high: { name: "High", color: getRainbowColor('rose') },
 *   medium: { name: "Medium", color: getSemanticColor('warning') },
 *   custom: { name: "Custom", color: '#ff6b6b' }
 * };
 * ```
 */
export type TimelineColorType = RainbowColorVar | SemanticColorVar | string;

/**
 * 进度条颜色配置
 * @property {number} upto - 进度上限 (0-100]
 * @property {TimelineColorType} color - 颜色
 */
export interface ProgressColorStop {
  upto: number;
  color: TimelineColorType;
}

// 基础时间线项目接口 - 只包含四个必需字段
export interface BaseTimelineItemType {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

// 基础字段键
export const BaseTimelineItemKeys = {
  ID: 'id',
  NAME: 'name',
  START_DATE: 'startDate',
  END_DATE: 'endDate',
} as const;

// 通用时间线项目类型 - 支持泛型扩展
export type TimelineItemType<T = Record<string, unknown>> = BaseTimelineItemType & T;

// 字段显示类型枚举
export type FieldDisplayType = 'icon' | 'progress' | 'tag';

// 字段显示配置接口
export interface FieldDisplayConfig<T = Record<string, unknown>> {
  /** 数据字段名 */
  field: keyof T;
  /** 显示类型 */
  displayType: FieldDisplayType;
  /** 
   * 字段值到显示属性的映射函数或对象
   * - 对于 icon: 返回 { iconName: string, color?: string }
   * - 对于 progress: 返回 { value: number, color?: string }
   * - 对于 tag: 返回 { text: string, color?: string, variant?: 'contained' | 'outlined' }
   */
  mapping?: 
    | ((value: unknown) => Record<string, unknown>)
    | Record<string, Record<string, unknown>>;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 是否显示（可以是函数动态判断） */
  visible?: boolean | ((item: TimelineItemType<T>) => boolean);
}

// Timeline 项目显示配置
export interface TimelineItemDisplayConfig<T = Record<string, unknown>> {
  /** 图形信息区域的字段配置 */
  graphicFields?: FieldDisplayConfig<T>[];
  /** 标签区域的字段配置 */
  tagFields?: FieldDisplayConfig<T>[];
}

// 分组数据结构 - 通用化
export interface TimelineGroupType<T = Record<string, unknown>> {
  groupTitle: string;
  groupItems: TimelineItemType<T>[];
}

// 排序后的时间线数据结构 - 通用化
export interface SortedTimelineDataType<T = Record<string, unknown>> {
  meta: {
    sortBy: keyof (BaseTimelineItemType & T);
  };
  data: TimelineGroupType<T>[];
}

export interface ZoomLevelType {
  label: string;
  dayWidth: number;
  setAsDefault?: boolean;
}

// 分组选项配置
export interface GroupByOption<T = Record<string, unknown>> {
  /** 显示标签 */
  label: string;
  /** 分组字段 */
  field: keyof (BaseTimelineItemType & T);
  /** 是否为默认选项 */
  setAsDefault?: boolean;
}

// Timeline 组件 Props 接口
export interface TimelineProps<T = Record<string, unknown>> {
  /** 项目显示配置 */
  init?: TimelineItemDisplayConfig<T>;
  /** 输入数据 - 可以是原始数据数组或已分组的数据 */
  inputData: SortedTimelineDataType<T> | TimelineItemType<T>[];
  /** 分组字段（当 inputData 是原始数据数组时使用） */
  groupBy?: keyof (BaseTimelineItemType & T);
  /** 分组选项配置 - 支持用户动态切换分组方式 */
  groupByOptions?: GroupByOption<T>[];
  zoomLevels?: ZoomLevelType[];
  fetchByTimeInterval?: [Date, Date];
  onItemClick?: (item: TimelineItemType<T>) => void;
  /** Current zoom level (optional - managed internally if not provided) */
  currentZoom?: string;
  /**
   * 当未启用缩放功能时，设置每天的默认宽度（单位：像素）。
   * 如果提供了 `zoomLevels`，此属性将被忽略。
   * @default 12
   */
  defaultDayWidth?: number;
}

// 预定义的常用映射函数
export const CommonFieldMappings = {
  /** 进度值映射 (0-100) */
  progress: (value: number) => ({
    value: Math.max(0, Math.min(100, value)),
    showText: true,
  }),
  
  /** 状态到颜色的映射 */
  statusColor: (colorMap: Record<string, { name: string; color: TimelineColorType; icon?: string }>) => 
    (value: string) => colorMap[value] || { name: value, color: 'gray' },
    
  /** 简单的文本标签映射 */
  textTag: (value: unknown) => ({
    text: String(value),
    variant: 'contained' as const,
  }),
};

// 🚀 新的改进版映射函数库
export const FieldMappers = {
  /** 从对象映射生成标签 */
  fromMap: (map: Record<string, { name: string; color: TimelineColorType; icon?: string }>) => 
    (value: unknown) => ({
      text: map[String(value)]?.name || String(value),
      color: map[String(value)]?.color || 'gray',
    }),
  
  /** 进度条映射 */
  progress: (options?: { showText?: boolean; progressColors?: ProgressColorStop[] }) => 
    (value: unknown) => {
      const progressValue = Math.max(0, Math.min(100, Number(value) || 0));
      let progressColor: TimelineColorType | undefined = undefined;

      if (options?.progressColors && options.progressColors.length > 0) {
        // 从小到大排序，确保先匹配到最小的 upto
        const sortedColors = [...options.progressColors].sort((a, b) => a.upto - b.upto);
        const matchedColor = sortedColors.find(stop => progressValue <= stop.upto);
        if (matchedColor) {
          // 如果颜色值是 CSS 变量名（以 '--' 开头），则用 var() 包裹
          progressColor = matchedColor.color.startsWith('--') 
            ? `var(${matchedColor.color})` 
            : matchedColor.color;
        }
      }

      // 如果没有匹配到自定义颜色，使用默认逻辑
      if (!progressColor) {
        if (progressValue < 100) {
          progressColor = `var(${getSemanticColor('active')})`;
        } else {
          progressColor = `var(${getSemanticColor('success')})`;
        }
      }

      return {
        value: progressValue,
        showText: options?.showText ?? true,
        color: progressColor,
      };
    },
  
  /** 图标映射 */
  iconFromMap: (map: Record<string, { icon?: string; color: TimelineColorType; name?: string }>) => 
    (value: unknown) => {
      const mapValue = map[String(value)];
      return {
        iconName: mapValue?.icon || 'help',
        color: mapValue?.color || 'gray',
      };
    },
  
  /** 简单文本映射 */
  text: (options?: { color?: TimelineColorType; variant?: 'contained' | 'outlined' }) => 
    (value: unknown) => ({
      text: String(value),
      ...(options?.color && { color: options.color }),
      ...(options?.variant && { variant: options.variant }),
    }),
};

// 🎯 简化配置对象创建函数
export const createFieldConfig = {
  /** 创建进度条字段配置 */
  progress: <T>(field: keyof T, options?: { showText?: boolean; progressColors?: ProgressColorStop[] }) => ({
    field,
    displayType: 'progress' as const,
    mapping: FieldMappers.progress(options),
    visible: true,
  }),
  
  /** 创建图标字段配置 */
  iconFromMap: <T>(field: keyof T, map: Record<string, { icon?: string; color: TimelineColorType }>) => ({
    field,
    displayType: 'icon' as const,
    mapping: FieldMappers.iconFromMap(map),
    visible: true,
  }),
  
  /** 创建标签字段配置 */
  tagFromMap: <T>(field: keyof T, map: Record<string, { name: string; color: TimelineColorType }>, options?: {
    variant?: 'contained' | 'outlined';
    hideValue?: unknown;
  }) => ({
    field,
    displayType: 'tag' as const,
    mapping: FieldMappers.fromMap(map),
    visible: options?.hideValue !== undefined ? 
      (item: TimelineItemType<T>) => item[field] !== options.hideValue : 
      true,
    ...(options?.variant && { variant: options.variant }),
  }),
  
  /** 创建简单文本标签配置 */
  simpleTag: <T>(field: keyof T, options?: { 
    color?: TimelineColorType; 
    variant?: 'contained' | 'outlined';
    hideValue?: unknown;
  }) => ({
    field,
    displayType: 'tag' as const,
    mapping: FieldMappers.text(options),
    visible: options?.hideValue !== undefined ? 
      (item: TimelineItemType<T>) => item[field] !== options.hideValue : 
      true,
  }),
};

// 🏗️ Timeline配置构建器类
export class TimelineConfigBuilder<T = Record<string, unknown>> {
  private config: TimelineItemDisplayConfig<T> = { 
    graphicFields: [], 
    tagFields: [] 
  };

  addProgress(field: keyof T, options?: { showText?: boolean; progressColors?: ProgressColorStop[] }) {
    this.config.graphicFields?.push(createFieldConfig.progress(field, options));
    return this;
  }

  addIcon(field: keyof T, map: Record<string, { icon?: string; color: TimelineColorType }>) {
    this.config.graphicFields?.push(createFieldConfig.iconFromMap(field, map));
    return this;
  }

  addTag(
    field: keyof T, 
    map: Record<string, { name: string; color: TimelineColorType }>, 
    options?: {
      variant?: 'contained' | 'outlined';
      hideValue?: unknown;
    }
  ) {
    this.config.tagFields?.push(createFieldConfig.tagFromMap(field, map, options));
    return this;
  }

  addSimpleTag(field: keyof T, options?: { 
    color?: TimelineColorType; 
    variant?: 'contained' | 'outlined';
    hideValue?: unknown;
  }) {
    this.config.tagFields?.push(createFieldConfig.simpleTag(field, options));
    return this;
  }

  build(): TimelineItemDisplayConfig<T> {
    return this.config;
  }
} 