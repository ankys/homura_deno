
import * as Path from "https://deno.land/std@0.132.0/path/mod.ts";
import * as FS from "https://deno.land/std@0.132.0/fs/mod.ts";

import { Runtime, Site, DestFile, TLValue, DestFiles, loadSrcFile } from "./site.ts";
import { importModule } from "../plugin/lib.ts";

export async function FSGetMtime(filepath: string): Promise<Date> {
	try {
		const info = await Deno.stat(filepath);
		const mtime = info.mtime!;
		return mtime;
	} catch (e) {
		return new Date();
	}
}
async function FSIsEmptyDirectory(path: string) {
	for await (const entry of Deno.readDir(path)) {
		return false;
	}
	return true;
}

async function convertText(text: string, engine: string, values: (TLValue | null)[], destFile: DestFile, site: Site, rt: Runtime): Promise<string> {
	const config = site.config;
	const engines1 = config.engines!;
	const engines: { [name: string]: string } = {};
	for (const engine of engines1) {
		const { name, url } = engine;
		engines[name] = url;
	}
	for (const name of engine.split(",")) {
		if (name === "") {
			continue;
		}
		const url = engines[name];
		if (url) {
			let m;
			const [href, fn] = (m = url.match(/^([^#]*)#(.*)$/)) ? [m[1], m[2]] : [url, "default"];
			const convert = await importModule(href, fn);
			try {
				text = await convert(text, values, destFile, site, rt);
			} catch (e) {
				rt.showMessage("⚠️", [destFile.path], null, e);
			}
		}
	}
	return text;
}
export async function buildDynamic(destFile: DestFile, title: string, site: Site, rt: Runtime): Promise<string> {
	const layoutCaches = site.layoutCaches;
	const srcFile = destFile.srcFile;
	const dynamicInfo = destFile.dynamicInfo!;
	const filepathSrc = srcFile.filepath;
	const engine = dynamicInfo.engine;
	const layoutName = dynamicInfo.layout;
	const layout = layoutCaches[layoutName];
	if (layout) {
		const filepathLayout = layout.filepath;
		const engineLayout = layout.engine;
		const valueLayout = layout.value;
		const textLayout = layout.text;
		rt.showMessage("🔥", [title], [filepathSrc, "(" + engine + ")", filepathLayout, "(" + engineLayout + ")"]);
		const [value, text] = (await loadSrcFile(filepathSrc, rt))!;
		const text2 = await convertText(text, engine, [value], destFile, site, rt);
		const valueContent: TLValue = { "content": text2 };
		const text3 = await convertText(textLayout, engineLayout, [valueLayout, value, valueContent], destFile, site, rt);
		return text3;
	} else {
		rt.showMessage("🔥", [title], [filepathSrc, "(" + engine + ")"]);
		const [value, text] = (await loadSrcFile(filepathSrc, rt))!;
		const text2 = await convertText(text, engine, [value], destFile, site, rt);
		return text2;
	}
}

export async function getOutput(destFile: DestFile, title: string, site: Site, rt: Runtime): Promise<string | Uint8Array> {
	if (destFile.dynamicInfo) {
		const t1 = performance.now();
		const text = await buildDynamic(destFile, title, site, rt);
		const t2 = performance.now();
		rt.showMessage("⏱", null, ["get_output", (t2 - t1).toFixed() + "ms"])
		return text;
	} else {
		const srcFile = destFile.srcFile;
		const filepathSrc = srcFile.filepath;
		rt.showMessage("🔥", [title], [filepathSrc]);
		const buf = await Deno.readFile(filepathSrc);
		return buf;
	}
}

export async function buildDest(site: Site, rt: Runtime, modeDryRun?: boolean) {
	const config = site.config;
	const destFiles = site.destFiles;
	const destDir = config.dest!;

	async function sub(filepathDir: string, pathDir: string) {
		for await (const entry of Deno.readDir(filepathDir)) {
			const name = entry.name;
			const filepath = Path.join(filepathDir, name);
			const path = pathDir + "/" + name;
			if (entry.isDirectory) {
				await sub(filepath, path);
				if (await FSIsEmptyDirectory(filepath)) {
					if (!modeDryRun) {
						await Deno.remove(filepath);
					}
				}
			}
			if (entry.isFile) {
				if (!destFiles[path]) {
					rt.showMessage("ℹ", null, [filepath]);
					if (!modeDryRun) {
						await Deno.remove(filepath);
					}
				}
			}
		}
	}
	try {
		await sub(destDir, "");
	} catch { }
	
	for (const [pathDest, destFile] of Object.entries(destFiles)) {
		const filepathDest = destDir + pathDest;
		if (destFile.dynamicInfo) {
			const text = await getOutput(destFile, filepathDest, site, rt) as string;
			if (!modeDryRun) {
				await FS.ensureFile(filepathDest);
				await Deno.writeTextFile(filepathDest, text);
			}
		} else {
			const srcFile = destFile.srcFile;
			const filepathSrc = srcFile.filepath;
			const mtimeSrc = await FSGetMtime(filepathSrc);
			async function main() {
				rt.showMessage("🔥", [filepathDest], [filepathSrc]);
				if (!modeDryRun) {
					await FS.ensureFile(filepathDest);
					await Deno.copyFile(filepathSrc, filepathDest);
				}
			}
			try {
				const infoDest = await Deno.stat(filepathDest);
				const mtimeDest = infoDest.mtime;
				if (mtimeSrc && mtimeDest && mtimeSrc > mtimeDest) {
					await main();
				} else {
					// showMessage("ℹ", "\x1b[2m", pathDest, "\x1b[0m");
				}
			} catch {
				await main();
			}
		}
	}
}
