
import Yargs from "https://deno.land/x/yargs@v17.4.0-deno/deno.ts";

import { version } from "./version.ts";
import { Options, Config } from "./core/config.ts";
import { Runtime, Cache, loadConfig, loadSite } from "./core/site.ts";
import { getOutput, buildDest } from "./core/build.ts";
import { startServer } from "./core/server.ts";

const defaultConfigFiles: string[] = [
	// "_config.ts",
	// "_config.js",
	"_config.yml",
	"_config.yaml",
	"_config.toml",
	"_config.json",
];
const defaultConfig: Config = {
	src: ".",
	dest: "_site",
	index: [
		"index.html",
		"index.htm",
	],
	datas: [
		// "_data.ts",
		// "_data.js",
		"_data.yml",
		"_data.yaml",
		"_data.toml",
		"_data.json",
	],
	include: "_includes",
	layout: "_layouts",
	engines: [
		{ name: "t", url: "./nunjucks.ts#convert" },
	],
	layouts: [
		// { name: "default", filepath: "_layout/default.n.html", engine: "t,relurl" },
	],
	statics: [
	],
	dynamics: [
		{ pattern: ".t", replace: "", engine: "t", layout: "" },
		// { type: "name", re: /(.*)\.n\.html/, str: "$1.html", engine: "njk", layout: "default" },
		// { type: "name", re: /(.*)\.n\.md/, str: "$1.html", engine: "njk,md", layout: "default" },
	],
	ignores: [
		// "_*",
	],
};
const emptyConfigFiles: string[] = [
];
const emptyConfig: Config = {
	src: undefined,
	dest: undefined,
	index: undefined,
	datas: undefined,
	include: undefined,
	layout: undefined,
	engines: undefined,
	layouts: undefined,
	statics: undefined,
	dynamics: undefined,
	ignores: undefined,
};

async function mainBuild(rt: Runtime) {
	const site = await loadSite(rt);
	await buildDest(site, rt);
}
async function mainDeploy(rt: Runtime) {
	// const config = await loadConfig(rt);
	// const deploys = config.deploy!;
	// showMessage("🔥", command);
	// const process = Deno.run({ cmd: command.split(" ") });
	// const status = await process.status();
	// if (!status.success) {
	// 	showMessage("⚠️", command, "\x1b[2m", status.code, "\x1b[0m");
	// }
	// return status.code;
}
async function mainServer(rt: Runtime) {
	await startServer(rt);
}
async function mainInfo(rt: Runtime) {
	const config = await loadConfig(rt);
	// return JSON.stringify(config, null, 2);
	return config;
}
async function mainList(rt: Runtime) {
	const site = await loadSite(rt);
	const paths = Object.keys(site.destFiles);
	return paths.join("\n");
}
async function mainOutput(rt: Runtime, path: string) {
	const site = await loadSite(rt);
	const destFiles = site.destFiles;
	const destFile = destFiles[path];
	if (!destFile) {
		console.error("⚠️", path);
		throw "no path";
	}
	const text = await getOutput(destFile, path, site, rt);
	return text;
}

// async function mainNew(path: string, rt: Runtime) {
// 	if (await FSExists(path)) {
// 		showMessage("⚠️", path);
// 		return 1;
// 	}
// 	showMessage("🔥", path);
// 	await Deno.mkdir(path, { recursive: true });
// 	Deno.chdir(path);
// 	const config1 = new Config();
// 	for (const file of rt.configFiles) {
// 		config1.addConfig(file);
// 	}
// 	config1.setup(rt.envConfigDefault);
// 	const configFiles = config1.configs;
// 	const files: { [num: string]: File } = {};
// 	for (let i = 0; i < configFiles.length; i++) {
// 		const file = configFiles[i];
// 		const { path, type } = file;
// 		const num = String(i + 1);
// 		if (type) {
// 			showMessage("[" + num + "]", path, "\x1b[2m", type, "\x1b[0m");
// 		} else {
// 			showMessage("[" + num + "]", path);
// 		}
// 		files[num] = file;
// 	}
// 	showMessage("[0]", "Do nothing");
// 	while (true) {
// 		const line = await IOReadLine("❓");
// 		const num = line!;
// 		if (num == "" || num == "0") {
// 			break;
// 		}
// 		const file = files[num];
// 		if (file) {
// 			const { path, type } = file;
// 			if (type) {
// 				showMessage("🔥", path, "\x1b[2m", type, "\x1b[0m");
// 			} else {
// 				showMessage("🔥", path);
// 			}
// 			const process = Deno.run({ cmd: ["editor", path] });
// 			const status = await process.status();
// 			break;
// 		}
// 	}
// 	const config = await loadConfig(rt);
// 	const srcDir = config.src!;
// 	showMessage("🔥", srcDir);
// 	await Deno.mkdir(srcDir, { recursive: true });
// 	return 0;
// }
// async function mainEdit(pathname: string, rt: Runtime) {
// 	const site = await loadSite(rt);
// 	const indexFiles = site.config.index;
// 	const destFiles = site.destFiles;
// 	const paths = Pathname.resolve(pathname, indexFiles);
// 	const path = paths.find((path) => path in destFiles)!;
// 	const destFile = destFiles[path];
// 	const { path: pathDest, srcFile, dynamicInfo } = destFile;
// 	const { path: pathSrc, filepath: filepathSrc } = srcFile;
// 	showMessage("🔥", pathname, "\x1b[2m", filepathSrc, "\x1b[0m");
// 	const process = Deno.run({ cmd: ["editor", filepathSrc] });
// 	const status = await process.status();
// 	return status.code;
// }

