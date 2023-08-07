import { BotAction } from "./types.mjs";
import { TelegrafBot } from "../types.mjs";

export class StartBotAction implements BotAction {
    public configure(bot: TelegrafBot): void {
        bot.start(ctx => ctx.reply("Send me a voice message and I will convert it to text 🎙️"));
    }
}
