import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { setUncaughtExceptionCaptureCallback } from "node:process";

//refer to this issue: https://github.com/TypeStrong/ts-node/issues/2026
setUncaughtExceptionCaptureCallback(console.log);
register("ts-node/esm", pathToFileURL("./"));
