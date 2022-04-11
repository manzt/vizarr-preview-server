let VIZARR_URL = "https://hms-dbmi.github.io/vizarr/";

async function createImage(url) {
	let body = JSON.stringify({ url });
	let response = await fetch(
		"https://pdyqtglcch.execute-api.us-east-1.amazonaws.com/default/vizarr-pix",
		{ method: "POST", body },
	);
	if (!response.ok) {
		throw new Error("TODO");
	}
	let data = await response.json();
	return data.url;
}

async function html(url, title = "Vizarr") {
	let imageUrl = await IMAGES.get(url);
	if (!imageUrl) {
		imageUrl = await createImage(url);
		await IMAGES.put(url, imageUrl);
	}

	return `\
<!DOCTYPE html>
<head>
	<meta name="twitter:card" content="summary_large_image">
	<meta name="twitter:title" content="${title}">
	<meta name="twitter:image" content="${imageUrl}">
</head>
<body>
	<script>
		window.location.href = "${url}";
	</script>
</body>`;
}

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
	let source = new URL(request.url).searchParams.get("source");
	let url = new URL(VIZARR_URL);
	url.searchParams.set("source", source);
	return new Response(await html(url.href), {
		headers: {
			"Content-Type": "text/html",
		},
	});
}

addEventListener("fetch", (event) => {
	return event.respondWith(handleRequest(event.request));
});
