
import Nunjucks from "https://deno.land/x/nunjucks@3.2.3/mod.js";
import * as Path from "https://deno.land/std@0.132.0/path/mod.ts";

import { getPathname } from "../core/pathname.ts";
import { Runtime, Site, DestFile, TLValue, getSrcValueSync } from "../core/site.ts";
import { FSGetMtime } from "../core/build.ts";

export async function convert(text: string, values: (TLValue | null)[], destFile: DestFile, site: Site, rt: Runtime): Promise<string> {
	const { config, valuesData, layoutCaches, srcFiles, destFiles } = site;
	const filepathInclude = config.include!;
	const indexFiles = config.index!;
	function addExtension(nunjucks: any, name: string, func: Function) {
		const ext = {
			tags: [name],
			parse: (parser: any, nodes: any, lexer: any) => {
				const tok = parser.nextToken();
				const args = parser.parseSignature(null, true);
				parser.advanceAfterBlockEnd(tok.value);
				return new (Nunjucks.nodes.CallExtension as any)(ext, 'run', args);
			},
			run: (...args: any) => {
				const ret = func.apply(null, args);
				return new Nunjucks.runtime.SafeString(ret);
			},
		};
		nunjucks.addExtension(name, ext);
	}
	const Loader = Nunjucks.Loader.extend({
		getSource: (name: string) => {
			const filepath = Path.join(filepathInclude, name);
			console.error("ℹ", "\x1b[2m", filepath, "\x1b[0m");
			const text = Deno.readTextFileSync(filepath);
			return { src: text, path: filepath };
		},
	});
	const nunjucks = new Nunjucks.Environment(new Loader());
	addExtension(nunjucks, "file", (context: any, ...args: any) => {
		const name = args[0];
		for (const loader of context.env.loaders) {
			const info = loader.getSource(name);
			if (info) {
				return info.src;
			}
		}
	});
	nunjucks.addFilter("url", (url: string, base: URL | string) => {
		return new URL(url, base);
	});
	// date
	nunjucks.addGlobal("now", () => {
		return new Date();
	});
	nunjucks.addFilter("date", (date: Date | string) => {
		return new Date(date);
	});
	nunjucks.addFilter("iso_date", (date: Date | string) => {
		return new Date(date).toISOString();
	});
	nunjucks.addFilter("utc_date", (date: Date | string) => {
		return new Date(date).toUTCString();
	});
	nunjucks.addFilter("local_date", (date: Date | string, type?: string) => {
		if (type === "date") {
			return new Date(date).toDateString();
		} else if (type === "time") {
			return new Date(date).toTimeString();
		} else {
			return new Date(date).toString();
		}
	});
	nunjucks.addFilter("locale_date", (date: Date | string, locales?: string, type?: string, options?: Object) => {
		if (type === "date") {
			return new Date(date).toLocaleDateString(locales, options);
		} else if (type === "time") {
			return new Date(date).toLocaleTimeString(locales, options);
		} else {
			return new Date(date).toLocaleString(locales, options);
		}
	});
	// path
	nunjucks.addFilter("pathname", (path: string) => {
		return getPathname(path, indexFiles);
	});
	nunjucks.addGlobal("path", destFile.path);
	const filepathSrc = destFile.srcFile.filepath;
	const mtime = await FSGetMtime(filepathSrc);
	nunjucks.addGlobal("mtime", mtime);
	nunjucks.addGlobal("pages", () => {
		const pages: [string, TLValue][] = [];
		for (const [path, destFile] of Object.entries(site.destFiles)) {
			const value = getSrcValueSync(destFile, rt.cache);
			if (value) {
				pages.push([path, value]);
			}
		}
		return pages;
	});
	let context: { [key: string]: Object } = {};
	for (const value of valuesData.concat(values)) {
		if (!value) {
			continue;
		}
		for (const [key, value2] of Object.entries(value)) {
			context[key] = value2;
		}
	}
	return new Promise((resolve, reject) => {
		try {
			nunjucks.renderString(text, context, (e: any, text2: string) => {
				resolve(text2);
			});
		} catch (e) {
			console.error(e);
			reject(e);
		}
	});
}
