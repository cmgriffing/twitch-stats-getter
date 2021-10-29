"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs-extra");
const puppeteer = require("puppeteer");
const glob = require("glob");
const yargs_1 = require("yargs");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["none"] = 1] = "none";
    LogLevel[LogLevel["core"] = 2] = "core";
    LogLevel[LogLevel["extra"] = 3] = "extra";
})(LogLevel || (LogLevel = {}));
function createLogger(loggerLogLevel) {
    return {
        core(...args) {
            if (loggerLogLevel >= LogLevel.core) {
                console.log(...args);
            }
        },
        extra(...args) {
            if (loggerLogLevel >= LogLevel.extra) {
                console.info(...args);
            }
        },
    };
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const { hideBin } = require("yargs/helpers");
const argv = (0, yargs_1.default)(hideBin(process.argv))
    .option("c", {
    alias: "channel",
    demandOption: true,
    describe: "Your Twitch channel name.",
    type: "string",
})
    .option("o", {
    alias: "output",
    demandOption: true,
    describe: "This is where you would like the csv file saved",
    type: "string",
})
    .option("d", {
    alias: "downloads",
    demandOption: true,
    describe: "This needs to be the directory your chrome downloads to by default.",
    type: "string",
})
    .option("e", {
    alias: "extra-logs",
    describe: "Display extra logs for debugging",
    type: "boolean",
    default: false,
})
    .option("s", {
    alias: "silent",
    describe: "Hide all logs. Takes precedence over extra-logs.",
    type: "boolean",
    default: false,
})
    .parse();
let currentLogLevel = LogLevel.core;
if (argv.s) {
    currentLogLevel = LogLevel.none;
}
else if (argv.e) {
    currentLogLevel = LogLevel.extra;
}
const logger = createLogger(currentLogLevel);
logger.extra("Arguments:", argv);
const analyticsUrl = `https://dashboard.twitch.tv/u/${argv.c}/channel-analytics`;
const loginHeaderPath = "//*[@class='auth-shell-header-header']";
const exportDataButtonPath = "//*[contains(text(),'Export Data')]";
// const cookiesFilePath = "./cookies.json";
logger.extra("Initialized");
(function () {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let browser = yield puppeteer.launch({
                defaultViewport: null,
            });
            logger.extra("Puppeteer launched.");
            let page = yield browser.newPage();
            logger.extra("Page created.");
            // const cookiesFileExists = await fs.pathExists(cookiesFilePath);
            // if (cookiesFileExists) {
            //   const cookies = JSON.parse(
            //     fs.readFileSync(cookiesFilePath, { encoding: "utf8" })
            //   );
            //   await page.setCookie(...cookies);
            // }
            yield page.goto(analyticsUrl, {
                waitUntil: "networkidle2",
            });
            logger.core("Initial URL loaded");
            const loginHeader = yield page.$x(loginHeaderPath).catch(() => { });
            if (loginHeader) {
                logger.core("Login view detected.");
                yield browser.close();
                browser = yield puppeteer.launch({
                    headless: false,
                    defaultViewport: null,
                });
                logger.extra("Puppeteer relaunched");
                page = yield browser.newPage();
                yield page.goto(analyticsUrl, {
                    waitUntil: "networkidle0",
                });
                logger.extra("Relaunched page navigation ended.");
            }
            yield page.waitForXPath(exportDataButtonPath, {
                timeout: 120000,
            });
            logger.extra("Found download button.");
            // const currentCookies = await page.cookies();
            // if (currentCookies) {
            //   fs.writeFileSync(cookiesFilePath, JSON.stringify(currentCookies));
            // }
            const buttons = yield page.$x(exportDataButtonPath);
            yield buttons[0].click();
            logger.core("Downloading stats...");
            yield wait(20000);
            const downloadedFiles = glob.sync(`${argv.d}/Channel Analytics and Revenue by day from *.csv`);
            logger.extra("Found downloaded files: ", downloadedFiles);
            const sortedFiles = downloadedFiles.sort((fileA, fileB) => {
                const modifiedDateA = fs.statSync(fileA).mtimeMs;
                const modifiedDateB = fs.statSync(fileB).mtimeMs;
                if (modifiedDateA > modifiedDateB) {
                    return -1;
                }
                else if (modifiedDateA < modifiedDateB) {
                    return 1;
                }
                else {
                    return 0;
                }
            });
            logger.extra("Sorted Files: ", sortedFiles);
            fs.moveSync(sortedFiles[0], argv.o, { overwrite: true });
            logger.extra("Moved file.");
            process.exit(0);
        }
        catch (e) {
            console.log("Something went wrong: ", e);
            process.exit(-1);
        }
    });
})();
