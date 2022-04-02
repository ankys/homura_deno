
import { Runtime, loadSite } from "./site.ts";
import { resolvePathname } from "./pathname.ts";
import { getOutput } from "./build.ts";

import * as HTTPServer from "https://deno.land/std@0.132.0/http/server.ts";

export async function startServer(rt: Runtime) {
	const hostname = "0.0.0.0";
	const port = 8000;
	async function sub(req: Request) {
		const pathname = new URL(req.url).pathname;
		try {
			const site = await loadSite(rt);
			const config = site.config;
			const destFiles = site.destFiles;
			const indexFiles = config.index!;
			const paths = resolvePathname(pathname, indexFiles);
			const path = paths.find((path) => path in destFiles);
			if (!path) {
				console.error("⚠️", pathname);
				return new Response(null, { status: 404 });
			}
			const destFile = destFiles[path];
			const data = await getOutput(destFile, pathname, site, rt);
			const headers = new Headers({ "Content-Location": path, "Content-Type": "" });
			return new Response(data, { headers });
		} catch(e) {
			console.error("⚠️", pathname);
			console.error(e);
			return new Response(null, { status: 500 });
		}
	}
	console.error("ℹ", "http://localhost:" + port + "/", "\x1b[2m", hostname, port, "\x1b[0m");
	await HTTPServer.serve(sub, { hostname, port });
	// const server = Deno.listen({ hostname, port });
	// for await (const conn of server) {
	// 	for await (const event of Deno.serveHttp(conn)) {
	// 		try {
	// 			const res = await sub(event.request);
	// 			event.respondWith(res);
	// 		} catch(e) {
	// 			const url = event.request.url;
	// 			console.error("⚠️", url);
	// 			console.error(e);
	// 			const res = new Response(null, { status: 500 });
	// 			event.respondWith(res);
	// 		}
	// 	}
	// }
}
