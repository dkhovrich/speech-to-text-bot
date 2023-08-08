import { Bot } from "./bot.mjs";
import { TelegrafBot } from "./types.mjs";
import { Telegraf } from "telegraf";
import functions from "@google-cloud/functions-framework";

export class BotWebhook extends Bot {
    public async launch(): Promise<void> {
        this.logger.info("Starting bot", { mode: "webhook" });
        functions.http("bot", async (request, response) => {
            this.logger.info("Request", { body: request.body });
            await this.bot.handleUpdate(request.body, response);
        });
    }

    protected createBot(): TelegrafBot {
        return new Telegraf(this.token, { telegram: { webhookReply: true } });
    }
}
