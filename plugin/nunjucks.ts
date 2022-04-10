
import Nunjucks from "https://deno.land/x/nunjucks@3.2.3/mod.js";
import * as Path from "https://deno.land/std@0.132.0/path/mod.ts";

import { relativePath } from "../core/path.ts";
import { getPathname } from "../core/pathname.ts";
import { Matcher, newMatcher, testMatcher } from "../core/matcher.ts";
import { Runtime, Site, DestFile, TLValue, getSrcValueSync } from "../core/site.ts";

function toEach<T1, T2>(fn: (...args: any[]) => T2) {
	return (...args: any[]) => {
		const arg = args[0];
		if (!arg) {
			return null;
		} else if (Array.isArray(arg)) {
			let list = [];
			for (const a of arg) {
				args[0] = a;
				list.push(fn.apply(null, args));
			}
			return list;
		} else if (typeof arg === "object") {
			let obj: any = {};
			for (const [key, a] of Object.entries(arg)) {
				args[0] = a;
				obj[key] = fn.apply(null, args);
			}
			return obj;
		} else {
			return fn.apply(null, args);
		}
	};
}
type Info = { fsize: Number, mtime: Date };
function getInfo(filepath: string): Info {
	const info = Deno.statSync(filepath);
	const fsize = info.size;
	const mtime = info.mtime!;
	return { fsize, mtime };
}
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
			rt.showMessage("ℹ", null, [filepath]);
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
	// date
	nunjucks.addGlobal("now", () => {
		return new Date();
	});
	nunjucks.addFilter("date", toEach((date: Date | string) => {
		return new Date(date);
	}));
	nunjucks.addFilter("iso_date", toEach((date: Date | string) => {
		return new Date(date).toISOString();
	}));
	nunjucks.addFilter("utc_date", toEach((date: Date | string) => {
		return new Date(date).toUTCString();
	}));
	nunjucks.addFilter("local_date", toEach((date: Date | string, type?: string) => {
		if (type === "date") {
			return new Date(date).toDateString();
		} else if (type === "time") {
			return new Date(date).toTimeString();
		} else {
			return new Date(date).toString();
		}
	}));
	nunjucks.addFilter("locale_date", toEach((date: Date | string, locales?: string, type?: string, options?: Object) => {
		if (type === "date") {
			return new Date(date).toLocaleDateString(locales, options);
		} else if (type === "time") {
			return new Date(date).toLocaleTimeString(locales, options);
		} else {
			return new Date(date).toLocaleString(locales, options);
		}
	}));
	// path, info, value
	nunjucks.addGlobal("path", destFile.path);
	const info = getInfo(destFile.srcFile.filepath);
	nunjucks.addGlobal("info", info);
	nunjucks.addGlobal("fsize", info.fsize);
	nunjucks.addGlobal("mtime", info.mtime);
	nunjucks.addGlobal("files", (pattern?: string) => {
		const matcher: Matcher | null = pattern ? newMatcher(pattern) : null;
		const paths: string[] = [];
		for (const [path, destFile] of Object.entries(site.destFiles)) {
			if (!matcher || testMatcher(matcher, path)) {
				paths.push(path);
			}
		}
		return paths;
	});
	nunjucks.addGlobal("pages", (pattern?: string) => {
		const matcher: Matcher | null = pattern ? newMatcher(pattern) : null;
		const paths: string[] = [];
		for (const [path, destFile] of Object.entries(site.destFiles)) {
			if (destFile.dynamicInfo) {
				if (!matcher || testMatcher(matcher, path)) {
					paths.push(path);
				}
			}
		}
		return paths;
	});
	nunjucks.addFilter("info", toEach((path: string) => {
		const destFile = site.destFiles[path];
		const info = getInfo(destFile.srcFile.filepath);
		return info;
	}));
	nunjucks.addFilter("fsize", toEach((info: Info) => {
		return info.fsize;
	}));
	nunjucks.addFilter("mtime", toEach((info: Info) => {
		return info.mtime;
	}));
	nunjucks.addFilter("value", toEach((path: string) => {
		const destFile = site.destFiles[path];
		const value = getSrcValueSync(destFile, rt);
		return value;
	}));
	// path
	nunjucks.addFilter("relative", toEach((path: string, base?: string) => {
		base ||= destFile.path;
		return relativePath(base, path);
	}));
	nunjucks.addFilter("pathname", toEach((path: string) => {
		return getPathname(path, indexFiles);
	}));
	nunjucks.addFilter("url", toEach((url: string, base: URL | string) => {
		return new URL(url, base);
	}));
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
				if (e) {
					reject(e);
					return;
				}
				resolve(text2);
			});
		} catch (e) {
			reject(e);
		}
	});
}
