// Node helper functions
export { inspect } from "node:util";
import { randomUUID } from "node:crypto";

export function uuid() {
    return randomUUID();
}
