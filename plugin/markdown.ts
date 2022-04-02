
const urlModuleMarkdown = "https://deno.land/x/markdown@v2.0.0/mod.ts";

export async function convert(text: string): Promise<string> {
	const Markdown = await import(urlModuleMarkdown);
	return Markdown.Marked.parse(text).content;
}
