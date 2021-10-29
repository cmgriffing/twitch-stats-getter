#!/usr/bin/env node
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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs-extra");
var puppeteer = require("puppeteer");
var glob = require("glob");
var yargs_1 = require("yargs");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["none"] = 1] = "none";
    LogLevel[LogLevel["core"] = 2] = "core";
    LogLevel[LogLevel["extra"] = 3] = "extra";
})(LogLevel || (LogLevel = {}));
function createLogger(loggerLogLevel) {
    return {
        core: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (loggerLogLevel >= LogLevel.core) {
                console.log.apply(console, args);
            }
        },
        extra: function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            if (loggerLogLevel >= LogLevel.extra) {
                console.info.apply(console, args);
            }
        },
    };
}
var wait = function (ms) { return new Promise(function (resolve) { return setTimeout(resolve, ms); }); };
var hideBin = require("yargs/helpers").hideBin;
var argv = (0, yargs_1.default)(hideBin(process.argv))
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
var currentLogLevel = LogLevel.core;
if (argv.s) {
    currentLogLevel = LogLevel.none;
}
else if (argv.e) {
    currentLogLevel = LogLevel.extra;
}
var logger = createLogger(currentLogLevel);
logger.extra("Arguments:", argv);
var analyticsUrl = "https://dashboard.twitch.tv/u/" + argv.c + "/channel-analytics";
var loginHeaderPath = "//*[@class='auth-shell-header-header']";
var exportDataButtonPath = "//*[contains(text(),'Export Data')]";
// const cookiesFilePath = "./cookies.json";
logger.extra("Initialized");
(function () {
    return __awaiter(this, void 0, void 0, function () {
        var browser, page, loginHeader, buttons, downloadedFiles, sortedFiles, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 14, , 15]);
                    return [4 /*yield*/, puppeteer.launch({
                            defaultViewport: null,
                        })];
                case 1:
                    browser = _a.sent();
                    logger.extra("Puppeteer launched.");
                    return [4 /*yield*/, browser.newPage()];
                case 2:
                    page = _a.sent();
                    logger.extra("Page created.");
                    // const cookiesFileExists = await fs.pathExists(cookiesFilePath);
                    // if (cookiesFileExists) {
                    //   const cookies = JSON.parse(
                    //     fs.readFileSync(cookiesFilePath, { encoding: "utf8" })
                    //   );
                    //   await page.setCookie(...cookies);
                    // }
                    return [4 /*yield*/, page.goto(analyticsUrl, {
                            waitUntil: "networkidle2",
                        })];
                case 3:
                    // const cookiesFileExists = await fs.pathExists(cookiesFilePath);
                    // if (cookiesFileExists) {
                    //   const cookies = JSON.parse(
                    //     fs.readFileSync(cookiesFilePath, { encoding: "utf8" })
                    //   );
                    //   await page.setCookie(...cookies);
                    // }
                    _a.sent();
                    logger.core("Initial URL loaded");
                    return [4 /*yield*/, page.$x(loginHeaderPath).catch(function () { })];
                case 4:
                    loginHeader = _a.sent();
                    if (!loginHeader) return [3 /*break*/, 9];
                    logger.core("Login view detected.");
                    return [4 /*yield*/, browser.close()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, puppeteer.launch({
                            headless: false,
                            defaultViewport: null,
                        })];
                case 6:
                    browser = _a.sent();
                    logger.extra("Puppeteer relaunched");
                    return [4 /*yield*/, browser.newPage()];
                case 7:
                    page = _a.sent();
                    return [4 /*yield*/, page.goto(analyticsUrl, {
                            waitUntil: "networkidle0",
                        })];
                case 8:
                    _a.sent();
                    logger.extra("Relaunched page navigation ended.");
                    _a.label = 9;
                case 9: return [4 /*yield*/, page.waitForXPath(exportDataButtonPath, {
                        timeout: 120000,
                    })];
                case 10:
                    _a.sent();
                    logger.extra("Found download button.");
                    return [4 /*yield*/, page.$x(exportDataButtonPath)];
                case 11:
                    buttons = _a.sent();
                    return [4 /*yield*/, buttons[0].click()];
                case 12:
                    _a.sent();
                    logger.core("Downloading stats...");
                    return [4 /*yield*/, wait(20000)];
                case 13:
                    _a.sent();
                    downloadedFiles = glob.sync(argv.d + "/Channel Analytics and Revenue by day from *.csv");
                    logger.extra("Found downloaded files: ", downloadedFiles);
                    sortedFiles = downloadedFiles.sort(function (fileA, fileB) {
                        var modifiedDateA = fs.statSync(fileA).mtimeMs;
                        var modifiedDateB = fs.statSync(fileB).mtimeMs;
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
                    return [3 /*break*/, 15];
                case 14:
                    e_1 = _a.sent();
                    console.log("Something went wrong: ", e_1);
                    process.exit(-1);
                    return [3 /*break*/, 15];
                case 15: return [2 /*return*/];
            }
        });
    });
})();
