
import * as Asserts from "https://deno.land/std@0.133.0/testing/asserts.ts";

import { main } from "./homura.ts";

Deno.test("config", async () => {
	const config = await main(["info"]);
	Asserts.assertEquals(config, 0);
});
