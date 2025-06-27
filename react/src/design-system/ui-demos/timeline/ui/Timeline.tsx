/* eslint-disable react-refresh/only-export-components */
/**
 * 📅 Timeline时间线主组件
 *
 * 这是设计系统中最重要的组件之一，用于展示项目或任务的时间线。
 * Timeline可以显示多个项目在时间轴上的分布，支持分组、缩放和响应式布局。
 *
 * 🎯 主要特性：
 * - 智能布局：自动避免项目重叠，垂直分层显示
 * - 分组显示：可以按团队、状态等字段分组
 * - 时间缩放：支持年、月、日三种时间视图
 * - 响应式：自适应不同屏幕尺寸
 *
 * 📊 数据要求：
 * 每个时间线项目必须包含：id（唯一标识）、name（名称）、startDate（开始日期）、endDate（结束日期）
 *
 * 💡 使用示例：
 * const data = {
 *   meta: { sortBy: 'team' },
 *   data: [{
 *     groupTitle: "开发团队",
 *     groupItems: [{
 *       id: "1", name: "项目A",
 *       startDate: new Date("2024-01-01"),
 *       endDate: new Date("2024-02-01")
 *     }]
 *   }]
 * };
 * <Timeline inputData={data} />
 */

import React, { useRef, useCallback, useMemo, useState } from "react";
import {
  type TimelineProps,
  type TimelineItemType,
  type TimelineItemDisplayConfig,
  type SortedTimelineDataType,
  type BaseTimelineItemType,
  BaseTimelineItemKeys,
} from "../types";
import {
  TimelineItemInterval,
  sortTimelineItemsByStartDate,
  findPlacement,
  groupTimelineItemsByField,
  type PlacementResult,
} from "../utils";
import { TimelineRuler } from "./OnLayout/TimelineRuler";
import { TimelineItems } from "./OnLayout/TimelineItems";
import { TimelineSidebar } from "./Sidebar/TimelineSidebar";
import type { GroupPlacement } from "./Sidebar/TimelineSidebar";
import { useCenterBasedZoom, useDisableBrowserGestures } from "../hooks";
import { useZoomLevelMonitor } from "../hooks/useZoomLevelMonitor";
import styles from "./Timeline.module.scss";
import { TimelineConst } from "./_constants";
import { FloatingButtonGroup } from "../../../ui-components/navigation/FloatingButtonGroup";
import {
  Button,
} from "../../../ui-components/general/Button/index";

// 内部函数：创建 zoom controls
function createZoomControls(
  timeViewConfig: InternalZoomConfig[],
  currentZoom: string,
  onZoomChange: (zoom: string) => void
): React.ReactElement {
  return (
    <React.Fragment>
      {timeViewConfig.map((level) => (
        <Button
          key={level.type}
          variant={currentZoom === level.type ? "filled" : "ghost"}
          semantic={currentZoom === level.type ? "active" : "default"}
          onClick={() => onZoomChange(level.type)}
        >
          {level.label}
        </Button>
      ))}
    </React.Fragment>
  );
}

// 默认时间视图配置
const DEFAULT_TIME_VIEW_CONFIG = [
  { type: "year", dayWidth: 4.5, label: "Year", setAsDefault: false },
  { type: "month", dayWidth: 8, label: "Month", setAsDefault: true },
  { type: "day", dayWidth: 24, label: "Day", setAsDefault: false },
] as const;

// 内部zoom配置类型
interface InternalZoomConfig {
  type: string;
  dayWidth: number;
  label: string;
  setAsDefault: boolean;
}

// Hook 来管理 zoom 状态和配置
function useTimelineZoom(
  zoomLevels?: Array<{
    label: string;
    dayWidth: number;
    setAsDefault?: boolean;
  }>
) {
  // 处理 zoom levels 转换为内部格式
  const timeViewConfig = useMemo((): InternalZoomConfig[] => {
    const levels =
      zoomLevels && zoomLevels.length > 0
        ? zoomLevels
        : DEFAULT_TIME_VIEW_CONFIG;
    return levels.map((zl) => ({
      ...zl,
      type: zl.label.toLowerCase().replace(" ", "-"),
      setAsDefault: zl.setAsDefault ?? false,
    }));
  }, [zoomLevels]);

  // 管理当前 zoom 状态
  const [currentZoom, setCurrentZoom] = useState<string>(() => {
    const defaultView = timeViewConfig.find((view) => view.setAsDefault);
    return defaultView ? defaultView.type : timeViewConfig[0].type;
  });

  // 获取当前 zoom 配置
  const currentZoomConfig = timeViewConfig.find(
    (config) => config.type === currentZoom
  )!;

  return {
    timeViewConfig,
    currentZoom,
    setCurrentZoom,
    currentZoomConfig,
    dayWidth: currentZoomConfig.dayWidth,
  };
}

