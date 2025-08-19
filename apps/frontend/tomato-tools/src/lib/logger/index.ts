import pino, { Logger } from "pino";

// 检测是否使用 Turbopack
// 检查环境变量和命令行参数
const isTurbopack =
  process.env.TURBOPACK === "1" ||
  process.argv.includes("--turbopack") ||
  process.env.NEXT_RUNTIME === "edge";

// 颜色代码
const colors = {
  trace: "\x1b[90m", // 灰色
  debug: "\x1b[34m", // 蓝色
  info: "\x1b[32m", // 绿色
  warn: "\x1b[33m", // 黄色
  error: "\x1b[31m", // 红色
  fatal: "\x1b[35m", // 紫色
  reset: "\x1b[0m", // 重置
};

// 注意：颜色映射直接在 createColorLogger 中使用 colors 对象

// 创建基础配置
const baseConfig = {
  level:
    process.env.PINO_LOG_LEVEL ||
    (process.env.NODE_ENV === "production" ? "warn" : "debug"),
  timestamp: pino.stdTimeFunctions.isoTime,
};

// 创建彩色日志函数
// 定义具体的日志值类型
type LogValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Record<string, string | number | boolean | null | undefined>
  | (string | number | boolean | null | undefined)[];

const formatJsonValue = (value: LogValue, indent: number = 0): string => {
  if (value === null) return "null";
  if (typeof value === "undefined") return "undefined";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    if (value.length === 1 && typeof value[0] !== "object") {
      return `[${formatJsonValue(value[0])}]`;
    }
    const items = value
      .map(
        (item) => "  ".repeat(indent + 1) + formatJsonValue(item, indent + 1),
      )
      .join(",\n");
    return `[\n${items}\n${"  ".repeat(indent)}]`;
  }

  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) return "{}";
    if (keys.length === 1 && typeof value[keys[0]] !== "object") {
      return `{${keys[0]}: ${formatJsonValue(value[keys[0]])}}`;
    }
    const items = keys
      .map(
        (key) =>
          "  ".repeat(indent + 1) +
          `${key}: ${formatJsonValue(value[key], indent + 1)}`,
      )
      .join(",\n");
    return `{\n${items}\n${"  ".repeat(indent)}}`;
  }

  return String(value);
};

const createColorLogger = (levelName: string, color: string) => {
  return (
    obj: string | Record<string, string | number | boolean | null | undefined>,
    msg?: string,
  ) => {
    const time = new Date().toLocaleTimeString();
    const modulePrefix =
      obj && typeof obj === "object" && obj.module ? `[${obj.module}] ` : "";
    const message =
      msg ||
      (typeof obj === "object" && obj !== null ? obj.msg : undefined) ||
      (typeof obj === "string" ? obj : "");

    // 处理结构化数据
    if (obj && typeof obj === "object" && (obj.msg || msg)) {
      // 过滤掉内部字段
      const extraFields = Object.keys(obj).filter(
        (key) =>
          !["msg", "module", "level", "time", "pid", "hostname"].includes(key),
      );

      if (extraFields.length > 0) {
        // 主日志行
        console.log(
          `${color}[${time}] ${levelName.toUpperCase()}${colors.reset} ${modulePrefix}${message}`,
        );

        // 美化输出结构化数据
        extraFields.forEach((key) => {
          const value = obj[key];
          if (typeof value === "object" && value !== null) {
            console.log(`  \x1b[36m${key}:\x1b[0m`);
            const formattedValue = formatJsonValue(value, 1);
            console.log(`    ${formattedValue}`);
          } else {
            console.log(`  \x1b[36m${key}:\x1b[0m ${formatJsonValue(value)}`);
          }
        });
      } else {
        // 没有额外字段，只输出主日志行
        console.log(
          `${color}[${time}] ${levelName.toUpperCase()}${colors.reset} ${modulePrefix}${message}`,
        );
      }
    } else {
      // 简单消息或非对象
      const displayMessage =
        message ||
        (typeof obj === "object" ? formatJsonValue(obj) : String(obj));
      console.log(
        `${color}[${time}] ${levelName.toUpperCase()}${colors.reset} ${modulePrefix}${displayMessage}`,
      );
    }
  };
};

// 根据环境决定是否使用彩色输出
const shouldUseColorLogs =
  process.env.NODE_ENV === "development" && !isTurbopack;

// 创建日志实例
let baseLogger: Logger;

if (shouldUseColorLogs) {
  console.log(
    `\x1b[36m[Logger] 启用彩色日志模式 (Turbopack: ${isTurbopack})\x1b[0m`,
  );

  // 创建一个静默的pino实例，避免重复输出
  baseLogger = pino(
    {
      ...baseConfig,
      level: "silent", // 设置为silent避免pino自己输出
    },
    // pino.destination(path.join(process.cwd(), "logs", "app.log")),
  );

  // 完全重写日志方法以支持彩色输出
  const logger = baseLogger as any;
  logger.trace = createColorLogger("trace", colors.trace);
  logger.debug = createColorLogger("debug", colors.debug);
  logger.info = createColorLogger("info", colors.info);
  logger.warn = createColorLogger("warn", colors.warn);
  logger.error = createColorLogger("error", colors.error);
  logger.fatal = createColorLogger("fatal", colors.fatal);
} else {
  console.log(
    `\x1b[33m[Logger] 使用标准JSON格式 (Turbopack: ${isTurbopack}, NODE_ENV: ${process.env.NODE_ENV})\x1b[0m`,
  );

  // 标准pino配置
  baseLogger = pino({
    ...baseConfig,
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
  });
}

export const logger: Logger = baseLogger;

