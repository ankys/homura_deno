
const urlModuleDOM = "https://deno.land/x/deno_dom@v0.1.21-alpha/deno-dom-wasm.ts";
import * as PathPosix from "https://deno.land/std@0.132.0/path/posix.ts";

import { TLValue } from "../core/value.ts";
import { Runtime, Site, DestFile } from "../core/site.ts";

export async function convert(text: string, values: (TLValue | null)[], destFile: DestFile, site: Site, rt: Runtime): Promise<string> {
	const DOM = await import(urlModuleDOM);
	const pathBase = destFile.path;
	const indexFiles = site.config.index as string[];
	function main(url: string) {
		if (PathPosix.parse(url).root != PathPosix.sep) {
			return url;
		}
		const path = url;
		const dirnameBase = PathPosix.dirname(pathBase);
		const path2 = PathPosix.relative(dirnameBase, path);
		if (url.endsWith(PathPosix.sep)) {
			return path2 + PathPosix.sep;
		}
		const obj = PathPosix.parse(path2);
		if (indexFiles.find((indexFile) => indexFile == obj.base)) {
			return obj.dir + PathPosix.sep;
		}
		return path2;
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
