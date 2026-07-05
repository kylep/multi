/** Semver injected at build time from package.json via next.config.ts */
export const VERSION: string =
  process.env.NEXT_PUBLIC_APP_VERSION ?? "0.0.0-unknown";
