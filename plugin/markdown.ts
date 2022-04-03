
import * as Markdown from "https://deno.land/x/markdown@v2.0.0/mod.ts";

export async function convert(text: string): Promise<string> {
	return Markdown.Marked.parse(text).content;
}
