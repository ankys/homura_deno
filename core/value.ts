
import * as Path from "https://deno.land/std@0.132.0/path/mod.ts";
import * as Yaml from "https://deno.land/std@0.132.0/encoding/yaml.ts";
import * as Toml from "https://deno.land/std@0.132.0/encoding/toml.ts";

import { Runtime } from "./site.ts";

// export type Value = { [key: string]: Object };
export type TLValue = Object;
export type TLValueChain = (TLValue | null)[]

export function getMimetype(filepath: string) {
	const ext = Path.extname(filepath);
	switch (ext) {
	case ".yml":
	case ".yaml":
		return "application/x-yaml";
	case ".toml":
		return "application/toml";
	case ".json":
		return "application/json";
	default:
		return "";
	}
}
export function getFilepath(file: string) {
	let m;
	const [filepath, mimetype] = (m = file.match(/^(.*)#([^#]*)$/)) ? [m[1], m[2]] : [file, getMimetype(file)];
	return [filepath, mimetype];
}

function loadValueYaml<V>(text: string): V {
	return Yaml.parse(text) as V;
}
function loadValueToml<V>(text: string): V {
	return Toml.parse(text) as V;
}
function loadValueJson<V>(text: string): V {
	return JSON.parse(text) as V;
}
function loadValue<V>(text: string, mimetype: string): (V | null) {
	switch (mimetype) {
	case "application/x-yaml":
		return loadValueYaml(text);
	case "application/toml":
		return loadValueToml(text);
	case "application/json":
		return loadValueJson(text);
	}
	return null;
}
export async function loadValueFile<V>(file: string, cache: [Deno.FileInfo, V | null] | null, rt: Runtime): Promise<[Deno.FileInfo, V | null] | null> {
	const [filepath, mimetype] = getFilepath(file);
	try {
		const info = await Deno.stat(filepath);
		if (cache) {
			const [info1, value1] = cache;
			if (info.mtime && info1.mtime && !(info.mtime > info1.mtime)) {
				return [info, value1];
			}
		}
		rt.showMessage("ℹ", null, [filepath]);
		const text = await Deno.readTextFile(filepath);
		try {
			const value = loadValue<V>(text, mimetype);
			return [info, value];
		} catch (e) {
			rt.showMessage("⚠️", [filepath], null, e);
			return [info, null];
		}
	} catch (e) {
		return null;
	}
}

export function parseFrontMatter(text: string): [string, string, string] {
	let m;
	if (m = text.match(/^---(?:\x0D\x0A|\x0D|\x0A)(.*?)(?:\x0D\x0A|\x0D|\x0A)---(?:\x0D\x0A|\x0D|\x0A)(.*)$/s)) {
		const mimetype = "application/x-yaml";
		const textValue = m[1];
		const text = m[2];
		return [mimetype, textValue, text];
	} else if (m = text.match(/^\+\+\+(?:\x0D\x0A|\x0D|\x0A)(.*?)(?:\x0D\x0A|\x0D|\x0A)\+\+\+(?:\x0D\x0A|\x0D|\x0A)(.*)$/s)) {
		const mimetype = "application/toml";
		const textValue = m[1];
		const text = m[2];
		return [mimetype, textValue, text];
	} else if (m = text.match(/^(\{(?:\x0D\x0A|\x0D|\x0A).*?(?:\x0D\x0A|\x0D|\x0A)\})(?:\x0D\x0A|\x0D|\x0A)(.*)$/s)) {
		const mimetype = "application/json";
		const textValue = m[1];
		const text = m[2];
		return [mimetype, textValue, text];
	} else if (m = text.match(/^(\{[^\x0D\x0A]*?\})(?:\x0D\x0A|\x0D|\x0A)(.*)$/s)) {
		const mimetype = "application/json";
		const textValue = m[1];
		const text = m[2];
		return [mimetype, textValue, text];
	}
	return ["", "", text];
}
export async function loadFrontMatterFile(filepath: string, cache: [Deno.FileInfo, TLValue | null, string] | null, rt: Runtime): Promise<[Deno.FileInfo, TLValue | null, string] | null> {
	try {
		const info = await Deno.stat(filepath);
		if (cache) {
			const [info1, value1, text1] = cache;
			if (info.mtime && info1.mtime && !(info.mtime > info1.mtime)) {
				return [info, value1, text1];
			}
		}
		rt.showMessage("ℹ", null, [filepath]);
		const text = await Deno.readTextFile(filepath);
		const [mimetype, textValue, text2] = parseFrontMatter(text);
		try {
			const value = loadValue<TLValue>(textValue, mimetype);
			return [info, value, text2];
		} catch (e) {
			rt.showMessage("⚠️", [filepath], null, e);
			return [info, {}, text2];
		}
	} catch (e) {
		rt.showMessage("⚠️", [filepath], null, e);
		return null;
	}
}
export async function loadFrontMatterFile2(filepath: string, cache: [Deno.FileInfo, TLValue | null], rt: Runtime): Promise<[Deno.FileInfo, TLValue | null] | null> {
	try {
		const info = await Deno.stat(filepath);
		if (cache) {
			const [info1, value1] = cache;
			if (info.mtime && info1.mtime && !(info.mtime > info1.mtime)) {
				return [info, value1];
			}
		}
		rt.showMessage("ℹ", null, [filepath]);
		const text = await Deno.readTextFile(filepath);
		const [mimetype, textValue, text2] = parseFrontMatter(text);
		try {
			const value = loadValue<TLValue>(textValue, mimetype);
			return [info, value];
		} catch (e) {
			rt.showMessage("⚠️", [filepath], null, e);
			return [info, {}];
		}
	} catch (e) {
		rt.showMessage("⚠️", [filepath], null, e);
		return null;
	}
}
export function loadFrontMatterFile2Sync(filepath: string, cache: [Deno.FileInfo, TLValue | null], rt: Runtime): ([Deno.FileInfo, TLValue | null] | null) {
	try {
		const info = Deno.statSync(filepath);
		if (cache) {
			const [info1, value1] = cache;
			if (info.mtime && info1.mtime && !(info.mtime > info1.mtime)) {
				return [info, value1];
			}
		}
		rt.showMessage("ℹ", null, [filepath]);
		const text = Deno.readTextFileSync(filepath);
		const [mimetype, textValue, text2] = parseFrontMatter(text);
		try {
			const value = loadValue<TLValue>(textValue, mimetype);
			return [info, value];
		} catch (e) {
			rt.showMessage("⚠️", [filepath], null, e);
			return [info, {}];
		}
	} catch (e) {
		rt.showMessage("⚠️", [filepath], null, e);
		return null;
	}
}
