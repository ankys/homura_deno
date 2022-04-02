
import * as Path from "https://deno.land/std@0.132.0/path/mod.ts";
import * as Yaml from "https://deno.land/std@0.132.0/encoding/yaml.ts";
import * as Toml from "https://deno.land/std@0.132.0/encoding/toml.ts";

// export type Value = { [key: string]: Object };
export type TLValue = Object;

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
	const [mimetype, filepath] = (m = file.match(/^(.*):([^:]*)$/)) ? [m[1], m[2]] : [getMimetype(file), file];
	return [mimetype, filepath];
}

function loadValueYaml<V>(text: string): (V | null) {
	try {
		return Yaml.parse(text) as V;
	} catch (e) {
		console.error(e);
		return null;
	}
}
function loadValueToml<V>(text: string): (V | null) {
	try {
		return Toml.parse(text) as V;
	} catch (e) {
		console.error(e);
		return null;
	}
}
function loadValueJson<V>(text: string): (V | null) {
	try {
		return JSON.parse(text) as V;
	} catch (e) {
		console.error(e);
		return null;
	}
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
export async function loadValueFile<V>(file: string, cache?: [Deno.FileInfo, V | null]): Promise<[Deno.FileInfo, V | null] | null> {
	const [mimetype, filepath] = getFilepath(file);
	try {
		const info = await Deno.stat(filepath);
		if (cache) {
			const [info1, value1] = cache;
			if (info.mtime && info1.mtime && !(info.mtime > info1.mtime)) {
				return [info, value1];
			}
		}
		console.error("ℹ", "\x1b[2m", filepath, "\x1b[0m");
		const text = await Deno.readTextFile(filepath);
		const value = loadValue(text, mimetype);
		if (!value) {
			console.error("⚠️", filepath);
		}
		return [info, value as (V | null)];
	} catch (e) {
		return null;
	}
}

export function parseFrontMatter(text: string): [TLValue | null, string] {
	let m;
	if (m = text.match(/^---(?:\x0D\x0A|\x0D|\x0A)(.*?)(?:\x0D\x0A|\x0D|\x0A)---(?:\x0D\x0A|\x0D|\x0A)(.*)$/s)) {
		const textValue = m[1];
		const text = m[2];
		const value = loadValueYaml<TLValue>(textValue);
		return [value, text];
	} else if (m = text.match(/^\+\+\+(?:\x0D\x0A|\x0D|\x0A)(.*?)(?:\x0D\x0A|\x0D|\x0A)\+\+\+(?:\x0D\x0A|\x0D|\x0A)(.*)$/s)) {
		const textValue = m[1];
		const text = m[2];
		const value = loadValueToml<TLValue>(textValue);
		return [value, text];
	} else if (m = text.match(/^(\{(?:\x0D\x0A|\x0D|\x0A).*?(?:\x0D\x0A|\x0D|\x0A)\})(?:\x0D\x0A|\x0D|\x0A)(.*)$/s)) {
		const textValue = m[1];
		const text = m[2];
		const value = loadValueJson<TLValue>(textValue);
		return [value, text];
	} else if (m = text.match(/^(\{[^\x0D\x0A]*?\})(?:\x0D\x0A|\x0D|\x0A)(.*)$/s)) {
		const textValue = m[1];
		const text = m[2];
		const value = loadValueJson<TLValue>(textValue);
		return [value, text];
	}
	return [{}, text];
}
export async function loadFrontMatterFile(filepath: string, cache?: [Deno.FileInfo, TLValue | null, string]): Promise<[Deno.FileInfo, TLValue | null, string] | null> {
	try {
		const info = await Deno.stat(filepath);
		if (cache) {
			const [info1, value1, text1] = cache;
			if (info.mtime && info1.mtime && !(info.mtime > info1.mtime)) {
				return [info, value1, text1];
			}
		}
		console.error("ℹ", "\x1b[2m", filepath, "\x1b[0m");
		const text = await Deno.readTextFile(filepath);
		const [value, text2] = parseFrontMatter(text);
		return [info, value, text2];
	} catch (e) {
		console.error("⚠️", filepath);
		console.error(e);
		return null;
	}
}
export async function loadFrontMatterFile2(filepath: string, cache?: [Deno.FileInfo, TLValue | null]): Promise<[Deno.FileInfo, TLValue | null] | null> {
	try {
		const info = await Deno.stat(filepath);
		if (cache) {
			const [info1, value1] = cache;
			if (info.mtime && info1.mtime && !(info.mtime > info1.mtime)) {
				return [info, value1];
			}
		}
		console.error("ℹ", "\x1b[2m", filepath, "\x1b[0m");
		const text = await Deno.readTextFile(filepath);
		const [value, text2] = parseFrontMatter(text);
		return [info, value];
	} catch (e) {
		console.error("⚠️", filepath);
		console.error(e);
		return null;
	}
}
export function loadFrontMatterFile2Sync(filepath: string, cache?: [Deno.FileInfo, TLValue | null]): ([Deno.FileInfo, TLValue | null] | null) {
	try {
		const info = Deno.statSync(filepath);
		if (cache) {
			const [info1, value1] = cache;
			if (info.mtime && info1.mtime && !(info.mtime > info1.mtime)) {
				return [info, value1];
			}
		}
		console.error("ℹ", "\x1b[2m", filepath, "\x1b[0m");
		const text = Deno.readTextFileSync(filepath);
		const [value, text2] = parseFrontMatter(text);
		return [info, value];
	} catch (e) {
		console.error("⚠️", filepath);
		console.error(e);
		return null;
	}
}
