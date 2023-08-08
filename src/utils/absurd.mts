export function absurd(x: never): never {
    throw new Error("absurd", x);
}
