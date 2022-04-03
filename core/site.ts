
import { TLValue, getFilepath, loadValueFile, loadFrontMatterFile, loadFrontMatterFile2Sync } from "./value.ts";
import { Config, Layout, Dynamic, mergeConfig } from "./config.ts";

import * as Path from "https://deno.land/std@0.132.0/path/mod.ts";

export type Convert = (text: string, values: (TLValue | null)[], destFile: DestFile, site: Site, rt: Runtime) => Promise<string>;
export type Cache = {
	cacheConfig: { [file: string]: [Deno.FileInfo, Config | null] },
	cacheData: { [file: string]: [Deno.FileInfo, TLValue | null] },
	cacheLayout: { [filepath: string]: [Deno.FileInfo, TLValue | null, string] },
	cacheSrc: { [filepath: string]: [Deno.FileInfo, TLValue | null] },
}
export type Runtime = { configFiles: string[], configDefault: Config, configOption: Config, serverUrl: URL, serverAddress: string, cache: Cache };

export async function loadConfigFiles(files: string[], config: Config, cache: Cache) {
	for await (const file of files) {
		const c = cache.cacheConfig[file];
		const o = await loadValueFile<Config>(file, c);
		if (o) {
			const t = o;
			const [info, config2] = t;
			if (config2) {
				config = mergeConfig(config, config2);
			}
			cache.cacheConfig[file] = t;
		} else {
			delete cache.cacheConfig[file];
		}
	}
	return config;
}

export async function loadDataFiles(config: Config, cache: Cache) {
	const dataFiles = config.datas as string[];
	let values = [];
	for await (const file of dataFiles) {
		const c = cache.cacheData[file];
		const o = await loadValueFile<TLValue>(file, c);
		if (o) {
			const t = o;
			const [info, value] = t;
			if (value) {
				values.push(value);
			}
			cache.cacheData[file] = t;
		} else {
			delete cache.cacheData[file];
		}
	}
	return values;
}

type LayoutCache = { name: string, filepath: string, engine: string, value: TLValue | null, text: string };
type LayoutCaches = { [name: string]: LayoutCache };
export async function checkLayouts(config: Config, cache: Cache): Promise<LayoutCaches> {
	const layouts = config.layouts as Layout[];
	let layouts2 = {} as LayoutCaches;
	for (const layout of layouts) {
		const { name, filepath, engine } = layout;
		const c = cache.cacheLayout[filepath];
		const o = await loadFrontMatterFile(filepath, c);
		if (o) {
			const t = o;
			const [info, value, text] = t;
			const layout2 = { name, filepath, engine, value, text };
			layouts2[name] = layout2;
			cache.cacheLayout[filepath] = t;
		} else {
			delete cache.cacheLayout[filepath];
		}
	}
	return layouts2;
}

type SrcFile = { path: string, filepath: string };
type SrcFiles = SrcFile[];
export async function checkSrcDir(config: Config, rt: Runtime): Promise<SrcFiles> {
	const srcDir = config.src!;
	let excludes: string[] = [];
	for (const file of rt.configFiles) {
		const [mimetype, filepath] = getFilepath(file);
		excludes.push(filepath);
	}
	excludes.push(config.dest!);
	for (const file of config.datas!) {
		const [mimetype, filepath] = getFilepath(file);
		excludes.push(filepath);
	}
	excludes.push(config.include!);
	for (const layout of config.layouts!) {
		const filepath = layout.filepath;
		excludes.push(filepath);
	}
	// console.log(excludes);
	let ignores: RegExp[] = [];
	for (const ignore of config.ignores!) {
		let matcher = Path.globToRegExp(ignore);
		ignores.push(matcher);
	}
	// console.log(ignores);

	const srcFiles: SrcFiles = [];
	async function sub(filepathDir: string, pathDir: string) {
		for await (const entry of Deno.readDir(filepathDir)) {
			const name = entry.name;
			const filepath = Path.join(filepathDir, name);
			// let filepath = filepath.strip_prefix(".").unwrap_or(&filepath);
			if (excludes.some((exclude) => exclude == filepath)) {
				continue;
			}
			if (ignores.some((ignore) => !!name.match(ignore))) {
				continue;
			}
			const path = pathDir + "/" + name;
			if (ignores.some((ignore) => !!path.match(ignore))) {
				continue;
			}
			// console.log(path, name, filepath);
			if (entry.isDirectory) {
				await sub(filepath, path);
			}
			if (entry.isFile) {
				const srcFile = { path, filepath };
				srcFiles.push(srcFile);
			}
		}
	}
	try {
		await sub(srcDir, "");
	} catch {
		console.log("⚠️", srcDir);
	}
	return srcFiles;
}

