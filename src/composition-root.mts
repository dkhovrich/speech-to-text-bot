import { Container, injected, token } from "brandi";
import { IBot } from "./bot/bot.mjs";
import { LoggerFactory, LoggerFactoryImpl } from "./logger/logger.factory.mjs";
import { ConfigService, ConfigServiceImpl } from "./services/config.service.mjs";
import { BotServer } from "./bot/bot.server.mjs";
import { Middleware } from "./middlewares/middleware.types.mjs";
import { AuthMiddleware } from "./middlewares/auth.middleware.mjs";
import { BotAction } from "./bot/Actions/types.mjs";
import { StartBotAction } from "./bot/Actions/StartBotAction.mjs";
import { VoiceBotAction } from "./bot/Actions/VoiceBotAction.mjs";
import { OpenAiSpeechToTextService, SpeechToTextService } from "./services/speech-to-text.service.mjs";
import { AudioConverterService, AudioConverterServiceImpl } from "./services/audio-converter.service.mjs";
import { Repository, TranscribeModel, TranscribeRepository } from "./services/transcribe.repository.mjs";
import { BotWebhook } from "./bot/bot.webhook.mjs";
import { absurd } from "./utils/absurd.mjs";
import { TranscribeRepositoryStub } from "./services/transcribe.repository.stub.mts.js";

export const TOKENS = {
    bot: token<IBot>("bot"),
    service: {
        config: token<ConfigService>("config.service"),
        audioConverter: token<AudioConverterService>("audio-converter.service"),
        speechToText: token<SpeechToTextService>("speech-to-text.service")
    },
    repository: {
        transcribe: token<Repository<TranscribeModel>>("transcribe.repository")
    },
    loggerFactory: token<LoggerFactory>("logger.factory"),
    middleware: {
        auth: token<Middleware>("middleware.auth"),
        all: token<Middleware[]>("middlewares")
    },
    action: {
        start: token<BotAction>("action.start"),
        voice: token<BotAction>("action.voice"),
        all: token<BotAction[]>("action.all")
    }
};

function createMiddlewares(container: Container): void {
    injected(AuthMiddleware, TOKENS.service.config);
    container.bind(TOKENS.middleware.auth).toInstance(AuthMiddleware).inSingletonScope();
    container.bind(TOKENS.middleware.all).toConstant([TOKENS.middleware.auth].map(token => container.get(token)));
}

function createActions(container: Container): void {
    container.bind(TOKENS.action.start).toInstance(StartBotAction).inSingletonScope();

    injected(
        VoiceBotAction,
        TOKENS.service.audioConverter,
        TOKENS.service.speechToText,
        TOKENS.repository.transcribe,
        TOKENS.loggerFactory
    );
    container.bind(TOKENS.action.voice).toInstance(VoiceBotAction).inSingletonScope();

    container
        .bind(TOKENS.action.all)
        .toConstant([TOKENS.action.start, TOKENS.action.voice].map(token => container.get(token)));
}

function createBot(container: Container): void {
    const deps = [TOKENS.service.config, TOKENS.action.all, TOKENS.middleware.all, TOKENS.loggerFactory] as const;
    switch (process.env.BOT_MODE) {
        case "server":
            injected(BotServer, ...deps);
            container.bind(TOKENS.bot).toInstance(BotServer).inSingletonScope();
            break;
        case "webhook":
            injected(BotWebhook, ...deps);
            container.bind(TOKENS.bot).toInstance(BotWebhook).inSingletonScope();
            break;
        default:
            absurd(process.env.BOT_MODE);
    }
}

function createServices(container: Container): void {
    container.bind(TOKENS.service.config).toInstance(ConfigServiceImpl).inSingletonScope();

    injected(OpenAiSpeechToTextService, TOKENS.service.config);
    container.bind(TOKENS.service.speechToText).toInstance(OpenAiSpeechToTextService).inSingletonScope();

    container.bind(TOKENS.service.audioConverter).toInstance(AudioConverterServiceImpl).inSingletonScope();

    injected(TranscribeRepository, TOKENS.service.config);
    container.bind(TOKENS.repository.transcribe).toInstance(TranscribeRepositoryStub).inSingletonScope();
}

export function createContainer(): Container {
    const container = new Container();

    injected(LoggerFactoryImpl, TOKENS.service.config);
    container.bind(TOKENS.loggerFactory).toInstance(LoggerFactoryImpl).inSingletonScope();

    createServices(container);
    createMiddlewares(container);
    createActions(container);
    createBot(container);

    return container;
}
