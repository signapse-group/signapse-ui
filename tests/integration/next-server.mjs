import { spawn } from "node:child_process"
import { resolve } from "node:path"

import {
  nextServerEnvironment,
  readIntegrationEnvironment,
} from "./environment.mjs"

const configuration = readIntegrationEnvironment()
const child = spawn(
  process.execPath,
  [
    resolve("node_modules/next/dist/bin/next"),
    "dev",
    "--turbopack",
    "--hostname",
    "localhost",
    "--port",
    String(configuration.port),
  ],
  { env: nextServerEnvironment(configuration.appEnvironment), stdio: "inherit" }
)
child.on("error", () => {
  console.error("Unable to start the authenticated Next.js integration server.")
  process.exitCode = 1
})
child.on("exit", (code) => {
  process.exitCode = code ?? 1
})
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal))
}