export function normalizePath(path: string): string {
	return path.replace(/(^|\/)\/*/g, "/");
}
type Matcher = RegExp;
function newMatcher(pattern: string): RegExp {
	if (pattern.match(/^\^.*\$$/)) {
		return new RegExp(pattern);
	} else {
		// glob
		return Path.globToRegExp(pattern);
	}
}
function replaceMatcher(str: string, matcher: RegExp, replace: string): (string | null) {
	if (str.match(matcher)) {
		return str.replace(matcher, replace);
	}
	return null;
}
function replacePath(path: string, matcher: RegExp, replace: string): (string | null) {
	let m;
	if (m = path.match(/^(.*)(\.[^\/\.]*)$/)) {
		const [base, ext] = [m[1], m[2]];
		const ext2 = replaceMatcher(ext, matcher, replace);
		if (ext2 !== null) {
			const path2 = base + ext2;
			return path2;
		}
	}
	if (m = path.match(/^(.*?)(\.[^\/]*)$/)) {
		// long ext
		const [base, ext] = [m[1], m[2]];
		const ext2 = replaceMatcher(ext, matcher, replace);
		if (ext2 !== null) {
			const path2 = base + ext2;
			return path2;
		}
	}
	if (m = path.match(/^(.*?\/)([^\/]*)$/)) {
		const [base, name] = [m[1], m[2]];
		const name2 = replaceMatcher(name, matcher, replace);
		if (name2 !== null) {
			const path2 = base + name2;
			return path2;
		}
	}
	const path2 = replaceMatcher(path, matcher, replace);
	if (path2 !== null) {
		return path2;
	}
	return null;
}

export type DestFile = { path: string, srcFile: SrcFile, dynamicInfo?: Dynamic }
export type DestFiles = { [path: string]: DestFile }
export function checkSrcFiles(srcFiles: SrcFiles, config: Config): DestFiles {
	let rulesStatic: Matcher[] = [];
	for (const info of config.statics!) {
		const pattern = info.pattern;
		const matcher = newMatcher(pattern);
		rulesStatic.push(matcher);
	}
	let rulesDynamic: [Matcher, string, Dynamic][] = [];
	for (const info of config.dynamics!) {
		const pattern = info.pattern;
		const replace = info.replace;
		const matcher = newMatcher(pattern);
		rulesDynamic.push([matcher, replace, info]);
	}
	// console.log(rulesDynamic);

	let destFiles: DestFiles = {};
	function add(path: string, srcFile: SrcFile, info?: Dynamic) {
		const destFile = { path, srcFile, dynamicInfo: info };
		const destFile2 = destFiles[path];
		if (destFile2) {
			const filepath = destFile.srcFile.filepath;
			const filepath2 = destFile2.srcFile.filepath;
			console.error("⚠️", path, "\x1b[2m", filepath, filepath2, "\x1b[0m");
			return;
		}
		destFiles[path] = destFile;
	}
	function sub(srcFile: SrcFile) {
		const path = srcFile.path;
		for (const matcher of rulesStatic) {
			const path2 = replacePath(path, matcher, "");
			if (path2 !== null) {
				add(path, srcFile);
				return;
			}
		}
		for (const [matcher, replace, info] of rulesDynamic) {
			const path2 = replacePath(path, matcher, replace);
			if (path2 !== null) {
				const path3 = normalizePath(path2);
				add(path3, srcFile, info);
				return;
			}
		}
		add(path, srcFile);
	}
	for (const srcFile of srcFiles) {
		sub(srcFile);
	}
	return destFiles;
}

export async function loadSrcFile(filepath: string, cache: Cache): Promise<([TLValue | null, string] | null)> {
	const o = await loadFrontMatterFile(filepath);
	if (o) {
		const [info, value, text] = o;
		cache.cacheSrc[filepath] = [info, value];
		return [value, text];
	} else {
		delete cache.cacheSrc[filepath];
	}
	return null;
}
export function getSrcValueSync(destFile: DestFile, cache: Cache): (TLValue | null) {
	if (!destFile.dynamicInfo) {
		return null;
	}
	const srcFile = destFile.srcFile;
	const filepath = srcFile.filepath;
	const c = cache.cacheSrc[filepath];
	const o = loadFrontMatterFile2Sync(filepath, c);
	if (o) {
		const [info, value] = o;
		cache.cacheSrc[filepath] = o;
		return value;
	} else {
		delete cache.cacheSrc[filepath];
	}
	return null;
}

export type Site = { config: Config, valuesData: TLValue[], layoutCaches: LayoutCaches, srcFiles: SrcFiles, destFiles: DestFiles };
export async function loadConfig(rt: Runtime): Promise<Config> {
	let config = rt.configDefault;
	config = await loadConfigFiles(rt.configFiles, config, rt.cache);
	config = mergeConfig(config, rt.configOption);
	return config;
}
export async function loadSite(rt: Runtime): Promise<Site> {
	const t1 = performance.now();
	const config = await loadConfig(rt);
	const valuesData = await loadDataFiles(config, rt.cache);
	// console.log(valuesData);
	const layoutCaches = await checkLayouts(config, rt.cache);
	// console.log(layoutCaches);
	const t3 = performance.now();
	const srcFiles = await checkSrcDir(config, rt);
	const t4 = performance.now();
	// console.log(srcFiles);
	const destFiles = await checkSrcFiles(srcFiles, config);
	// console.log(destFiles);
	const site = { config, valuesData, layoutCaches, srcFiles, destFiles };
	const t2 = performance.now();
	console.error("⏱", "\x1b[2m", "load_site", (t2 - t1).toFixed() + "(" + (t4 - t3).toFixed() + ")ms", "\x1b[0m")
	return site;
}
