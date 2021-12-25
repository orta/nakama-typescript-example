/// <reference types="nakama-runtime" />

import {helloWorldRPCName, rpcHelloWorld} from "./helloWorld"

function InitModule(ctx: nkruntime.Context, logger: nkruntime.Logger, _nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
  initializer.registerRpc(helloWorldRPCName, rpcHelloWorld);

  logger.info("TypeScript modules loaded.")
}

// Reference InitModule to avoid it getting removed on build
!InitModule && InitModule.bind(null)
