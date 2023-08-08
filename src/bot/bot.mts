import { Logger } from "../logger/types.mjs";
import { TelegrafBot } from "./types.mjs";
import { LoggerFactory } from "../logger/logger.factory.mjs";
import { ConfigService } from "../services/config.service.mjs";
import { Middleware } from "../middlewares/middleware.types.mjs";
import { BotAction } from "./Actions/types.mjs";

export interface IBot {
    configure(): Promise<void>;
    launch(): Promise<void>;
}

export abstract class Bot implements IBot {
    protected readonly bot: TelegrafBot;
    protected readonly logger: Logger;

    public constructor(
        private readonly configService: ConfigService,
        private readonly actions: BotAction[],
        middlewares: Middleware[],
        loggerFactory: LoggerFactory
    ) {
        this.logger = loggerFactory.create("bot");
        this.bot = this.createBot();
        middlewares.forEach(middleware => this.bot.use(middleware.create()));
    }

    protected get token(): string {
        return this.configService.get("telegramToken");
    }

    public async configure(): Promise<void> {
        this.actions.forEach(action => action.configure(this.bot));
        this.bot.catch(error => this.logger.error("Bot", { error }));
    }

    public abstract launch(): Promise<void>;

    protected abstract createBot(): TelegrafBot;
}
