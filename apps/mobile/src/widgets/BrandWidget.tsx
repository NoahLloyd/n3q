import React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";
import { w } from "./theme";

interface Props {
  width: number;
}

export function BrandWidget({ width }: Props) {
  const isWide = width > 200;

  return (
    <FlexWidget
      clickAction="OPEN_APP"
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
        padding: 14,
      }}
    >
      {/* Logo */}
      <TextWidget
        text="N3Q"
        style={{
          fontSize: isWide ? 28 : 22,
          fontFamily: "DepartureMono",
          fontWeight: "bold",
          color: w.amber,
          letterSpacing: 4,
        }}
      />

      <FlexWidget style={{ height: isWide ? 10 : 8 }} />

      {/* Diamond divider */}
      <FlexWidget
        style={{
          flexDirection: "row",
          alignItems: "center",
          width: "match_parent" as any,
          paddingHorizontal: isWide ? 40 : 16,
          flexGap: 8,
        }}
      >
        <FlexWidget
          style={{
            flex: 1,
            height: 1,
            backgroundColor: w.gold25,
          }}
        />
        <FlexWidget
          style={{
            width: 4,
            height: 4,
            backgroundColor: w.gold60,
            borderRadius: 1,
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

      <FlexWidget style={{ height: isWide ? 10 : 8 }} />

      {/* Tagline */}
      <TextWidget
        text="A lab for builders, backed"
        style={{
          fontSize: isWide ? 11 : 9,
          fontFamily: "DepartureMono",
          color: w.mutedAmber,
          textAlign: "center",
        }}
      />
      <TextWidget
        text="by unicorn founders"
        style={{
          fontSize: isWide ? 11 : 9,
          fontFamily: "DepartureMono",
          color: w.mutedAmber,
          textAlign: "center",
        }}
      />
    </FlexWidget>
  );
}
