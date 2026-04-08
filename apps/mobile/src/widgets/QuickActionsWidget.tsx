import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { w } from "./theme";

export function QuickActionsWidget() {
  return (
    <FlexWidget
      style={{
        flexDirection: "column",
        backgroundColor: w.pageBg,
        borderRadius: 16,
        padding: 14,
        height: "match_parent" as any,
        width: "match_parent" as any,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Logo */}
      <TextWidget
        text="N3Q"
        style={{
          fontSize: 13,
          fontFamily: "DepartureMono",
          fontWeight: "bold",
          color: w.amber,
          letterSpacing: 2,
        }}
      />

      <FlexWidget style={{ height: 12 }} />

      {/* Action buttons row */}
      <FlexWidget
        style={{
          flexDirection: "row",
          justifyContent: "space-evenly",
          width: "match_parent" as any,
        }}
      >
        <FlexWidget
          clickAction="OPEN_APP"
          clickActionData={{ screen: "(tabs)/feed/add" }}
          style={{
            flexDirection: "column",
            alignItems: "center",
            flexGap: 4,
          }}
        >
          <TextWidget
            text="📖"
            style={{ fontSize: 20 }}
          />
          <TextWidget
            text="Post"
            style={{ fontSize: 9, fontFamily: "DepartureMono", color: w.gray }}
          />
        </FlexWidget>

        <FlexWidget
          clickAction="OPEN_APP"
          clickActionData={{ screen: "(tabs)/events/create" }}
          style={{
            flexDirection: "column",
            alignItems: "center",
            flexGap: 4,
          }}
        >
          <TextWidget
            text="📅"
            style={{ fontSize: 20 }}
          />
          <TextWidget
            text="Event"
            style={{ fontSize: 9, fontFamily: "DepartureMono", color: w.gray }}
          />
        </FlexWidget>

        <FlexWidget
          clickAction="OPEN_APP"
          clickActionData={{ screen: "(tabs)/projects/create" }}
          style={{
            flexDirection: "column",
            alignItems: "center",
            flexGap: 4,
          }}
        >
          <TextWidget
            text="🚀"
            style={{ fontSize: 20 }}
          />
          <TextWidget
            text="Project"
            style={{ fontSize: 9, fontFamily: "DepartureMono", color: w.gray }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
