
function toA<T>(list?: T[]): T[] {
	if (list === undefined) {
		return [];
	}
	return list;
}

export type Engine = { name: string, url: string };
export type Layout = { name: string, file: string, engine: string };
export type Static = { pattern: string, replace: string };
export type Dynamic = { pattern: string, replace: string, engine: string, layout: string };
export type Config = {
	src?: string;
	dest?: string;
	index?: string[];
	settings?: string[];
	data?: string[];
	include?: string;
	layout?: string;
	engines?: Engine[];
	layouts?: Layout[];
	statics?: Static[];
	dynamics?: Dynamic[];
	ignores?: string[];
}
export function mergeConfig(a: Config, b: Config): Config {
	const src = b.src || a.src;
	const dest = b.dest || a.dest;
	const index = toA(a.index).concat(toA(b.index));
	const settings = toA(a.settings).concat(toA(b.settings));
	const data = toA(a.data).concat(toA(b.data));
	const include = b.include || a.include;
	const layout = b.layout || a.layout;
	const engines = toA(a.engines).concat(toA(b.engines));
	const layouts = toA(a.layouts).concat(toA(b.layouts));
	const statics = toA(a.statics).concat(toA(b.statics));
	const dynamics = toA(a.dynamics).concat(toA(b.dynamics));
	const ignores = toA(a.ignores).concat(toA(b.ignores));
	const config: Config = { src, dest, index, settings, data, include, layout, engines, layouts, statics, dynamics, ignores };
	return config;
}
export type Setting = {
	index?: string[];
	settings?: string[];
	data?: string[];
	include?: string;
	layout?: string;
	engines?: Engine[];
	layouts?: Layout[];
	statics?: Static[];
	dynamics?: Dynamic[];
	ignores?: string[];
}
export function mergeSetting(a: Config | Setting, b: Config | Setting): Setting {
	const index = toA(a.index).concat(toA(b.index));
	const settings = toA(a.settings).concat(toA(b.settings));
	const data = toA(a.data).concat(toA(b.data));
	const include = b.include || a.include;
	const layout = b.layout || a.layout;
	const engines = toA(a.engines).concat(toA(b.engines));
	const layouts = toA(a.layouts).concat(toA(b.layouts));
	const statics = toA(a.statics).concat(toA(b.statics));
	const dynamics = toA(a.dynamics).concat(toA(b.dynamics));
	const ignores = toA(a.ignores).concat(toA(b.ignores));
	const setting: Setting = { index, settings, data, include, layout, engines, layouts, statics, dynamics, ignores };
	return setting;
}
