import chromium from "chrome-aws-lambda";

/**
 * @param {string} url
 * @param {{ width: number, height: number }} opts
 * @returns {Promise<Buffer>}
 */
async function screenshot(url, { width, height }) {
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
	await page.$eval("#root > div.jss1", (el) => el?.style?.display = "none"); // hide controls
	
	let data = await page.screenshot({ type: "jpeg", quality: 100 });

	await browser.close();
	return data;
}

/** @type {import("aws-lambda").APIGatewayProxyHandler} */
export async function handler(event) {
	if (event.httpMethod !== "POST") {
		return { statusCode: 405, body: "Method Not Allowed" };
	}
	let { url, width = 800, height = 418 } = JSON.parse(event.body);
	let buffer = await screenshot(url, { width, height });
	return {
		statusCode: 200,
		headers: { "Content-Type": "image/jpeg" },
		body: buffer.toString("base64"),
		isBase64Encoded: true,
	};
}
