
export async function importModule(url: string, name: string) {
	const module = await import(url);
	return module[name];
}
