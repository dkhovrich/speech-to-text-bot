import { TelegrafBot } from "../types.mjs";

export interface BotAction {
    configure(bot: TelegrafBot): void;
}
