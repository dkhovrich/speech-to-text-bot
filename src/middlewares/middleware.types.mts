import { Context, Middleware as TelegrafMiddleware } from "telegraf";

export interface Middleware {
    create(): TelegrafMiddleware<Context>;
}
