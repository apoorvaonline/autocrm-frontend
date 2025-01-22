export const theme = {
  colors: {
    primary: {
      main: "#781E28",
      text: "#9F5C5D",
      background: "#FFF6F1",
    },
  },
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
  },
  radius: {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "1rem",
  },
} as const;

export type Theme = typeof theme;
