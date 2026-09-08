import { Platform } from "react-native";

/** Frosted-glass blur for translucent dark-mode chrome (nav, sheets, panels).
 * Web-only: backdrop-filter has no RN native equivalent, so native surfaces
 * fall back to plain transparency, which is a no-op object here. */
export const glassBlur = Platform.OS === "web"
  ? ({ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" } as const)
  : ({} as const);
