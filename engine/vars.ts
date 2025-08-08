import { Vars } from "./types.ts";

// Special object that returns new Symbols when accessed
export const $vars = new Proxy({} as Vars, {
    get(_, prop) {
        if (typeof prop === "string") {
            // Return a symbol constructed with the property name
            return Symbol(prop);
        }
        return undefined;
    },
}) as Vars;

// Destructuring binds new symbols with property names
if (import.meta.main) {
    const { user, post } = $vars;
    console.log(user, post);
}
