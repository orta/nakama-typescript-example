// A script which uses Facebook's watchman to run tsup in process,
// and then restart the nakama server after it has ran.

// Ensure the .env is used
const dotenv = require("dotenv")
dotenv.config({  })

if (!process.env.NAKAMA_PATH) throw new Error("You need to set NAKAMA_PATH in your .env for the watcher to load it")


// Check to see if watchman is available
const { spawnSync, spawn } = require("child_process")
const { log } = console

const help = spawnSync("watchman", ["--help"])
const hasWatchman = !help.error
if (!hasWatchman) {e
  log(`Watchman failed to load, you need to install this watch the nakama server.`)
  process.exit(0)
}

const watchman = require("fb-watchman")
const client = new watchman.Client({})

const chalk = require("chalk")
const { build } = require("tsup")
const {debounce} = require("ts-debounce")

// Long running process which gets reset in onChange
let serverProcess = undefined

async function onChange() {
  if (serverProcess) serverProcess.kill()

 // Handle the tsup build in-memory (instead of piping to yarn)
 await build({ entry: ["./src/server.ts"] })
 log(`${chalk.green("built")} restarting server`)

 serverProcess = spawn(process.env.NAKAMA_PATH, ['--runtime.js_entrypoint', './server.js', '--database.address', "postgres:password@127.0.0.1:5432"]);
  
 serverProcess.stdout.on('data', (data) => {
    console.log(data.toString())
  });
  
  serverProcess.stderr.on('data', (data) => {
    console.error(data.toString());
  });
  
  serverProcess.on('close', (code) => {
    log(`${chalk.green("nakama exited")} with code ${code}`)
  });
}

// Make it so that onChange can only be called every 500ms
// to avoid loading the server twice
const debouncedOnChange = debounce(onChange, 500, { isImmediate: false })

function watcher(error, resp) {
  if (error) {
    console.error("Error initiating watch:", error)
    return
  }

  if ("warning" in resp) {
    log("warning: ", resp.warning)
  }

  // Watchman works by having 1 process with many subscribers
  // (e.g. jest/react-native/relay etc) so we need to ensure
  // that we take into account this app's prefixes
  var pathPrefix = ""
  var root = resp.watch
  if ("relative_path" in resp) {
    pathPrefix = resp.relative_path
  }

  client.command(
    [
      "subscribe",
      root,
      "Nakama Builder",
      {
        // Basically if a .ts file in this folder changes we get a trigger
        expression: ["anyof", ["match", "*.ts"]],
        relative_root: pathPrefix,
        fields: ["name", "exists", "type"],
      },
    ],
    function (error, _resp) {
      if (error) {
        console.error("failed to subscribe: ", error)
        return
      }
      log(`${chalk.green("success")} connected to Watchman`)
    }
  )

  client.on("subscription", async function (resp) {
    console.log("subb")
    // NOOP for large amounts of files, something weird is probably happening
    if (resp.files.length > 10) return
    await debouncedOnChange()
  })

  debouncedOnChange()
}

// Some logging callbacks for debugging
client.on("end", function () {
  // Called when the connection to watchman is terminated
  log("watch over")
})


client.on("error", function (error) {
  console.error("Error while talking to watchman: ", error)
})

client.capabilityCheck({ required: ["relative_root"] }, function (error, _resp) {
  if (error) {
    console.error("Error checking capabilities:", error)
    return
  }
  // log("Talking to watchman version", resp.version)
})

client.command(["watch-project", process.cwd()], watcher)
