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
    injected(BotServer, TOKENS.service.config, TOKENS.action.all, TOKENS.middleware.all, TOKENS.loggerFactory);
    container.bind(TOKENS.bot).toInstance(BotServer).inSingletonScope();
}

function createServices(container: Container): void {
    container.bind(TOKENS.service.config).toInstance(ConfigServiceImpl).inSingletonScope();

    injected(OpenAiSpeechToTextService, TOKENS.service.config);
    container.bind(TOKENS.service.speechToText).toInstance(OpenAiSpeechToTextService).inSingletonScope();

    container.bind(TOKENS.service.audioConverter).toInstance(AudioConverterServiceImpl).inSingletonScope();

    injected(TranscribeRepository, TOKENS.service.config);
    container.bind(TOKENS.repository.transcribe).toInstance(TranscribeRepository).inSingletonScope();
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
