
// import * as Markdown from "https://deno.land/x/markdown@v2.0.0/mod.ts";
import * as Marked from "https://esm.sh/marked@4.2.12";

export async function convert(text: string): Promise<string> {
	// return Markdown.Marked.parse(text).content;
	return Marked.marked.parse(text);
}
