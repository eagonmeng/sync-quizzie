// Deno specific helper functions

import { generate } from "jsr:@std/uuid/unstable-v7";
// For node, edit to export util.inspect
export { inspect } from "node:util";

// For node, edit to use crypto.randomUUID()
export function uuid() {
    return generate();
}
