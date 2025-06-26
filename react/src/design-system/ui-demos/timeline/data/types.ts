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
import type { RainbowColorVar, SemanticColorVar } from "../../../../styles/color";

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

// Timeline 配置接口
export interface TimelineConfigType<TExtended = Record<string, unknown>> {
  dataType?: TExtended;
  groupBy?: keyof (BaseTimelineItemType & TExtended);
  /** 项目显示配置 */
  itemDisplayConfig?: TimelineItemDisplayConfig<TExtended>;
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

// Timeline 组件 Props 接口
export interface TimelineProps<T = Record<string, unknown>> {
  init?: TimelineConfigType<T>;
  inputData: SortedTimelineDataType<T>;
  onGroupByChange?: (groupBy: keyof (BaseTimelineItemType & T)) => void;
  onItemClick?: (item: TimelineItemType<T>) => void;
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
  progress: (options?: { showText?: boolean; color?: TimelineColorType }) => 
    (value: unknown) => ({
      value: Math.max(0, Math.min(100, Number(value) || 0)),
      showText: options?.showText ?? true,
      ...(options?.color && { color: options.color }),
    }),
  
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
  progress: <T>(field: keyof T, options?: { showText?: boolean; color?: TimelineColorType }) => ({
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
  tagFromMap: <T>(
    field: keyof T, 
    map: Record<string, { name: string; color: TimelineColorType }>, 
    options?: {
      variant?: 'contained' | 'outlined';
      hideValue?: unknown;
      color?: TimelineColorType;
    }
  ) => ({
    field,
    displayType: 'tag' as const,
    mapping: (value: unknown) => ({
      text: map[String(value)]?.name || String(value),
      color: options?.color || map[String(value)]?.color || 'gray',
      variant: options?.variant || 'contained',
    }),
    visible: options?.hideValue !== undefined ? 
      (item: unknown) => (item as Record<string, unknown>)[String(field)] !== options.hideValue : true,
  }),
  
  /** 创建简单文本标签配置 */
  tag: <T>(field: keyof T, options?: { 
    color?: TimelineColorType; 
    variant?: 'contained' | 'outlined';
    hideValue?: unknown;
  }) => ({
    field,
    displayType: 'tag' as const,
    mapping: FieldMappers.text({ color: options?.color, variant: options?.variant }),
    visible: options?.hideValue !== undefined ? 
      (item: unknown) => (item as Record<string, unknown>)[String(field)] !== options.hideValue : true,
  }),
};

// 📋 预设模板
export const TimelineTemplates = {
  /** 项目管理模板 */
  projectManagement: <T>(dataMaps: {
    status?: Record<string, { name: string; color: TimelineColorType }>;
    team?: Record<string, { name: string; color: TimelineColorType }>;
    priority?: Record<string, { icon?: string; color: TimelineColorType; name?: string }>;
  }) => ({
    graphicFields: [
      createFieldConfig.progress<T>('progress' as keyof T),
      ...(dataMaps.priority ? [createFieldConfig.iconFromMap<T>('priority' as keyof T, dataMaps.priority)] : []),
    ] as FieldDisplayConfig<T>[],
    tagFields: [
      ...(dataMaps.status ? [createFieldConfig.tagFromMap<T>('status' as keyof T, dataMaps.status)] : []),
      ...(dataMaps.team ? [createFieldConfig.tagFromMap<T>('team' as keyof T, dataMaps.team)] : []),
    ] as FieldDisplayConfig<T>[],
  }),
  
  /** 任务管理模板 */
  taskManagement: <T>(dataMaps: {
    assignee?: Record<string, { name: string; color: TimelineColorType }>;
    priority?: Record<string, { name: string; color: TimelineColorType }>;
    status?: Record<string, { name: string; color: TimelineColorType }>;
  }) => ({
    graphicFields: [
      createFieldConfig.progress<T>('progress' as keyof T, { showText: true }),
    ] as FieldDisplayConfig<T>[],
    tagFields: [
      ...(dataMaps.assignee ? [createFieldConfig.tagFromMap<T>('assignee' as keyof T, dataMaps.assignee)] : []),
      ...(dataMaps.priority ? [createFieldConfig.tagFromMap<T>('priority' as keyof T, dataMaps.priority)] : []),
      ...(dataMaps.status ? [createFieldConfig.tagFromMap<T>('status' as keyof T, dataMaps.status)] : []),
    ] as FieldDisplayConfig<T>[],
  }),
};

// 🔧 配置构建器类
export class TimelineConfigBuilder<T = Record<string, unknown>> {
  private config: TimelineItemDisplayConfig<T> = { 
    graphicFields: [], 
    tagFields: [] 
  };
  
  /** 添加进度条字段 */
  addProgress(field: keyof T, options?: { showText?: boolean; color?: TimelineColorType }) {
    this.config.graphicFields?.push(createFieldConfig.progress<T>(field, options));
    return this;
  }
  
  /** 添加图标字段 */
  addIcon(field: keyof T, map: Record<string, { icon?: string; color: TimelineColorType }>) {
    this.config.graphicFields?.push(createFieldConfig.iconFromMap<T>(field, map));
    return this;
  }
  
  /** 添加标签字段 */
  addTag(
    field: keyof T, 
    map: Record<string, { name: string; color: TimelineColorType }>, 
    options?: {
      variant?: 'contained' | 'outlined';
      hideValue?: unknown;
    }
  ) {
    this.config.tagFields?.push(createFieldConfig.tagFromMap<T>(field, map, options));
    return this;
  }
  
  /** 添加简单文本标签 */
  addSimpleTag(field: keyof T, options?: { 
    color?: TimelineColorType; 
    variant?: 'contained' | 'outlined';
    hideValue?: unknown;
  }) {
    this.config.tagFields?.push(createFieldConfig.tag<T>(field, options));
    return this;
  }
  
  /** 构建最终配置 */
  build(): TimelineItemDisplayConfig<T> {
    return this.config;
  }
}

 