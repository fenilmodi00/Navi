export class NaviError extends Error {
  constructor(
    message: string,
    public context?: Record<string, any>,
  ) {
    super(message);
    this.name = "NaviError";
  }
}

export class AkashNetworkError extends NaviError {
  constructor(
    message: string,
    public operation?: string,
  ) {
    super(message);
    this.name = "AkashNetworkError";
  }
}

export class PluginLoadError extends NaviError {
  constructor(
    message: string,
    public pluginName: string,
    public cause?: Error,
  ) {
    super(message);
    this.name = "PluginLoadError";
  }
}

export class ConfigurationError extends NaviError {
  constructor(
    message: string,
    public configType?: string,
  ) {
    super(message);
    this.name = "ConfigurationError";
  }
}

export class DatabaseConnectionError extends NaviError {
  constructor(
    message: string,
    public connectionString?: string,
  ) {
    super(message);
    this.name = "DatabaseConnectionError";
  }
}

// Centralized error handler
export function handleNaviError(error: unknown): never {
  if (error instanceof AkashNetworkError) {
    console.error(`❌ Akash Network error: ${error.message}`);
    if (error.operation) {
      console.error(`Operation: ${error.operation}`);
    }
  } else if (error instanceof PluginLoadError) {
    console.error(`❌ Plugin load failed: ${error.message}`);
    console.error(`Plugin: ${error.pluginName}`);
    if (error.cause) {
      console.error("Caused by:", error.cause.message);
    }
  } else if (error instanceof ConfigurationError) {
    console.error(`❌ Configuration error: ${error.message}`);
    if (error.configType) {
      console.error(`Configuration type: ${error.configType}`);
    }
  } else if (error instanceof DatabaseConnectionError) {
    console.error(`❌ Database connection error: ${error.message}`);
    console.error("💡 Check your database configuration in .env file");
  } else {
    console.error(
      `❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  process.exit(1);
}
