export class Logger {
  private static instance: Logger;
  private debugMode: boolean = false;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setDebugMode(mode: boolean): void {
    this.debugMode = mode;
  }

  public log(...args: any[]): void {
    if (this.debugMode) {
      console.log(...args);
    }
  }

  public error(...args: any[]): void {
    if (this.debugMode) {
      console.error(...args);
    }
  }

  public warn(...args: any[]): void {
    if (this.debugMode) {
      console.warn(...args);
    }
  }
}

export const logger = Logger.getInstance();
