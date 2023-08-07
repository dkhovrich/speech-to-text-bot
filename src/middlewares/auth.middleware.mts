import { Context, Middleware as TelegrafMiddleware } from "telegraf";
import { Middleware } from "./middleware.types.mjs";
import { ConfigService } from "../services/config.service.mjs";

export class AuthMiddleware implements Middleware {
    public constructor(private readonly configService: ConfigService) {}

    public create(): TelegrafMiddleware<Context> {
        return async (ctx, next) => {
            if (ctx.from == null || !this.isAllowed(ctx.from.id)) {
                await ctx.reply("Sorry, but you are not allowed to use this bot ⛔");
                return;
            }
            await next();
        };
    }

    private isAllowed(userId: number): boolean {
        return this.configService.get("userIds").includes(userId);
    }
}
