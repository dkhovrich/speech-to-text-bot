import { createContainer, TOKENS } from "./composition-root.mjs";

const container = createContainer();
const bot = container.get(TOKENS.bot);

await bot.configure();
await bot.launch();