// 创建带有彩色日志功能的child logger
const createColorChildLogger = (
  fields: Record<string, string | number | boolean | null | undefined>,
): Logger => {
  if (shouldUseColorLogs) {
    // 在彩色模式下，创建一个包装对象来保持字段信息
    const baseChildLogger = logger.child(fields);

    // 创建兼容Logger接口的对象
    const colorChildLogger = Object.create(baseChildLogger);

    // 重写日志方法以支持彩色输出
    colorChildLogger.trace = (
      obj:
        | string
        | Record<string, string | number | boolean | null | undefined>,
      msg?: string,
    ) => {
      if (typeof obj === "string" && !msg) {
        // 只有消息字符串的情况
        createColorLogger("trace", colors.trace)({ ...fields, msg: obj });
      } else if (typeof obj === "object" && obj !== null && msg) {
        // 有对象和消息的情况
        createColorLogger("trace", colors.trace)({ ...fields, ...obj, msg });
      } else if (typeof obj === "object" && obj !== null) {
        // 只有对象的情况
        createColorLogger("trace", colors.trace)({ ...fields, ...obj }, msg);
      } else {
        // 字符串和消息的情况
        createColorLogger("trace", colors.trace)(
          { ...fields, msg: typeof obj === "string" ? obj : String(obj) },
          msg,
        );
      }
    };
    colorChildLogger.debug = (
      obj:
        | string
        | Record<string, string | number | boolean | null | undefined>,
      msg?: string,
    ) => {
      if (typeof obj === "string" && !msg) {
        createColorLogger("debug", colors.debug)({ ...fields, msg: obj });
      } else if (typeof obj === "object" && obj !== null && msg) {
        createColorLogger("debug", colors.debug)({ ...fields, ...obj, msg });
      } else if (typeof obj === "object" && obj !== null) {
        createColorLogger("debug", colors.debug)({ ...fields, ...obj }, msg);
      } else {
        createColorLogger("debug", colors.debug)(
          { ...fields, msg: typeof obj === "string" ? obj : String(obj) },
          msg,
        );
      }
    };
    colorChildLogger.info = (
      obj:
        | string
        | Record<string, string | number | boolean | null | undefined>,
      msg?: string,
    ) => {
      if (typeof obj === "string" && !msg) {
        createColorLogger("info", colors.info)({ ...fields, msg: obj });
      } else if (typeof obj === "object" && obj !== null && msg) {
        createColorLogger("info", colors.info)({ ...fields, ...obj, msg });
      } else if (typeof obj === "object" && obj !== null) {
        createColorLogger("info", colors.info)({ ...fields, ...obj }, msg);
      } else {
        createColorLogger("info", colors.info)(
          { ...fields, msg: typeof obj === "string" ? obj : String(obj) },
          msg,
        );
      }
    };
    colorChildLogger.warn = (
      obj:
        | string
        | Record<string, string | number | boolean | null | undefined>,
      msg?: string,
    ) => {
      if (typeof obj === "string" && !msg) {
        createColorLogger("warn", colors.warn)({ ...fields, msg: obj });
      } else if (typeof obj === "object" && obj !== null && msg) {
        createColorLogger("warn", colors.warn)({ ...fields, ...obj, msg });
      } else if (typeof obj === "object" && obj !== null) {
        createColorLogger("warn", colors.warn)({ ...fields, ...obj }, msg);
      } else {
        createColorLogger("warn", colors.warn)(
          { ...fields, msg: typeof obj === "string" ? obj : String(obj) },
          msg,
        );
      }
    };
    colorChildLogger.error = (
      obj:
        | string
        | Record<string, string | number | boolean | null | undefined>,
      msg?: string,
    ) => {
      if (typeof obj === "string" && !msg) {
        createColorLogger("error", colors.error)({ ...fields, msg: obj });
      } else if (typeof obj === "object" && obj !== null && msg) {
        createColorLogger("error", colors.error)({ ...fields, ...obj, msg });
      } else if (typeof obj === "object" && obj !== null) {
        createColorLogger("error", colors.error)({ ...fields, ...obj }, msg);
      } else {
        createColorLogger("error", colors.error)(
          { ...fields, msg: typeof obj === "string" ? obj : String(obj) },
          msg,
        );
      }
    };
    colorChildLogger.fatal = (
      obj:
        | string
        | Record<string, string | number | boolean | null | undefined>,
      msg?: string,
    ) => {
      if (typeof obj === "string" && !msg) {
        createColorLogger("fatal", colors.fatal)({ ...fields, msg: obj });
      } else if (typeof obj === "object" && obj !== null && msg) {
        createColorLogger("fatal", colors.fatal)({ ...fields, ...obj, msg });
      } else if (typeof obj === "object" && obj !== null) {
        createColorLogger("fatal", colors.fatal)({ ...fields, ...obj }, msg);
      } else {
        createColorLogger("fatal", colors.fatal)(
          { ...fields, msg: typeof obj === "string" ? obj : String(obj) },
          msg,
        );
      }
    };
    colorChildLogger.child = (
      childFields: Record<string, string | number | boolean | null | undefined>,
    ) => createColorChildLogger({ ...fields, ...childFields });

    return colorChildLogger;
  } else {
    return logger.child(fields);
  }
};

// 创建模块特定的日志器
export const createModuleLogger = (module: string) => {
  return createColorChildLogger({ module });
};

// 创建带有请求ID的日志器
export const createRequestLogger = (requestId: string, module?: string) => {
  const baseFields = { requestId };
  if (module) {
    Object.assign(baseFields, { module });
  }
  return createColorChildLogger(baseFields);
};

// 获取关联ID（从请求头中）
export const getCorrelationId = (headers: Headers): string | null => {
  return headers.get("x-correlation-id") || headers.get("x-request-id") || null;
};

// 生成新的关联ID
export const generateCorrelationId = (): string => {
  return crypto.randomUUID();
};

export default logger;
