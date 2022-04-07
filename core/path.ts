
export function normalizePath(path: string): string {
	return path.replace(/(^|\/)\/*/g, "/");
}

export function relativePath(base: string, path: string): string {
	const ns1 = base.split(/\/+/g);
	const ns2 = path.split(/\/+/g);
	ns1.pop();
	let c = ns1.length;
	for (let i = 0; i < ns1.length; i++) {
		if (!(i < ns2.length) || ns1[i] !== ns2[i]) {
			c = i;
			break;
		}
	}
	const ns = [];
	for (let i = c; i < ns1.length; i++) {
		ns.push("..");
	}
	for (let i = c; i < ns2.length; i++) {
		ns.push(ns2[i]);
	}
	const path2 = ns.join("/");
	return path2 || ".";
}
