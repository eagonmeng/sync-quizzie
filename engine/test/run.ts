import { TestRunner } from "./helpers.ts";
import process from "node:process";
import { registerBasicCases } from "./cases.basic.ts";
import { registerEngineEdgeCases } from "./cases.engine.ts";

async function main() {
    const runner = new TestRunner();
    await registerBasicCases(runner);
    await registerEngineEdgeCases(runner);

    const { results, ok } = await runner.run();
    const lines: string[] = [];
    lines.push("== Engine Test Results ==");
    for (const r of results) {
        lines.push(`${r.passed ? "PASS" : "FAIL"} - ${r.name}`);
        if (!r.passed) {
            lines.push(`  Error: ${String(r.error)}`);
        }
    }
    const summary = `${
        results.filter((r) => r.passed).length
    }/${results.length} passed`;
    lines.push(summary);
    console.log(lines.join("\n"));

    if (!ok) {
        process.exitCode = 1;
    }
}

main();
