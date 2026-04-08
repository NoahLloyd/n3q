import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { w } from "./theme";
import type { WidgetEvent } from "../lib/widget-data";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 86400000);

  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === tomorrow.getTime()) return "Tomorrow";

  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(time: string | null): string | null {
  if (!time) return null;
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

interface Props {
  events: WidgetEvent[];
  width: number;
  height: number;
}

export function EventsWidget({ events, height }: Props) {
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
          text="N3Q EVENTS"
          style={{
            fontSize: 11,
            fontFamily: "DepartureMono",
            color: w.amber,
          }}
        />
        <TextWidget
          text="All ▸"
          clickAction="OPEN_APP"
          clickActionData={{ screen: "(tabs)/events" }}
          style={{
            fontSize: 10,
            fontFamily: "DepartureMono",
            color: w.gray,
          }}
        />
      </FlexWidget>

      {/* Spacer */}
      <FlexWidget style={{ height: 8 }} />

      {/* Event list */}
      {events.length === 0 ? (
        <FlexWidget
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TextWidget
            text="No upcoming events"
            style={{ fontSize: 12, fontFamily: "DepartureMono", color: w.gray }}
          />
        </FlexWidget>
      ) : (
        events.slice(0, maxItems).map((event) => (
          <FlexWidget
            key={event.id}
            clickAction="OPEN_APP"
            clickActionData={{ screen: `(tabs)/events/${event.id}` }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              width: "match_parent" as any,
              padding: 4,
              flexGap: 8,
            }}
          >
            {/* Dot */}
            <FlexWidget
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: w.amberStatus,
              }}
            />
            {/* Title */}
            <FlexWidget style={{ flex: 1 }}>
              <TextWidget
                text={event.title}
                maxLines={1}
                style={{ fontSize: 13, color: w.white }}
              />
            </FlexWidget>
            {/* Date/time */}
            <FlexWidget style={{ flexDirection: "column", alignItems: "flex-end" }}>
              <TextWidget
                text={formatDate(event.date)}
                style={{ fontSize: 11, fontFamily: "DepartureMono", color: w.gray }}
              />
              {event.time && (
                <TextWidget
                  text={formatTime(event.time) || ""}
                  style={{ fontSize: 10, fontFamily: "DepartureMono", color: w.gray }}
                />
              )}
            </FlexWidget>
          </FlexWidget>
        ))
      )}
    </FlexWidget>
  );
}
