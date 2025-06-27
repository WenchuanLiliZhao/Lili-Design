import React from "react";
import {
  Timeline,
  type TimelineConfigType,
  createFieldConfig,
  type ZoomLevelType,
} from "../../../design-system/ui-demos/timeline";
import {
  ExampleData,
  priority,
  team,
  type ProjectDataType,
} from "./example-data";
import { getRainbowColor } from "../../../styles";
// import { FloatingButtonGroup } from "../../../design-system/ui-components"; // 仅在自定义渲染时需要

export function Element(): React.ReactElement {
  // 🎯 Method 1: Use createFieldConfig to simplify configuration
  const itemDisplayConfigSimple = {
    graphicFields: [
      // 1. Progress: Default color behavior.
      // - If progress < 100, color is 'active'.
      // - If progress = 100, color is 'success'.
      // createFieldConfig.progress<ProjectDataType>("progress"),

      // 2. Progress (Custom Colors): Uncomment the code below to see it in action.
      // You will need to import `getRainbowColor` from "../../../styles/color".
      //
      createFieldConfig.progress<ProjectDataType>("progress", {
        progressColors: [
          { upto: 30, color: getRainbowColor("amber") },
          { upto: 70, color: getRainbowColor("blue") },
          { upto: 100, color: getRainbowColor("emerald") },
        ],
      }),

      createFieldConfig.iconFromMap<ProjectDataType>("priority", priority),
    ],
    tagFields: [createFieldConfig.tagFromMap<ProjectDataType>("team", team)],
  };

  // 🎯 Method 2 and 3 example code shown in comments below

  // Timeline configuration - using Method 1 here
  const timelineConfig: TimelineConfigType<ProjectDataType> = {
    groupBy: "category",
    itemDisplayConfig: itemDisplayConfigSimple,
  };

  const zoomLevels: ZoomLevelType[] = [
    { label: "Day", dayWidth: 48 },
    { label: "Month", dayWidth: 24 },
    { label: "Quarter", dayWidth: 12, setAsDefault: true },
    { label: "Year", dayWidth: 6 },
  ];

  return (
    <div style={{ height: "100vh" }}>
      {/* 🎉 终极简洁！Timeline 自动管理一切 */}
      <Timeline<ProjectDataType>
        fetchByTimeInterval={[new Date("2023-12-01"), new Date("2024-12-30")]}
        init={timelineConfig}
        inputData={ExampleData}
        groupBy="category"
        zoomLevels={zoomLevels}
      />
    </div>
  );
}
