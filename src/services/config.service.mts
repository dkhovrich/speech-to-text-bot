import config from "config";
import dotenv from "dotenv";
import { z } from "zod";

const envSchema = z.union([z.literal("development"), z.literal("production")]);

const envVariablesSchema = z.object({
    TELEGRAM_TOKEN: z.string(),
    NODE_ENV: envSchema,
    OPENAI_KEY: z.string(),
    ALLOWED_USER_IDS: z.string()
});

const firebaseSchema = z.object({
    type: z.string(),
    project_id: z.string(),
    private_key_id: z.string(),
    private_key: z.string(),
    client_email: z.string(),
    client_id: z.string(),
    auth_uri: z.string(),
    token_uri: z.string(),
    auth_provider_x509_cert_url: z.string(),
    client_x509_cert_url: z.string(),
    universe_domain: z.string()
});

const configSchema = z.object({
    telegramToken: z.string(),
    openAiKey: z.string(),
    env: envSchema,
    userIds: z.number().array(),
    firebase: firebaseSchema
});

export type Config = z.infer<typeof configSchema>;

/*eslint-disable @typescript-eslint/no-namespace*/
declare global {
    namespace NodeJS {
        interface ProcessEnv extends z.infer<typeof envVariablesSchema> {}
    }
}
/*eslint-enable @typescript-eslint/no-namespace*/

export interface ConfigService {
    get<T extends keyof Config>(key: T): Config[T];
}

export class ConfigServiceImpl implements ConfigService {
    private readonly configuration: Config;

    public constructor() {
        if (process.env.NODE_ENV === "development") {
            dotenv.config();
        }
        envVariablesSchema.parse(process.env);
        this.configuration = this.readConfiguration();
    }

    public get<T extends keyof Config>(key: T): Config[T] {
        return this.configuration[key];
    }

    private readConfiguration(): Config {
        const configuration: Config = {
            telegramToken: process.env.TELEGRAM_TOKEN,
            openAiKey: process.env.OPENAI_KEY,
            env: process.env.NODE_ENV,
            userIds: process.env.ALLOWED_USER_IDS.split(",").map(id => parseInt(id)),
            firebase: config.get("firebase")
        };
        return configSchema.parse(configuration);
    }
}
