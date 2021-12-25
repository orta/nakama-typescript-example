
export const helloWorldRPCName = 'hello-world';

export function rpcHelloWorld(context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    return JSON.stringify({ hello: "world" })
}
