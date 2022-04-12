let chromium = require("chrome-aws-lambda");
let { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
let { v4: uuid } = require("@lukeed/uuid");

let s3 = new S3Client({ region: "us-east-1" });
let BUCKET = "vizarr-images";

/**
 * @param {url: string, width?: number, height?: number }} opts
 * @returns {Promise<Buffer>}
 */
async function screenshot({ url, width = 800, height = 418 }) {
	let browser = await chromium.puppeteer.launch({
		args: chromium.args,
		defaultViewport: chromium.defaultViewport,
		executablePath: await chromium.executablePath,
		headless: chromium.headless,
		ignoreHTTPSErrors: true,
	});

	let page = await browser.newPage();
	page.setViewport({ width, height });
	await page.goto(url, { waitUntil: "networkidle0" });
	await page.$eval("#root > div.jss1", (el) => el.style.display = "none"); // hide controls

	let buffer = await page.screenshot({
		type: "jpeg",
		quality: 100,
	});

	await browser.close();
	return buffer;
}

async function handler(event) {
	if (event.httpMethod !== "POST") {
		return { statusCode: 405, body: "Method Not Allowed" };
	}
	let filename = uuid() + ".jpeg";
	let command = new PutObjectCommand({
		Bucket: BUCKET,
		Key: filename,
		Body: await screenshot(JSON.parse(event.body)),
	});
	await s3.send(command);
	return {
		statusCode: 200,
		body: JSON.stringify({
			url: `https://${BUCKET}.s3.amazonaws.com/${filename}`,
		}),
	};
}

exports.handler = handler;
