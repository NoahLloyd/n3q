import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { w } from "./theme";
import type { WidgetProfile } from "../lib/widget-data";

interface Props {
  profile: WidgetProfile | null;
}

export function MemberCardWidget({ profile }: Props) {
  if (!profile) {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          flexDirection: "column",
          backgroundColor: w.cardBg,
          borderRadius: 16,
          padding: 14,
          height: "match_parent" as any,
          width: "match_parent" as any,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TextWidget
          text="N3Q"
          style={{
            fontSize: 18,
            fontFamily: "DepartureMono",
            fontWeight: "bold",
            color: w.amber,
          }}
        />
        <FlexWidget style={{ height: 8 }} />
        <TextWidget
          text="Open app to"
          style={{ fontSize: 11, fontFamily: "DepartureMono", color: w.gray, textAlign: "center" }}
        />
        <TextWidget
          text="set up card"
          style={{ fontSize: 11, fontFamily: "DepartureMono", color: w.gray, textAlign: "center" }}
        />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      clickAction="OPEN_APP"
      clickActionData={{ screen: "profile" }}
      style={{
        flexDirection: "column",
        backgroundColor: w.cardBg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: w.gold25,
        height: "match_parent" as any,
        width: "match_parent" as any,
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
      }}
    >
      {/* Avatar / Initials */}
      <FlexWidget
        style={{
          width: 52,
          height: 52,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: w.gold50,
          backgroundColor: w.cardBgDark,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TextWidget
          text={profile.initials}
          style={{
            fontSize: 22,
            fontFamily: "DepartureMono",
            fontWeight: "bold",
            color: w.amber,
          }}
        />
      </FlexWidget>

      <FlexWidget style={{ height: 6 }} />

      {/* Name */}
      <TextWidget
        text={profile.displayName.toUpperCase()}
        maxLines={1}
        style={{
          fontSize: 11,
          fontFamily: "DepartureMono",
          fontWeight: "600",
          color: w.amber,
          letterSpacing: 1,
        }}
      />

      <FlexWidget style={{ height: 4 }} />

      {/* Builder divider */}
      <FlexWidget
        style={{
          flexDirection: "row",
          alignItems: "center",
          width: "match_parent" as any,
          paddingHorizontal: 8,
          flexGap: 6,
        }}
      >
        <FlexWidget
          style={{
            flex: 1,
            height: 1,
            backgroundColor: w.gold25,
          }}
        />
        <TextWidget
          text="BUILDER"
          style={{
            fontSize: 7,
            fontFamily: "DepartureMono",
            color: w.mutedAmber,
            letterSpacing: 2,
          }}
        />
        <FlexWidget
          style={{
            flex: 1,
            height: 1,
            backgroundColor: w.gold25,
          }}
        />
      </FlexWidget>

      <FlexWidget style={{ height: 6 }} />

      {/* Day count */}
      <TextWidget
        text={`DAY ${profile.dayCount}`}
        style={{
          fontSize: 13,
          fontFamily: "DepartureMono",
          fontWeight: "bold",
          color: w.amber,
          letterSpacing: 3,
        }}
      />
    </FlexWidget>
  );
}
