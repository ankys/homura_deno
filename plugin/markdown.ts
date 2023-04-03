
// import * as Markdown from "https://deno.land/x/markdown@v2.0.0/mod.ts";
// import * as Marked from "https://esm.sh/marked@4.2.12";
import MarkdownIt from "npm:markdown-it@13.0.1"
import MarkdownItAttrs from "npm:markdown-it-attrs@4.1.6"

const mdi = MarkdownIt().use(MarkdownItAttrs);

export async function convert(text: string): Promise<string> {
	// return Markdown.Marked.parse(text).content;
	// return Marked.marked.parse(text);
	return mdi.render(text);
}
