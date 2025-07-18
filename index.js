import puppeteer from 'puppeteer';
import _yargs from 'yargs';
import delay from 'delay';
import fs from 'fs';
import path from 'path';

const yargs = _yargs;

const maxYargsWidth = 130;
const yargsWidth = Math.min(yargs.terminalWidth, maxYargsWidth);

let argv = yargs(process.argv.slice(2))
  .detectLocale(false)
  .usage('$0 [options] <url>', 'Take a screenshot of a webpage', (args) => {
    args
      .option('width', {
        description: 'Viewport width',
        type: 'number',
        demandOption: false,
        default: 1920,
      })
      .option('height', {
        description: 'Viewport height',
        type: 'number',
        demandOption: false,
        default: 1080,
      })
      .option('outputDir', {
        description: 'Output directory, defaults to current directory',
        type: 'string',
        demandOption: false,
        default: '.',
      })
      .option('filename', {
        description: 'Filename of the produced screenshot',
        type: 'string',
        demandOption: false,
        default: 'screenshot',
      })
      .option('inputDir', {
        description: 'Input directory, defaults to current directory',
        type: 'string',
        demandOption: false,
        default: '.',
      })
      .option('userAgent', {
        description: 'User agent',
        type: 'string',
        demandOption: false,
        default: '',
      })
      .option('cookies', {
        description: 'Cookies in json format as string',
        type: 'string',
        demandOption: false,
        default: '',
      })
      .option('cookiesFile', {
        description: 'Path of the file containing the cookies',
        type: 'string',
        demandOption: false,
        default: '',
      })
      .option('delay', {
        description: 'Delay before taking the screenshot in ms',
        type: 'number',
        demandOption: false,
        default: 0,
      })
      .option('format', {
        description: 'Image format of the screenshot',
        type: 'string',
        choices: ['png', 'jpeg', 'webp'],
        demandOption: false,
        default: 'png',
      })
      .option('timezone', {
        description: 'Timezone of browser',
        type: 'string',
        demandOption: false,
        default: 'UTC',
      })
      .option('element', {
        description: 'Element to screenshot',
        type: 'string',
        demandOption: false,
        default: '',
      })
      .positional('url', {
        description: 'Url of the webpage you want to take a screenshot of',
        type: 'string',
      })
      .example(
        '$0 https://github.com',
        'Take a screenshot of https://github.com and save it as screenshot.png'
      )
      .example(
        '$0 --cookiesFile=cookies.json https://google.com',
        'Load cookies from cookies.json, take a screenshot of https://google.com and save it as screenshot.png'
      );
  })
  .help('h')
  .alias('h', 'help')
  .version()
  .alias('version', 'v')
  .wrap(yargsWidth).argv;

takeScreenshot(argv);

function takeScreenshot(argv) {
  (async () => {
    const browser = await puppeteer.launch({
      defaultViewport: {
        width: argv.width,
        height: argv.height,
      },
      bindAddress: '0.0.0.0',
      headless: 'new',
      args: [
        '--no-sandbox',
        '--headless',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--remote-debugging-port=9222',
        '--remote-debugging-address=0.0.0.0',
      ],
    });

    const page = await browser.newPage();

    if (argv.userAgent) await page.setUserAgent(argv.userAgent);

    if (argv.cookies) {
      let cookies = JSON.parse(argv.cookies);
      if (Array.isArray(cookies)) {
        await page.setCookie(...cookies);
      } else {
        await page.setCookie(cookies);
      }
    }

    if (argv.cookiesFile) {
      let cookies = JSON.parse(
        fs.readFileSync(path.join(argv.inputDir, argv.cookiesFile))
      );
      if (Array.isArray(cookies)) {
        await page.setCookie(...cookies);
      } else {
        await page.setCookie(cookies);
      }
    }
    await page.emulateTimezone(argv.timezone);

    await page.goto(argv.url);

    if (argv.delay) await delay(argv.delay);

    if (argv.element) {
      const fileElement = await page.waitForSelector(argv.element);
      await fileElement.screenshot({
        path: path
          .join(argv.outputDir, argv.filename + '.' + argv.format)
          .toString(),
      });
    } else {
      await page.screenshot({
        path: path
          .join(argv.outputDir, argv.filename + '.' + argv.format)
          .toString(),
        type: argv.format,
      });
    }

    await browser.close();
  })();
}
