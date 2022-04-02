
import { Config } from "../core/config.ts";

const config = new Config();
config.excludes.push(/_.*/)
config.addGlobal("test", "test value");
config.addGlobal("test2", (arg1: string, arg2: string) => arg2 + arg1);
config.addFilter("test3", (arg1: string) => arg1 + arg1);
config.addExtension("test4", (context: any, arg1: string) => arg1);

export default config;

