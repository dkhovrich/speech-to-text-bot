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
import { Repository, TranscribeModel } from "../../services/transcribe.repository.mjs";

export interface TelegrafFrom {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
}

export class VoiceBotAction implements BotAction {
    private static dirname = dirname(fileURLToPath(import.meta.url));
    private static voicesFolderPath = resolve(VoiceBotAction.dirname, "../../../voices");
    private readonly logger: Logger;

    public constructor(
        private readonly audioConverterService: AudioConverterService,
        private readonly speechToTextService: SpeechToTextService,
        private readonly transcribeRepository: Repository<TranscribeModel>,
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

                const [oggPath, mp3Path] = await this.getAudioFiles(link, userId);
                const transcription = await this.speechToTextService.transcribe(mp3Path);
                await this.logTranscription(ctx.message.from, ctx.message.voice.duration);

                await Promise.all([oggPath, mp3Path].map(path => this.removeFile(path)));
                await ctx.reply(transcription);
            } catch (error) {
                if (error instanceof Error) {
                    this.logger.error("Error processing action", error);
                }
                await ctx.reply(code("Something went wrong..."));
            }
        });
    }

    private async getOgg(url: string, path: string): Promise<void> {
        const response = await axios({ method: "get", url, responseType: "stream" });
        return new Promise<void>((resolve, reject) => {
            const stream = createWriteStream(path);
            response.data.pipe(stream);
            stream.on("finish", () => resolve());
            stream.on("error", error => reject(error));
        });
    }

    private async getAudioFiles(link: URL, userId: string): Promise<readonly [string, string]> {
        const oggPath = resolve(VoiceBotAction.voicesFolderPath, `${userId}.ogg`);
        const mp3Path = resolve(VoiceBotAction.voicesFolderPath, `${userId}.mp3`);

        await this.getOgg(link.href, oggPath);
        await this.audioConverterService.oggToMp3(oggPath, mp3Path);

        return [oggPath, mp3Path];
    }

    private async logTranscription(user: TelegrafFrom, duration: number): Promise<void> {
        await this.transcribeRepository.create({
            user: {
                id: user.id,
                name: user.username ?? user.first_name,
                displayName: `${user.first_name} ${user.last_name ?? ""}`.trim()
            },
            duration
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
