import dotenv from "dotenv";
import { z } from "zod";

const nodeEnvSchema = z.union([z.literal("development"), z.literal("production")]);

const envVariablesSchema = z.object({
    TELEGRAM_TOKEN: z.string(),
    NODE_ENV: nodeEnvSchema,
    OPENAI_KEY: z.string(),
    ALLOWED_USER_IDS: z.string()
});

/*eslint-disable @typescript-eslint/no-namespace*/
declare global {
    namespace NodeJS {
        interface ProcessEnv extends z.infer<typeof envVariablesSchema> {}
    }
}
/*eslint-enable @typescript-eslint/no-namespace*/

export interface Config {
    readonly telegramToken: string;
    readonly openAiKey: string;
    readonly env: z.infer<typeof nodeEnvSchema>;
    readonly userIds: number[];
}

export interface ConfigService {
    get<T extends keyof Config>(key: T): Config[T];
}

export class ConfigServiceImpl implements ConfigService {
    private readonly config: Config;

    public constructor() {
        if (process.env.NODE_ENV === "development") {
            dotenv.config();
        }
        envVariablesSchema.parse(process.env);
        this.config = this.createConfig();
    }

    public get<T extends keyof Config>(key: T): Config[T] {
        return this.config[key];
    }

    private createConfig(): Config {
        return {
            telegramToken: process.env.TELEGRAM_TOKEN,
            openAiKey: process.env.OPENAI_KEY,
            env: process.env.NODE_ENV,
            userIds: process.env.ALLOWED_USER_IDS.split(",").map(id => parseInt(id))
        };
    }
}
