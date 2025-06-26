import React from "react";
import {
  Timeline,
  groupTimelineItemsByField,
  type TimelineConfigType,
  createFieldConfig,
} from "../../../design-system/ui-demos/timeline";
import {
  ExampleData,
  priority,
  status,
  type ProjectDataType,
} from "./example-data";

export function Element(): React.ReactElement {

  // 🎯 Method 1: Use createFieldConfig to simplify configuration
  const itemDisplayConfigSimple = {
    graphicFields: [
      createFieldConfig.progress<ProjectDataType>("progress"),
      createFieldConfig.iconFromMap<ProjectDataType>("priority", priority),
    ],
    tagFields: [
      createFieldConfig.tagFromMap<ProjectDataType>("status", status),
    ],
  };

  // 🎯 Method 2 and 3 example code shown in comments below

  // Timeline configuration - using Method 1 here
  const timelineConfig: TimelineConfigType<ProjectDataType> = {
    groupBy: "category",
    itemDisplayConfig: itemDisplayConfigSimple,
  };

  // Group data by category
  const sortedData = groupTimelineItemsByField(ExampleData, "category");

  return (
    <div style={{ height: "100vh" }}>
      {/* Timeline 主演示 */}
      <Timeline<ProjectDataType> init={timelineConfig} inputData={sortedData} />
    </div>
  );
}
