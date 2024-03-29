
import * as Path from "https://deno.land/std@0.132.0/path/mod.ts";

import { normalizePath } from "./path.ts";
import { Matcher, newMatcher, testMatcher, replaceMatcher } from "./matcher.ts";
import { TLValue, TLValueChain, getFilepath, loadValueFile, loadFrontMatterFile, loadFrontMatterFile2Sync } from "./value.ts";
import { Config, Setting, Layout, Dynamic, mergeConfig, mergeSetting } from "./config.ts";

export type { TLValue, TLValueChain } from "./value.ts";
export type { Setting } from "./config.ts";
export type Convert = (text: string, value: TLValueChain, destFile: DestFile, site: Site, rt: Runtime) => Promise<string>;
export type Cache = {
	cacheConfig: { [file: string]: [Deno.FileInfo, Config | null] },
	cacheSetting: { [file: string]: [Deno.FileInfo, Setting | null] },
	cacheData: { [file: string]: [Deno.FileInfo, TLValue | null] },
	cacheLayout: { [filepath: string]: [Deno.FileInfo, TLValue | null, string] },
	cacheSrc: { [filepath: string]: [Deno.FileInfo, TLValue | null] },
}
export type Runtime = { showMessage: (...args: any[]) => void, configFiles: string[], configDefault: Config, configOption: Config, cache: Cache };

export async function loadConfigFiles(files: string[], config: Config, rt: Runtime) {
	for await (const file of files) {
		const c = rt.cache.cacheConfig[file];
		const o = await loadValueFile<Config>(file, c, rt);
		if (o) {
			const t = o;
			const [info, config2] = t;
			if (config2) {
				config = mergeConfig(config, config2);
			}
			rt.cache.cacheConfig[file] = t;
		} else {
			delete rt.cache.cacheConfig[file];
		}
	}
	return config;
}

export async function loadSettingFile(file: string, rt: Runtime) {
	const c = rt.cache.cacheSetting[file];
	const o = await loadValueFile<Setting>(file, c, rt);
	if (o) {
		const t = o;
		const [_info, setting] = t;
		rt.cache.cacheSetting[file] = t;
		return setting;
	} else {
		delete rt.cache.cacheSetting[file];
	}
	return null;
}
export async function loadDataFile(file: string, rt: Runtime) {
	const c = rt.cache.cacheData[file];
	const o = await loadValueFile<TLValue>(file, c, rt);
	if (o) {
		const t = o;
		const [_info, value] = t;
		rt.cache.cacheData[file] = t;
		return value;
	} else {
		delete rt.cache.cacheData[file];
	}
	return null;
}

type LayoutCache = { name: string, filepath: string, engine: string, value: TLValue | null, text: string };
type LayoutCaches = { [name: string]: LayoutCache };
export async function checkLayouts(config: Config, rt: Runtime): Promise<LayoutCaches> {
	const filepathLayout = config.layout!;
	const layouts = config.layouts!;
	let layouts2: LayoutCaches = {};
	for (const layout of layouts) {
		const { name, file, engine } = layout;
		const filepath = Path.join(filepathLayout, file);
		const c = rt.cache.cacheLayout[filepath];
		const o = await loadFrontMatterFile(filepath, c, rt);
		if (o) {
			const t = o;
			const [info, value, text] = t;
			const layout2 = { name, filepath, engine, value, text };
			layouts2[name] = layout2;
			rt.cache.cacheLayout[filepath] = t;
		} else {
			delete rt.cache.cacheLayout[filepath];
		}
	}
	return layouts2;
}

function splitArray(list: string[], list2: string[]) {
	let a = [];
	let b = [];
	for (const item of list) {
		if (list2.some((item2) => item2 === item)) {
			a.push(item);
		} else {
			b.push(item);
		}
	}
	return [a, b];
}
type SrcFile = { path: string, filepath: string, setting: Setting, values: TLValueChain };
type SrcFiles = SrcFile[];
export async function checkSrcDir(config: Config, rt: Runtime): Promise<SrcFiles> {
	const srcDir = config.src!;
	const setting = config as Setting;

	let excludes: string[] = [];
	for (const file of rt.configFiles) {
		const [filepath, _mimetype] = getFilepath(file);
		excludes.push(filepath);
	}
	excludes.push(config.dest!);
	excludes.push(config.include!);
	excludes.push(config.layout!);
	// console.log(excludes);

	const srcFiles: SrcFiles = [];
	async function sub(filepathDir: string, pathDir: string, settingC: Setting, valuesC: TLValueChain) {
		const settingFiles = settingC.settings as string[];
		let directories = [];
		let files = [];
		for await (const entry of Deno.readDir(filepathDir)) {
			const name = entry.name;
			if (entry.isDirectory) {
				directories.push(name);
			} else if (entry.isFile) {
				files.push(name);
			}
		}
		files.sort();
		directories.sort();
		const [settings, settingsN] = splitArray(files, settingFiles);
		let setting = settingC;
		for (const name of settings) {
			const filepath = Path.join(filepathDir, name);
			const setting2 = await loadSettingFile(filepath, rt);
			if (setting2) {
				setting = mergeSetting(setting, setting2);
			}
			// console.log(setting);
		}
		const dataFiles = setting.data as string[];
		const [datas, datasN] = splitArray(files, dataFiles);
		let values = Array.from(valuesC);
		for (const name of datas) {
			const filepath = Path.join(filepathDir, name);
			const value = await loadDataFile(filepath, rt);
			values.push(value);
		}
		let ignores: RegExp[] = [];
		for (const ignore of setting.ignores!) {
			const matcher = Path.globToRegExp(ignore);
			ignores.push(matcher);
		}
		// console.log(ignores);
		const srcs = datasN;
		for (const name of srcs) {
			const filepath = Path.join(filepathDir, name);
			if (excludes.some((exclude) => exclude == filepath)) {
				continue;
			}
			if (ignores.some((ignore) => !!name.match(ignore))) {
				continue;
			}
			const path = pathDir + "/" + name;
			const srcFile = { path, filepath, setting, values };
			srcFiles.push(srcFile);
		}
		for (const name of directories) {
			const filepath = Path.join(filepathDir, name);
			if (excludes.some((exclude) => exclude == filepath)) {
				continue;
			}
			if (ignores.some((ignore) => !!name.match(ignore))) {
				continue;
			}
			const path = pathDir + "/" + name;
			await sub(filepath, path, setting, values);
		}
	}
	try {
		let values: TLValueChain = [];
		await sub(srcDir, "", setting, values);
	} catch {
		console.log("⚠️", srcDir);
	}
	return srcFiles;
}

