
export function getPathname(path: string, indexFiles: string[]): string {
	// TODO
	let m;
	const [dirname, basename] = (m = path.match(/^(.*?\/)([^\/]*)$/)) ? [m[1], m[2]] : ["", path];
	if (indexFiles.some((indexFile) => indexFile == basename)) {
		return dirname;
	}
	return path;
}
export function resolvePathname(pathname: string, indexFiles: string[]): string[] {
	if (pathname.endsWith("/")) {
		return indexFiles.map((indexFile) => pathname + indexFile);
	}
	return [pathname];
}
