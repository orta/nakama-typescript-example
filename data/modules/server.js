// src/helloWorld.ts
var helloWorldRPCName = "hello-world";
function rpcHelloWorld(context, logger, nk, payload) {
  return JSON.stringify({ hello: "world" });
}

// src/server.ts
function InitModule(ctx, logger, _nk, initializer) {
  initializer.registerRpc(helloWorldRPCName, rpcHelloWorld);
  logger.info("TypeScript modules loaded.");
}
!InitModule && InitModule.bind(null);
