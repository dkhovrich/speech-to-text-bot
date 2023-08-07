import { Configuration, OpenAIApi } from "openai";
import { ConfigService } from "./config.service.mjs";
import { createReadStream } from "node:fs";

export interface SpeechToTextService {
    transcribe(filepath: string): Promise<string>;
}

export class OpenAiSpeechToTextService implements SpeechToTextService {
    private readonly openai: OpenAIApi;

    public constructor(configService: ConfigService) {
        this.openai = new OpenAIApi(new Configuration({ apiKey: configService.get("openAiKey") }));
    }

    public async transcribe(filepath: string): Promise<string> {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await this.openai.createTranscription(createReadStream(filepath) as any, "whisper-1");
        return response.data.text;
    }
}
