#!/usr/bin/env node

import * as fs from "fs-extra";
import * as puppeteer from "puppeteer";
import { ElementHandle } from "puppeteer";
import * as glob from "glob";
import yargs from "yargs";

interface CliArgs {
  c: string;
  channel?: string;
  o: string;
  output?: string;
  d: string;
  downloads?: string;
  e?: boolean;
  ["extra-logs"]?: string;
  s?: boolean;
  silent?: string;
}

enum LogLevel {
  none = 1,
  core = 2,
  extra = 3,
}

function createLogger(loggerLogLevel: LogLevel) {
  return {
    core(...args: any[]) {
      if (loggerLogLevel >= LogLevel.core) {
        console.log(...args);
      }
    },
    extra(...args: any[]) {
      if (loggerLogLevel >= LogLevel.extra) {
        console.info(...args);
      }
    },
  };
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const { hideBin } = require("yargs/helpers");
const argv = (yargs(hideBin(process.argv))
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
    describe:
      "This needs to be the directory your chrome downloads to by default.",
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
  .parse() as unknown) as CliArgs;

let currentLogLevel = LogLevel.core;
if (argv.s) {
  currentLogLevel = LogLevel.none;
} else if (argv.e) {
  currentLogLevel = LogLevel.extra;
}

const logger = createLogger(currentLogLevel);

logger.extra("Arguments:", argv);

const analyticsUrl = `https://dashboard.twitch.tv/u/${argv.c}/channel-analytics`;

const loginHeaderPath = "//*[@class='auth-shell-header-header']";
const exportDataButtonPath = "//*[contains(text(),'Export Data')]";

const cookiesFilePath = "./cookies.json";

logger.extra("Initialized");

(async function() {
  try {
    let browser = await puppeteer.launch({
      defaultViewport: null,
    });
    logger.extra("Puppeteer launched.");
    let page = await browser.newPage();
    logger.extra("Page created.");

    const cookiesFileExists = await fs.pathExists(cookiesFilePath);
    if (cookiesFileExists) {
      const cookies = JSON.parse(
        fs.readFileSync(cookiesFilePath, { encoding: "utf8" })
      );
      await page.setCookie(...cookies);
    }

    await page.goto(analyticsUrl, {
      waitUntil: "networkidle2",
    });

    logger.core("Initial URL loaded");

    const loginHeader = await page.$x(loginHeaderPath).catch(() => {});

    if (loginHeader) {
      logger.core("Login view detected.");

      await browser.close();
      browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
      });

      logger.extra("Puppeteer relaunched");

      page = await browser.newPage();
      await page.goto(analyticsUrl, {
        waitUntil: "networkidle0",
      });

      logger.extra("Relaunched page navigation ended.");
    }

    await page.waitForXPath(exportDataButtonPath, {
      timeout: 120000,
    });

    logger.extra("Found download button.");

    const currentCookies = await page.cookies();
    if (currentCookies) {
      fs.writeFileSync(cookiesFilePath, JSON.stringify(currentCookies));
    }

    const buttons: ElementHandle<HTMLButtonElement>[] = await page.$x(
      exportDataButtonPath
    );
    await buttons[0].click();

    logger.core("Downloading stats...");

    await wait(20000);

    const downloadedFiles = glob.sync(
      `${argv.d}/Channel Analytics and Revenue by day from *.csv`
    );

    logger.extra("Found downloaded files: ", downloadedFiles);

    const sortedFiles = downloadedFiles.sort((fileA: string, fileB: string) => {
      const modifiedDateA = fs.statSync(fileA).mtimeMs;
      const modifiedDateB = fs.statSync(fileB).mtimeMs;

      if (modifiedDateA > modifiedDateB) {
        return -1;
      } else if (modifiedDateA < modifiedDateB) {
        return 1;
      } else {
        return 0;
      }
    });

    logger.extra("Sorted Files: ", sortedFiles);

    fs.moveSync(sortedFiles[0], argv.o, { overwrite: true });

    logger.extra("Moved file.");

    process.exit(0);
  } catch (e) {
    console.log("Something went wrong: ", e);
    process.exit(-1);
  }
})();
