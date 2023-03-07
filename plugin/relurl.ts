
import * as DOM from "https://deno.land/x/deno_dom@v0.1.21-alpha/deno-dom-wasm.ts";

import { relativePath } from "../core/path.ts";
import { getPathname } from "../core/pathname.ts";
import { Runtime, Site, DestFile, TLValueChain, Setting } from "../core/site.ts";

export async function convert(text: string, values: TLValueChain, setting: Setting, destFile: DestFile, site: Site, rt: Runtime): Promise<string> {
	const pathBase = destFile.path;
	const indexFiles = setting.index!;
	function main(url: string) {
		if (!url.startsWith("/")) {
			return url;
		}
		const path = relativePath(pathBase, url);
		const pathname = getPathname(path, indexFiles);
		return pathname;
	}
	const doc = new DOM.DOMParser().parseFromString(text, "text/html")!;
	for (const e of doc.querySelectorAll("[href]")) {
		const url = (e as any).getAttribute("href")!;
		const url2 = main(url);
		(e as any).setAttribute("href", url2);
	}
	for (const e of doc.querySelectorAll("[src]")) {
		const url = (e as any).getAttribute("src")!;
		const url2 = main(url);
		(e as any).setAttribute("src", url2);
	}
	let text2 = "<!DOCTYPE html>\n";
	for (const n of doc.childNodes) {
		if ("outerHTML" in n) {
			text2 += (n as any).outerHTML;
		}
	}
	return text2;
}
