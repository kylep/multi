type LogLevel = "debug" | "info" | "warn" | "error" | "none";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

const CONFIG_LEVEL: LogLevel = "info";

const PREFIX = "[llm-client]";

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[CONFIG_LEVEL];
}

function ts(): string {
  return new Date().toISOString().slice(11, 23);
}

// nosemgrep: javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
export const log = {
  debug(msg: string, ...args: unknown[]) {
    if (shouldLog("debug")) console.debug("%s %s DBG %s", PREFIX, ts(), msg, ...args);
  },
  info(msg: string, ...args: unknown[]) {
    if (shouldLog("info")) console.log("%s %s INF %s", PREFIX, ts(), msg, ...args);
  },
  warn(msg: string, ...args: unknown[]) {
    if (shouldLog("warn")) console.warn("%s %s WRN %s", PREFIX, ts(), msg, ...args);
  },
  error(msg: string, ...args: unknown[]) {
    if (shouldLog("error")) console.error("%s %s ERR %s", PREFIX, ts(), msg, ...args);
  },
  /** Collapsible structured log for API exchanges. */
  exchange(label: string, data: Record<string, unknown>) {
    if (!shouldLog("info")) return;
    console.groupCollapsed(`%s %s INF %s`, PREFIX, ts(), label);
    console.log(data);
    console.groupEnd();
  },
};