function replacePath(path: string, matcher: Matcher, replace: string): (string | null) {
	// /a/b/c.d.e.txt -> .txt .e.txt .d.e.txt c.d.e.txt /a/b/c.d.e.txt
	let m;
	const [dir, name] = (m = path.match(/^(.*?\/)([^\/]*)$/)) ? [m[1], m[2]] : ["", path];
	const fs = name.split(".");
	for (let i = 1; i < fs.length; i++) {
		const base = fs.slice(0, fs.length - i).join(".");
		const ext = name.substring(base.length);
		if (testMatcher(matcher, ext)) {
			const ext2 = replaceMatcher(matcher, ext, replace);
			const path2 = dir + base + ext2;
			return path2;
		}
	}
	if (testMatcher(matcher, name)) {
		const name2 = replaceMatcher(matcher, name, replace);
		const path2 = dir + name2;
		return path2;
	}
	if (testMatcher(matcher, path)) {
		const path2 = replaceMatcher(matcher, path, replace);
		return path2;
	}
	return null;
}

export type DestFile = { path: string, srcFile: SrcFile, dynamicInfo?: Dynamic }
export type DestFiles = { [path: string]: DestFile }
export function checkSrcFiles(srcFiles: SrcFiles, config: Config, rt: Runtime): DestFiles {
	let rulesStatic: [Matcher, string][] = [];
	for (const info of config.statics!) {
		const pattern = info.pattern;
		const replace = info.replace;
		const matcher = newMatcher(pattern);
		rulesStatic.push([matcher, replace]);
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
			rt.showMessage("⚠️", [path], [filepath, filepath2]);
			return;
		}
		destFiles[path] = destFile;
	}
	for (const srcFile of srcFiles) {
		let flag = false;
		const path = srcFile.path;
		for (const [matcher, replace] of rulesStatic) {
			const path2 = replacePath(path, matcher, replace);
			if (path2 !== null) {
				const path3 = normalizePath(path2);
				add(path3, srcFile);
				flag = true;
			}
		}
		for (const [matcher, replace, info] of rulesDynamic) {
			const path2 = replacePath(path, matcher, replace);
			if (path2 !== null) {
				const path3 = normalizePath(path2);
				add(path3, srcFile, info);
				flag = true;
			}
		}
		if (!flag) {
			// static file
			add(path, srcFile);
		}
	}
	return destFiles;
}

export async function loadSrcFile(filepath: string, rt: Runtime): Promise<([TLValue | null, string] | null)> {
	const o = await loadFrontMatterFile(filepath, null, rt);
	if (o) {
		const [info, value, text] = o;
		rt.cache.cacheSrc[filepath] = [info, value];
		return [value, text];
	} else {
		delete rt.cache.cacheSrc[filepath];
	}
	return null;
}
export function getSrcValueSync(destFile: DestFile, rt: Runtime): (TLValue | null) {
	if (!destFile.dynamicInfo) {
		return null;
	}
	const srcFile = destFile.srcFile;
	const filepath = srcFile.filepath;
	const c = rt.cache.cacheSrc[filepath];
	const o = loadFrontMatterFile2Sync(filepath, c, rt);
	if (o) {
		const [info, value] = o;
		rt.cache.cacheSrc[filepath] = o;
		return value;
	} else {
		delete rt.cache.cacheSrc[filepath];
	}
	return null;
}

export type Site = { config: Config, layoutCaches: LayoutCaches, srcFiles: SrcFiles, destFiles: DestFiles };
export async function loadConfig(rt: Runtime): Promise<Config> {
	let config = rt.configDefault;
	config = await loadConfigFiles(rt.configFiles, config, rt);
	config = mergeConfig(config, rt.configOption);
	return config;
}
export async function loadSite(rt: Runtime): Promise<Site> {
	const t1 = performance.now();
	const config = await loadConfig(rt);
	const layoutCaches = await checkLayouts(config, rt);
	// console.log(layoutCaches);
	const t3 = performance.now();
	const srcFiles = await checkSrcDir(config, rt);
	const t4 = performance.now();
	// console.log(srcFiles);
	const destFiles = await checkSrcFiles(srcFiles, config, rt);
	// console.log(destFiles);
	const site = { config, layoutCaches, srcFiles, destFiles };
	const t2 = performance.now();
	rt.showMessage("⏱", null, ["load_site", (t2 - t1).toFixed() + "(" + (t4 - t3).toFixed() + ")ms"]);
	return site;
}
