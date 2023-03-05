
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
	data?: string;
	datafiles?: string[];
	include?: string;
	layout?: string;
	engines?: Engine[];
	layouts?: Layout[];
	statics?: Static[];
	dynamics?: Dynamic[];
	ignores?: string[];
}
export function mergeConfig(config1: Config, config2: Config): Config {
	const src = config2.src || config1.src;
	const dest = config2.dest || config1.dest;
	const index = toA(config1.index).concat(toA(config2.index));
	const data = config2.data || config1.data;
	const datafiles = toA(config1.datafiles).concat(toA(config2.datafiles));
	const include = config2.include || config1.include;
	const layout = config2.layout || config1.layout;
	const engines = toA(config1.engines).concat(toA(config2.engines));
	const layouts = toA(config1.layouts).concat(toA(config2.layouts));
	const statics = toA(config1.statics).concat(toA(config2.statics));
	const dynamics = toA(config1.dynamics).concat(toA(config2.dynamics));
	const ignores = toA(config1.ignores).concat(toA(config2.ignores));
	const config: Config = { src, dest, index, data, datafiles, include, layout, engines, layouts, statics, dynamics, ignores };
	return config;
}
