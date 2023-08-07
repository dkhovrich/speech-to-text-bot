import axios from "axios";
import { createWriteStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { message } from "telegraf/filters";
import { code } from "telegraf/format";
import { BotAction } from "./types.mjs";
import { TelegrafBot } from "../types.mjs";
import { fileURLToPath } from "node:url";
import { Logger } from "../../logger/types.mjs";
import { LoggerFactory } from "../../logger/logger.factory.mjs";
import { SpeechToTextService } from "../../services/speech-to-text.service.mjs";
import { AudioConverterService } from "../../services/audio-converter.service.mjs";

export class VoiceBotAction implements BotAction {
    private static dirname = dirname(fileURLToPath(import.meta.url));
    private static voicesFolderPath = resolve(VoiceBotAction.dirname, "../../../voices");
    private readonly logger: Logger;

    public constructor(
        private readonly audioConverterService: AudioConverterService,
        private readonly speechToTextService: SpeechToTextService,
        loggerFactory: LoggerFactory
    ) {
        this.logger = loggerFactory.create("voice");
    }

    public configure(bot: TelegrafBot): void {
        bot.on(message("voice"), async ctx => {
            try {
                await ctx.reply(code("Converting..."));
                const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
                const userId = String(ctx.message.from.id);

                const oggPath = resolve(VoiceBotAction.voicesFolderPath, `${userId}.ogg`);
                const mp3Path = resolve(VoiceBotAction.voicesFolderPath, `${userId}.mp3`);

                await this.getOgg(link.href, oggPath);
                await this.audioConverterService.oggToMp3(oggPath, mp3Path);
                const transcription = await this.speechToTextService.transcribe(mp3Path);

                await Promise.all([oggPath, mp3Path].map(path => this.removeFile(path)));
                await ctx.reply(transcription);
            } catch (error) {
                this.logger.error("Error processing action", { error });
                await ctx.reply(code("Something went wrong..."));
            }
        });
    }

    public async getOgg(url: string, path: string): Promise<void> {
        const response = await axios({ method: "get", url, responseType: "stream" });
        return new Promise<void>((resolve, reject) => {
            const stream = createWriteStream(path);
            response.data.pipe(stream);
            stream.on("finish", () => resolve());
            stream.on("error", error => reject(error));
        });
    }

    private async removeFile(path: string): Promise<void> {
        try {
            await unlink(path);
        } catch (error) {
            this.logger.error("Error removing file", { path, error });
        }
    }
}
