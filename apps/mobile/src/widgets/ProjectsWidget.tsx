import React from "react";
import { FlexWidget, TextWidget, type ColorProp } from "react-native-android-widget";
import { w } from "./theme";
import type { WidgetProject } from "../lib/widget-data";

function statusColor(status: string): ColorProp {
  switch (status) {
    case "idea":
    case "looking_for_help":
      return w.amberStatus;
    case "in_progress":
      return w.blue;
    default:
      return w.gray;
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "idea": return "Idea";
    case "in_progress": return "In Progress";
    case "looking_for_help": return "Help Wanted";
    case "completed": return "Completed";
    default: return status;
  }
}

interface Props {
  projects: WidgetProject[];
  height: number;
}

export function ProjectsWidget({ projects, height }: Props) {
  const maxItems = height > 200 ? 4 : 3;

  return (
    <FlexWidget
      style={{
        flexDirection: "column",
        backgroundColor: w.pageBg,
        borderRadius: 16,
        padding: 14,
        height: "match_parent" as any,
        width: "match_parent" as any,
      }}
    >
      {/* Header */}
      <FlexWidget
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          width: "match_parent" as any,
        }}
      >
        <TextWidget
          text="PROJECTS"
          style={{
            fontSize: 11,
            fontFamily: "DepartureMono",
            color: w.amber,
          }}
        />
        <TextWidget
          text="All ▸"
          clickAction="OPEN_APP"
          clickActionData={{ screen: "(tabs)/projects" }}
          style={{
            fontSize: 10,
            fontFamily: "DepartureMono",
            color: w.gray,
          }}
        />
      </FlexWidget>

      <FlexWidget style={{ height: 8 }} />

      {projects.length === 0 ? (
        <FlexWidget
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TextWidget
            text="No active projects"
            style={{ fontSize: 12, fontFamily: "DepartureMono", color: w.gray }}
          />
        </FlexWidget>
      ) : (
        projects.slice(0, maxItems).map((project) => (
          <FlexWidget
            key={project.id}
            clickAction="OPEN_APP"
            clickActionData={{ screen: `(tabs)/projects/${project.id}` }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              width: "match_parent" as any,
              padding: 4,
              flexGap: 8,
            }}
          >
            {/* Status dot */}
            <FlexWidget
              style={{
                width: 6,
                height: 6,
                borderRadius: 1,
                backgroundColor: statusColor(project.status),
              }}
            />
            {/* Title */}
            <FlexWidget style={{ flex: 1 }}>
              <TextWidget
                text={project.title}
                maxLines={1}
                style={{ fontSize: 13, color: w.white }}
              />
            </FlexWidget>
            {/* Status */}
            <TextWidget
              text={statusLabel(project.status)}
              style={{
                fontSize: 10,
                fontFamily: "DepartureMono",
                color: statusColor(project.status),
              }}
            />
          </FlexWidget>
        ))
      )}
    </FlexWidget>
  );
}
