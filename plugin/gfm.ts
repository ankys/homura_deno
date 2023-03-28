
import * as GFM from "https://deno.land/x/gfm@0.2.1/mod.ts";

export async function convert(text: string): Promise<string> {
	return GFM.render(text);
}
