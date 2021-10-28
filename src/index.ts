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
}

const { hideBin } = require("yargs/helpers");
const argv = (yargs(hideBin(process.argv))
  .option("c", {
    alias: "channel",
    demandOption: true,
    describe: "Your Twitch channel name.",
    type: "string",
  })
  .option("d", {
    alias: "downloads",
    demandOption: true,
    describe:
      "This needs to be the directory your chrome downloads to by default.",
    type: "string",
  })
  .option("o", {
    alias: "output",
    demandOption: true,
    describe: "This is where you would like the csv file saved",
    type: "string",
  })
  .parse() as unknown) as CliArgs;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const analyticsUrl = `https://dashboard.twitch.tv/u/${argv.c}/channel-analytics`;

const loginHeaderPath = "//*[@class='auth-shell-header-header']";
const exportDataButtonPath = "//*[contains(text(),'Export Data')]";

// const cookiesFilePath = "./cookies.json";

(async function() {
  try {
    let browser = await puppeteer.launch({
      defaultViewport: null,
    });
    let page = await browser.newPage();

    // const cookiesFileExists = await fs.pathExists(cookiesFilePath);
    // if (cookiesFileExists) {
    //   const cookies = JSON.parse(
    //     fs.readFileSync(cookiesFilePath, { encoding: "utf8" })
    //   );
    //   await page.setCookie(...cookies);
    // }

    await page.goto(analyticsUrl, {
      waitUntil: "networkidle2",
    });

    const loginHeader = await page.$x(loginHeaderPath).catch(() => {});

    if (loginHeader) {
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

    // const currentCookies = await page.cookies();
    // if (currentCookies) {
    //   fs.writeFileSync(cookiesFilePath, JSON.stringify(currentCookies));
    // }

    const buttons: ElementHandle<HTMLButtonElement>[] = await page.$x(
      exportDataButtonPath
    );
    await buttons[0].click();

    await wait(20000);

    const downloadedFiles = glob.sync(
      `${argv.d}/Channel Analytics and Revenue by day from *.csv`
    );

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

    fs.moveSync(sortedFiles[0], argv.o, { overwrite: true });

    process.exit(0);
  } catch (e) {
    console.log("Something went wrong: ", e);
    process.exit(-1);
  }
})();
