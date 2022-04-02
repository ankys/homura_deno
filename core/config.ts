
function toA<T>(list?: T[]): T[] {
	if (list === undefined) {
		return [];
	}
	return list;
}

export type Layout = { name: string, filepath: string, engine: string };
export type Static = { pattern: string, replace: string };
export type Dynamic = { pattern: string, replace: string, engine: string, layout: string };
export type Config = {
	src?: string;
	dest?: string;
	baseurl?: string;
	index?: string[];
	datas?: string[];
	include?: string;
	layouts?: Layout[];
	statics?: Static[];
	dynamics?: Dynamic[];
	ignores?: string[];
	dry_run?: boolean;
	deploy?: string[];
}
export function mergeConfig(config1: Config, config2: Config): Config {
	const src = config2.src || config1.src;
	const dest = config2.dest || config1.dest;
	const baseurl = config2.baseurl || config1.baseurl;
	const index = toA(config1.index).concat(toA(config2.index));
	const datas = toA(config1.datas).concat(toA(config2.datas));
	const include = config2.include || config1.include;
	const layouts = toA(config1.layouts).concat(toA(config2.layouts));
	const statics = toA(config1.statics).concat(toA(config2.statics));
	const dynamics = toA(config1.dynamics).concat(toA(config2.dynamics));
	const ignores = toA(config1.ignores).concat(toA(config2.ignores));
	const dry_run = config2.dry_run || config1.dry_run;
	const deploy = toA(config1.deploy).concat(toA(config2.deploy));
	const config: Config = { src, dest, baseurl, index, datas, include, layouts, statics, dynamics, ignores, dry_run, deploy };
	return config;
}
