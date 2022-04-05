
import * as Path from "https://deno.land/std@0.132.0/path/mod.ts";

export type Matcher = RegExp;
export function newMatcher(pattern: string): Matcher {
	if (pattern.match(/^\^.*\$$/)) {
		// regexp
		return new RegExp(pattern);
	} else {
		// glob
		return Path.globToRegExp(pattern);
	}
}
export function testMatcher(matcher: Matcher, str: string): boolean {
	return matcher.test(str);
}
export function replaceMatcher(matcher: Matcher, str: string, replace: string): string {
	return str.replace(matcher, replace);
}
