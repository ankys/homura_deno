
const urlModuleMustache = "https://deno.land/x/mustache_ts@v0.4.1.1/mustache.ts";

import { getPathname } from "../core/pathname.ts";
import { TLValue } from "../core/value.ts";
import { Runtime, Site, DestFile, getSrcValueSync } from "../core/site.ts";
import { FSGetMtime } from "../core/build.ts";

import * as Path from "https://deno.land/std@0.132.0/path/mod.ts";

export async function convert(text: string, values: (TLValue | null)[], destFile: DestFile, site: Site, rt: Runtime): Promise<string> {
	const Mustache = await import(urlModuleMustache);
	const { config, valuesData, layoutCaches, srcFiles, destFiles } = site;
	const filepathInclude = config.include!;
	const indexFiles = config.index!;
	const load_file = () => {
		return (text: string, render: any) => {
			const name = text;
			const filepath = Path.join(filepathInclude, name);
			console.error("ℹ", "\x1b[2m", filepath, "\x1b[0m");
			const text2 = Deno.readTextFileSync(filepath);
			return text2;
		};
	};
	const url = (url: string, base: URL | string) => {
		console.log(url, base);
		return new URL(url, base);
	};
	const path = destFile.path;
	const pages = () => {
		const pages: { path: string, page: TLValue}[] = [];
		for (const [path, destFile] of Object.entries(site.destFiles)) {
			if (destFile.dynamicInfo) {
				const value = getSrcValueSync(destFile, rt.cache);
				pages.push({ path, page: value! });
			}
		}
		return pages;
	};
	const view = { load_file, url, path, pages };
	const text2 = Mustache.render(text, view);
	
	// function addExtension(nunjucks: any, name: string, func: Function) {
	// 	const ext = {
	// 		tags: [name],
	// 		parse: (parser: any, nodes: any, lexer: any) => {
	// 			const tok = parser.nextToken();
	// 			const args = parser.parseSignature(null, true);
	// 			parser.advanceAfterBlockEnd(tok.value);
	// 			return new (Nunjucks.nodes.CallExtension as any)(ext, 'run', args);
	// 		},
	// 		run: (...args: any) => {
	// 			const ret = func.apply(null, args);
	// 			return new Nunjucks.runtime.SafeString(ret);
	// 		},
	// 	};
	// 	nunjucks.addExtension(name, ext);
	// }
	// const Loader = Nunjucks.Loader.extend({
	// 	getSource: (name: string) => {
	// 		const filepath = Path.join(filepathInclude, name);
	// 		console.error("ℹ", "\x1b[2m", filepath, "\x1b[0m");
	// 		const text = Deno.readTextFileSync(filepath);
	// 		return { src: text, path: filepath };
	// 	},
	// });
	// const nunjucks = new Nunjucks.Environment(new Loader());
	// addExtension(nunjucks, "file", (context: any, ...args: any) => {
	// 	const name = args[0];
	// 	for (const loader of context.env.loaders) {
	// 		const info = loader.getSource(name);
	// 		if (info) {
	// 			return info.src;
	// 		}
	// 	}
	// });
	// nunjucks.addFilter("date", (date: Date, format?: string) => {
	// 	// TODO
	// 	return date.toISOString();
	// });
	// nunjucks.addFilter("pathname", (path: string) => {
	// 	return getPathname(path, indexFiles);
	// });
	// nunjucks.addGlobal("path", destFile.path);
	// const filepathSrc = destFile.srcFile.filepath;
	// const mtime = await FSGetMtime(filepathSrc);
	// nunjucks.addGlobal("mtime", mtime);
	// // for (const [name, value] of Object.entries(config.nunjucks.globals)) {
	// // 	nunjucks.addGlobal(name, value);
	// // }
	// // for (const [name, func] of Object.entries(config.nunjucks.filters)) {
	// // 	nunjucks.addFilter(name, func);
	// // }
	// // for (const [name, func] of Object.entries(config.nunjucks.extensions)) {
	// // 	addExtension(nunjucks, name, func as Function);
	// // }
	// let context: { [key: string]: Object } = {};
	// for (const value of valuesData.concat(values)) {
	// 	if (!value) {
	// 		continue;
	// 	}
	// 	for (const [key, value2] of Object.entries(value)) {
	// 		context[key] = value2;
	// 	}
	// }
	// return nunjucks.renderString(text, context);
	return text2;
}
