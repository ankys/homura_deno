
import Yargs from "https://deno.land/x/yargs@v17.4.0-deno/deno.ts";

import { version } from "./version.ts";
import { Config } from "./core/config.ts";
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

async function mainBuild(rt: Runtime, modeDryRun: boolean) {
	const site = await loadSite(rt);
	await buildDest(site, rt, modeDryRun);
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
async function mainServer(rt: Runtime, url: URL, hostname: string) {
	await startServer(rt, url, hostname);
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
		rt.showMessage("⚠️", [path]);
		throw null;
	}
	const output = await getOutput(destFile, path, site, rt);
	if (destFile.dynamicInfo) {
		return output;
	} else {
		const text = new TextDecoder().decode(output as Uint8Array);
		return text;
	}
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
	let yargs = Yargs(args);
	yargs.scriptName("homura").version(version).strict();
	yargs.usage("$0 [options] <command> [args]");
	yargs.option("ignore-config", { describe: "Ignore default configs", type: "boolean" });
	yargs.option("config", { alias: "c", describe: "Load config file", type: "string" });
	yargs.option("src", { alias: "s", describe: "Source directory", type: "string", default: "." });
	yargs.option("dest", { alias: "d", describe: "Output directory", type: "string", default: "_site" });
	yargs.option("data", { describe: "Custom data file", type: "string" });
	yargs.option("include", { describe: "Custom file directory", type: "string", default: "_includes" });
	yargs.option("layout", { describe: "Custom layout file directory", type: "string", default: "_layouts" });
	yargs.option("werror", { describe: "Make warnings into errors", type: "boolean" });
	yargs.option("info", { describe: "Show information messages", type: "boolean", default: true });
	yargs.option("debug", { describe: "Show debug messages", type: "boolean", default: false });
	yargs.command(["build", "b"], "Build site", (yargs2: any) => {
		yargs2.option("dry-run", { alias: "n", describe: "Run with no file writing", type: "boolean" });
	});
	yargs.command(["server", "s", "*"], "Start server mode", (yargs2: any) => {
		yargs2.option("server", { describe: "Custom server url", type: "string", default: "http://localhost:8000/" });
		yargs2.option("listen", { describe: "IP address listened", type: "string", default: "0.0.0.0" });
	});
	yargs.command(["info", "i"], "Output configs");
	yargs.command(["list", "l"], "List path of files");
	yargs.command(["output <path>", "o"], "Output a specific file", (yargs2: any) => {
		yargs2.positional("path", { describe: "Path of output file", type: "string" });
	});
	const options = yargs.parse();
	// console.log(options);

	let configEmpty = !!options["ignore-config"];
	let configs: string[] = getStringArray(options["config"]);
	let configOption: Config = {
		src: options["src"],
		dest: options["dest"],
		datas: getStringArray(options["data"]),
		include: options["include"],
		layout: options["layout"],
	};
	const modeWError = !!options["werror"];
	const modeInfo = !!options["info"];
	const modeDebug = !!options["debug"];
	let [configFilesDefault, configDefault] = configEmpty ? [emptyConfigFiles, emptyConfig] : [defaultConfigFiles, defaultConfig];
	const configFiles = configs.concat(configFilesDefault);
	function showMessage(type: string, main?: any[], sub?: any[], error?: any) {
		if (!modeDebug && type === "⏱") {
			return;
		}
		if (!modeInfo && type === "ℹ") {
			return;
		}
		let args: any[] = [type];
		if (main) {
			args = args.concat(main);
		}
		if (sub) {
			args.push("\x1b[2m");
			args = args.concat(sub);
			args.push("\x1b[0m");
		}
		console.error.apply(null, args);
		if (error) {
			console.error(error);
		}
		if (type === "⛔") {
			Deno.exit(1);
		}
		if (modeWError && type === "⚠️") {
			Deno.exit(2);
		}
	}
	const cache: Cache = { cacheConfig: {}, cacheData: {}, cacheLayout: {}, cacheSrc: {} };
	const rt: Runtime = { showMessage, configFiles, configDefault, configOption, cache };

	const command = options._[0];
	if (command == "build" || command == "b") {
		const modeDryRun = !!options["dry-run"];
		return await mainBuild(rt, modeDryRun);
	// } else if (command == "deploy" || command == "d") {
	// 	return await mainDeploy(rt);
	} else if (command == "server" || command == "s" || !command) {
		const serverUrl = new URL(options["server"]);
		const serverAddress = options["listen"];
		return await mainServer(rt, serverUrl, serverAddress);
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
		// error
		rt.showMessage("⚠️", [command]);
		throw null;
	}
}

if (import.meta.main) {
	try {
		const ret = await main(Deno.args);
		if (ret) {
			console.log(ret);
		}
	} catch (e) {
		if (e) {
			console.error(e);
		}
		Deno.exit(1);
	}
}
