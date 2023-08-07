import { Logger } from "./types.mjs";
import bunyan, { Stream } from "bunyan";
import { LoggingBunyan } from "@google-cloud/logging-bunyan";
import { LoggerAdapter } from "./logger.adapter.mjs";
import { ConfigService } from "../services/config.service.mjs";

export interface LoggerFactory {
    create(name: string): Logger;
}

export class LoggerFactoryImpl implements LoggerFactory {
    public constructor(private readonly configService: ConfigService) {}

    public create(name: string): Logger {
        const logger = bunyan.createLogger({ name, streams: [this.createStream()] });
        return new LoggerAdapter(logger);
    }

    private createStream(): Stream {
        if (this.configService.get("env") === "production") {
            return new LoggingBunyan().stream("info");
        }
        return { stream: process.stdout, level: "info" };
    }
}