// 通用的Timeline组件 - 支持泛型，现在作为主要接口
export function Timeline<T = Record<string, unknown>>({
  // init 参数直接接收 TimelineItemDisplayConfig，简化配置
  inputData,
  init,
  groupBy,
  zoomLevels,
  fetchByTimeInterval,
  currentZoom: externalCurrentZoom,
  defaultDayWidth = 12,
}: TimelineProps<T>) {
  // 如果没有提供 zoomLevels，使用默认的 dayWidth

  // 始终调用 useTimelineZoom hook（React Hook 规则）
  const zoomManagement = useTimelineZoom(zoomLevels);

  // 确定最终使用的 dayWidth
  const dayWidth = (() => {
    if (externalCurrentZoom && zoomLevels) {
      // 如果提供了外部 currentZoom 和 zoomLevels，查找对应的 dayWidth
      const zoomConfig = zoomLevels.find(
        (zl) => zl.label.toLowerCase().replace(" ", "-") === externalCurrentZoom
      );
      return zoomConfig?.dayWidth || defaultDayWidth;
    } else if (zoomLevels && zoomManagement) {
      // 如果提供了 zoomLevels 且使用内部 zoom 管理
      return zoomManagement.dayWidth;
    } else {
      // 如果没有 zoom 功能，使用默认值
      return defaultDayWidth;
    }
  })();

  // Constants for layout calculations
  const cellHeight = TimelineConst.cellHeight; // Height of each item row in pixels
  const groupGapForTesting = TimelineConst.groupGap;

  // 处理输入数据：根据数据类型和 groupBy 参数决定如何处理
  const processedData = useMemo(() => {
    // 检查是否是已分组的数据
    const isGroupedData =
      Array.isArray(inputData) === false &&
      typeof inputData === "object" &&
      "data" in inputData &&
      "meta" in inputData;

    if (isGroupedData) {
      // 如果是已分组的数据，直接使用
      return inputData as SortedTimelineDataType<T>;
    } else {
      // 如果是原始数据数组
      const rawData = inputData as TimelineItemType<T>[];

      if (groupBy) {
        // 如果指定了 groupBy，进行分组
        return groupTimelineItemsByField(rawData, groupBy);
      } else {
        // 如果没有指定 groupBy，创建一个单组的数据结构
        return {
          meta: { sortBy: "id" as keyof (BaseTimelineItemType & T) },
          data: [
            {
              groupTitle: "",
              groupItems: rawData,
            },
          ],
        } as SortedTimelineDataType<T>;
      }
    }
  }, [inputData, groupBy]);

  // Filter data based on fetchByTimeInterval
  const filteredData = useMemo(() => {
    if (!fetchByTimeInterval) {
      return processedData;
    }
    const [start, end] = fetchByTimeInterval;
    const filteredGroups = processedData.data
      .map((group) => {
        const filteredItems = group.groupItems.filter((item) => {
          const itemStart = new Date(item.startDate);
          return itemStart >= start && itemStart <= end;
        });
        return { ...group, groupItems: filteredItems };
      })
      .filter((group) => group.groupItems.length > 0);

    return { ...processedData, data: filteredGroups };
  }, [processedData, fetchByTimeInterval]);

  // 检测是否有分组（用于决定是否显示 sidebar）
  const hasGrouping = useMemo(() => {
    // 如果指定了 groupBy，则有分组
    if (groupBy) return true;

    // 如果输入数据是已分组格式且有多个组或组标题非空，则有分组
    const isGroupedData =
      Array.isArray(inputData) === false &&
      typeof inputData === "object" &&
      "data" in inputData &&
      "meta" in inputData;

    if (isGroupedData) {
      const groupedData = inputData as SortedTimelineDataType<T>;
      return (
        groupedData.data.length > 1 ||
        (groupedData.data.length === 1 && groupedData.data[0].groupTitle !== "")
      );
    }

    return false;
  }, [inputData, groupBy]);

  // 添加主滚动容器的引用 - 现在只需要一个
  const mainScrollRef = useRef<HTMLDivElement>(null);

  // 使用自定义hook实现中心缩放功能，针对主内容容器
  const { containerRef: zoomContainerRef } = useCenterBasedZoom(dayWidth);

  // 使用自定义hook禁用浏览器左右滑动手势
  const gestureDisableRef = useDisableBrowserGestures();

  // 🔍 使用zoom level监听器 - 实施方案A
  useZoomLevelMonitor(
    dayWidth,
    zoomLevels || [],
    {
      onZoomLevelChanged: () => {
        // console.log('🎯 Timeline zoom level changed:', {
        //   from: previousLevel?.label || 'none',
        //   to: newLevel.label,
        //   dayWidth: newLevel.dayWidth
        // });
      }
    }
  );

  // Flatten all items from all groups for timeline calculations
  const allItems = filteredData.data.flatMap((group) => group.groupItems);

  // Sort items by start date to ensure consistent placement
  const sortedItems = sortTimelineItemsByStartDate(
    allItems as TimelineItemType<T>[]
  );

  // 构建用于计算时间间隔的数据，使用基础字段键
  const timelineIntervalData = sortedItems.map((item) => ({
    id: item.id || "",
    name: item.name || "",
    startDate:
      item.startDate ||
      item[BaseTimelineItemKeys.START_DATE as keyof typeof item],
    endDate:
      item.endDate || item[BaseTimelineItemKeys.END_DATE as keyof typeof item],
  }));

  // Get list of years and start month that need to be displayed
  const { years: yearList, startMonth } = TimelineItemInterval({
    inputData: timelineIntervalData,
  });

  // 🎯 Today按钮的智能行为 - 滚动到今天并居中
  const handleTodayClick = useCallback(() => {
    if (!mainScrollRef.current) {
      // console.warn('📅 Today button: main scroll container not found');
      return;
    }

    // 计算今天在时间轴上的位置
    const today = new Date();
    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth(); // 0-11
    const todayDate = today.getDate(); // 1-31

    // 检查今天是否在时间轴范围内
    const firstYear = yearList[0];
    const lastYear = yearList[yearList.length - 1];
    
    if (todayYear < firstYear || todayYear > lastYear) {
      // console.warn('📅 Today is outside the timeline range');
      return;
    }

    // 计算从时间轴开始到今天的总天数
    let totalDaysToToday = 0;

    // 遍历到今天所在年份之前的所有年份
    for (let year = firstYear; year < todayYear; year++) {
      const yearIndex = year - firstYear;
      const monthStart = yearIndex === 0 ? startMonth : 0;
      const monthEnd = 11;

      for (let month = monthStart; month <= monthEnd; month++) {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        totalDaysToToday += daysInMonth;
      }
    }

    // 添加今天所在年份从开始到今天所在月份前的天数
    const todayYearIndex = todayYear - firstYear;
    const todayYearMonthStart = todayYearIndex === 0 ? startMonth : 0;
    
    for (let month = todayYearMonthStart; month < todayMonth; month++) {
      const daysInMonth = new Date(todayYear, month + 1, 0).getDate();
      totalDaysToToday += daysInMonth;
    }

    // 添加今天所在月份到今天的天数
    totalDaysToToday += todayDate - 1; // 减1因为日期是从1开始的

    // 计算今天在时间轴上的像素位置
    const todayPositionInTimeline = totalDaysToToday * dayWidth;

    // 获取滚动容器的信息
    const container = mainScrollRef.current;
    const containerWidth = container.clientWidth;
    const maxScrollWidth = container.scrollWidth;
    const sidebarWidth = hasGrouping ? TimelineConst.sidebarWidth : 0;

    // 执行滚动，使今天位于中轴线
    const targetScrollLeft = todayPositionInTimeline - (containerWidth - sidebarWidth) / 2;
    const finalScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScrollWidth - containerWidth));

    container.scrollTo({
      left: finalScrollLeft,
      behavior: 'smooth'
    });

  }, [yearList, startMonth, dayWidth, hasGrouping]);

  // 计算 Timeline 的总宽度
  const calculateTimelineWidth = useCallback(() => {
    let totalDays = 0;

    yearList.forEach((year, yearIndex) => {
      // 第一年从 startMonth 开始，其他年份从1月开始
      const monthStart = yearIndex === 0 ? startMonth : 0;
      const monthEnd = 11; // 12月结束

      for (let month = monthStart; month <= monthEnd; month++) {
        // 计算当前月份的天数
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        totalDays += daysInMonth;
      }
    });

    // 只有在有分组时才加上左侧边栏的宽度
    return (
      totalDays * dayWidth + (hasGrouping ? TimelineConst.sidebarWidth : 0)
    );
  }, [yearList, startMonth, dayWidth, hasGrouping]);

  // 获取计算出的 Timeline 总宽度
  const timelineWidth = calculateTimelineWidth();

  // 生成 zoom controls（如果有 zoomLevels）
  const zoomControls = useMemo(() => {
    if (!zoomLevels || !zoomManagement) return null;

    return createZoomControls(
      zoomManagement.timeViewConfig,
      zoomManagement.currentZoom,
      zoomManagement.setCurrentZoom
    );
  }, [zoomLevels, zoomManagement]);

  // Early return if no items to display
  if (allItems.length === 0) {
    return (
      <div className={styles["timeline-ruler-container"]}>
        <div>No timeline items to display</div>
      </div>
    );
  }

  // Pre-calculate placements for each group separately
  const groupPlacements: GroupPlacement[] = filteredData.data.map((group) => {
    const sortedGroupItems = sortTimelineItemsByStartDate(
      group.groupItems as TimelineItemType<T>[]
    );
    const placements: PlacementResult[] = [];

    sortedGroupItems.forEach((item) => {
      const startDate = new Date(
        item.startDate ||
          item[BaseTimelineItemKeys.START_DATE as keyof typeof item]
      );
      const endDate = new Date(
        item.endDate || item[BaseTimelineItemKeys.END_DATE as keyof typeof item]
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const column = findPlacement(placements, item as any, startDate, endDate);

      placements.push({
        column,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        item: item as any,
        startDate,
        endDate,
      });
    });

    return {
      groupTitle: group.groupTitle,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      groupItems: group.groupItems as any,
      placements,
    };
  });

  // 添加一个空的占位分组，确保垂直滚动到底部时有足够的空白区域
  groupPlacements.push({
    groupTitle: "", // 空标题
    groupItems: [], // 空项目列表
    placements: [], // 空放置结果
    isEndSpacer: true, // 标识这是最后的占位分组
  });

  return (
    <React.Fragment>
      <div className={styles["timeline-container"]}>
        <div className={styles["timeline-body"]}>
          {/* 主滚动容器 - 处理横向滚动，ruler 和 content 都在其中 */}
          <div
            ref={(el) => {
              mainScrollRef.current = el;
              zoomContainerRef.current = el;
              gestureDisableRef.current = el;
            }}
            className={styles["timeline-main-scroll"]}
          >
            {/* 时间线尺子组件 - sticky 定位在顶部 */}
            <div
              className={styles["timeline-ruler-sticky"]}
              style={{ width: `${timelineWidth}px` }}
            >
              {/* 左侧边栏的尺子占位区域 */}
              {hasGrouping && (
                <div className={styles["timeline-sidebar-ruler-placeholder"]}>
                  <TimelineSidebar
                    groupPlacements={groupPlacements}
                    cellHeight={cellHeight}
                    groupGap={groupGapForTesting}
                    isRulerMode={true}
                  />
                </div>
              )}

              {/* 右侧时间线尺子 */}
              <div className={styles["timeline-ruler-content"]}>
                <TimelineRuler
                  yearList={yearList}
                  startMonth={startMonth}
                  dayWidth={dayWidth}
                />
              </div>
            </div>

            {/* 时间线内容区域 */}
            <div
              className={styles["timeline-content-inner"]}
              style={{ width: `${timelineWidth}px` }}
            >
              {/* 左侧可调整大小的侧边栏 */}
              {hasGrouping && (
                <div className={styles["timeline-sidebar"]}>
                  <TimelineSidebar
                    groupPlacements={groupPlacements}
                    cellHeight={cellHeight}
                    groupGap={groupGapForTesting}
                  />
                </div>
              )}

              {/* 时间线项目容器 */}
              <div className={styles["timeline-items-container"]}>
                <TimelineItems
                  yearList={yearList}
                  startMonth={startMonth}
                  dayWidth={dayWidth}
                  cellHeight={cellHeight}
                  groupGap={groupGapForTesting}
                  groupPlacements={groupPlacements}
                  displayConfig={init as TimelineItemDisplayConfig}
                  onIssueClick={() => {
                    // Issue 点击事件，不再同步到URL
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 默认渲染 zoom controls（如果有 zoomLevels） */}
      {zoomControls && zoomLevels && (
        <FloatingButtonGroup
          itemGroups={[
            [
              <Button 
                key="today" 
                variant="ghost"
                onClick={handleTodayClick}
              >
                {`Today`}
              </Button>,
            ],
            [zoomControls],
          ]}
          position="bottom-right"
        />
      )}
    </React.Fragment>
  );
}

// 导出 useTimelineZoom hook 供外部使用
export { useTimelineZoom };

// 默认导出Timeline组件
export { Timeline as default };
