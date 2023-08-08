import { Bot } from "./bot.mjs";
import { TelegrafBot } from "./types.mjs";
import { Context, Telegraf } from "telegraf";

export class BotServer extends Bot {
    public async launch(): Promise<void> {
        try {
            process.once("SIGINT", () => this.bot.stop("SIGINT"));
            process.once("SIGTERM", () => this.bot.stop("SIGTERM"));

            this.logger.info("Starting bot", { mode: "server" });
            await this.bot.launch();
        } catch (error) {
            this.logger.error("Start", { error });
            process.exit(1);
        }
    }

    protected createBot(): TelegrafBot {
        return new Telegraf<Context>(this.token);
    }
}
