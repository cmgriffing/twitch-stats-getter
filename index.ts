import * as fs from "fs-extra";
import * as path from "path";
import * as puppeteer from "puppeteer";
import { ElementHandle, Page } from "puppeteer";
import * as glob from "glob";
import * as yargs from "yargs";

const { hideBin } = require("yargs/helpers");
const argv = yargs(hideBin(process.argv))
  .usage("Usage: $0 --o [filePath] ")
  .demandOption(["o"])
  .parse();

if (!argv.o) {
  console.log("No output path given.");
  process.exit(-1);
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const analyticsUrl =
  "https://dashboard.twitch.tv/u/cmgriffing/channel-analytics";

const loginHeaderPath = "//*[@class='auth-shell-header-header']";
const exportDataButtonPath = "//*[contains(text(),'Export Data')]";

const cookiesFilePath = "./cookies.json";

(async function() {
  try {
    let browser = await puppeteer.launch({
      defaultViewport: null,
    });
    let page = await browser.newPage();

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

    const loginHeader = await page.$x(loginHeaderPath).catch(() => {});

    if (loginHeader) {
      // prompt user to login
      // await page.bringToFront();
      await browser.close();
      browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
      });
      page = await browser.newPage();
      await page.goto(analyticsUrl, {
        waitUntil: "networkidle0",
      });
    }

    await page.waitForXPath(exportDataButtonPath, {
      timeout: 120000,
    });

    const currentCookies = await page.cookies();
    if (currentCookies) {
      fs.writeFileSync(cookiesFilePath, JSON.stringify(currentCookies));
    }

    const buttons: ElementHandle<HTMLButtonElement>[] = await page.$x(
      exportDataButtonPath
    );
    await buttons[0].click();

    await wait(20000);

    const downloadedFiles = glob.sync(
      "/Users/cmgriffing/Downloads/Channel Analytics and Revenue by day from *.csv"
    );

    const sortedFiles = downloadedFiles.sort((fileA, fileB) => {
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

    fs.moveSync(sortedFiles[0], argv.o, { overwrite: true });

    process.exit(0);
  } catch (e) {
    console.log("Something went wrong: ", e);
    process.exit(-1);
  }
})();
