
import * as Asserts from "https://deno.land/std@0.133.0/testing/asserts.ts";

import { main } from "../homura.ts";

function splitLines(text: string): string[] {
	let lines = text.split(/\x0D\x0A|\x0D|\x0A/g);
	if (lines[lines.length - 1] === "") {
		lines.pop();
	}
	return lines;
}

Deno.test("config", async () => {
	const config = await main(["info"]);
	const c = await Deno.readTextFile("_correct/config.json");
	Asserts.assertEquals(config, JSON.parse(c));
});

Deno.test("list", async () => {
	const list = await main(["list"]) as string;
	const c = await Deno.readTextFile("_correct/list.txt");
	Asserts.assertEquals(splitLines(list), splitLines(c));
});
