
import * as Asserts from "https://deno.land/std@0.133.0/testing/asserts.ts";

import { relativePath } from "../core/path.ts";

Deno.test("relative path", () => {
	Asserts.assertEquals(relativePath("//a//", "/"), "../");
});
