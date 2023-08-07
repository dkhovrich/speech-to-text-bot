type LogMethod = (message: string, args?: object) => void;

export interface Logger {
    info: LogMethod;
    error: LogMethod;
}
