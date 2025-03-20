import {
	readFileSync,
	writeFileSync,
	appendFileSync,
	mkdirSync,
} from "node:fs";

import { glob } from "tinyglobby";
import { parse } from "node-html-parser";

import { process } from "../src/util/rehype";
import rehypeParse from "rehype-parse";
import rehypeBaseUrl from "../src/plugins/rehype/base-url";
import rehypeFilterElements from "../src/plugins/rehype/filter-elements";
import remarkGfm from "remark-gfm";
import rehypeRemark from "rehype-remark";
import remarkStringify from "remark-stringify";

const files = await glob("dist/**/*.html", {
	ignore: [
		"dist/index.html",
		"dist/404.html",
		"dist/magic-wan/legal/3rdparty/index.html",
	],
});

for (const file of files) {
	const text = readFileSync(file, "utf-8");
	const html = parse(text);

	const title = html.querySelector("#top")?.innerText;
	const content = html.querySelector(".sl-markdown-content")?.innerHTML;

	if (!content) {
		continue;
		throw new Error(`Couldn't find .sl-markdown-content selector in ${file}`);
	}

	let markdown = await process(content, [
		rehypeParse,
		rehypeBaseUrl,
		rehypeFilterElements,
		remarkGfm,
		rehypeRemark,
		remarkStringify,
	]);

	markdown = `# ${title}\n\n${markdown}`;

	const segments = file.split("/").slice(1, -1);
	const product = segments.at(0);
	const folder = segments.join("/");

	mkdirSync("distmd/" + folder, { recursive: true });

	appendFileSync("distmd/llms-full.txt", markdown);
	appendFileSync(`distmd/${product}/llms-full.txt`, markdown);

	writeFileSync("distmd/" + file.slice(5).replace(".html", ".md"), markdown);
}