function getStringArray(value: unknown) {
	if (Array.isArray(value)) {
		return value;
	} else if (typeof value == "string") {
		return [value];
	}
	return [];
}
export async function main(args: string[]) {
	const yargs = Yargs(args);
	yargs.scriptName("homura").version(version);
	yargs.command(["build", "b"], "build site");
	yargs.command(["server", "s", "*"], "start server mode");
	yargs.command(["info", "i"], "output configs");
	yargs.command(["list", "l"], "list path of files");
	yargs.command(["output <path>", "o"], "output a specific file");
	yargs.option("ignore-config", { describe: "ignore default configs", type: "boolean" });
	yargs.option("config", { alias: "c", describe: "load config file", type: "string" });
	yargs.option("src", { alias: "s", describe: "source directory", type: "string", default: "." });
	yargs.option("dest", { alias: "d", describe: "output directory", type: "string", default: "_site" });
	yargs.option("data", { describe: "custom data file", type: "string" });
	yargs.option("include", { describe: "custom file directory", type: "string" });
	yargs.option("dry-run", { alias: "n", describe: "run with no file writing", type: "boolean" });
	yargs.option("server", { describe: "url used in server mode", type: "string", default: "http://localhost:8000/" });
	yargs.option("listen", { describe: "address used in server mode", type: "string", default: "0.0.0.0" });
	const options = yargs.parse();
	// console.log(options);

	let configEmpty = !!options["ignore-config"];
	let configs: string[] = getStringArray(options["config"]);
	let configOption: Config = {
		src: options["src"],
		dest: options["dest"],
		datas: getStringArray(options["data"]),
		include: options["include"],
	};
	const dry_run = !!options["dry-run"];
	const serverUrl = new URL(options["server"]);
	const serverAddress = options["listen"];
	const options2: Options = { dry_run, serverUrl, serverAddress };
	// console.log(options2);
	// console.log(configs);

	let [configFilesDefault, configDefault] = configEmpty ? [emptyConfigFiles, emptyConfig] : [defaultConfigFiles, defaultConfig];
	const configFiles = configs.concat(configFilesDefault);
	const cache: Cache = { cacheConfig: {}, cacheData: {}, cacheLayout: {}, cacheSrc: {} };
	const rt: Runtime = { configFiles, configDefault, configOption, options: options2, cache };

	const command = options._[0];
	if (!command) {
		return await mainServer(rt);
	} else if (command == "build" || command == "b") {
		return await mainBuild(rt);
	// } else if (command == "deploy" || command == "d") {
	// 	return await mainDeploy(rt);
	} else if (command == "server" || command == "s") {
		return await mainServer(rt);
	} else if (command == "info" || command == "i") {
		return await mainInfo(rt);
	} else if (command == "list" || command == "l") {
		return await mainList(rt);
	} else if (command == "output" || command == "o") {
		const path = options.path;
		return await mainOutput(rt, path);
	// } else if (command == "new" || command == "n") {
	// 	const path = String(options._[1]);
	// 	return await mainNew(path, rt);
	// } else if (command == "edit" || command == "e") {
	// 	const path = String(options._[1]);
	// 	return await mainEdit(path, rt);
	} else {
		console.error("⚠️", command);
		throw "no command";
	}
}

if (import.meta.main) {
	try {
		const ret = await main(Deno.args);
		if (ret) {
			console.log(ret);
		}
	} catch (e) {
		Deno.exit(1);
	}
}
