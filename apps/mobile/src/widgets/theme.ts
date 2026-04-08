// Widget color palette — matches trading card aesthetic
// Android widget colors must be #hex or rgba(r, g, b, a) with spaces
export const w = {
  // Backgrounds
  pageBg: "#0a0a0a",
  cardBg: "#1a1610",
  cardBgDark: "#0f0d0a",
  parchment: "#2c2418",

  // Gold/amber accents
  amber: "#d4a84b",
  amberDim: "#c89b37",
  gold50: "rgba(180, 130, 50, 0.5)" as const,
  gold25: "rgba(180, 130, 50, 0.25)" as const,
  gold60: "rgba(200, 155, 55, 0.6)" as const,

  // Text
  white: "#fafafa",
  gray: "#a1a1a1",
  mutedAmber: "rgba(200, 155, 55, 0.4)" as const,

  // Status colors
  amberStatus: "#f5a623",
  blue: "#62a5fa",
} as const;
