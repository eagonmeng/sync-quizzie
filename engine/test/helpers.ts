/* Test helpers and logging capture */
import { Logging, SyncConcept } from "../mod.ts";

export type AsyncTest = () => Promise<void> | void;

export interface TestResult {
    name: string;
    passed: boolean;
    error?: unknown;
    logs: string[];
}

export class TestRunner {
    private cases: { name: string; fn: AsyncTest }[] = [];
    private beforeEachFns: AsyncTest[] = [];
    private afterEachFns: AsyncTest[] = [];

    test(name: string, fn: AsyncTest) {
        this.cases.push({ name, fn });
    }

    beforeEach(fn: AsyncTest) {
        this.beforeEachFns.push(fn);
    }

    afterEach(fn: AsyncTest) {
        this.afterEachFns.push(fn);
    }

    async run(): Promise<{ results: TestResult[]; ok: boolean }> {
        const results: TestResult[] = [];
        for (const { name, fn } of this.cases) {
            const logs: string[] = [];
            const restore = captureConsole((...args) => {
                logs.push(args.map(String).join(" "));
            });
            try {
                for (const b of this.beforeEachFns) await b();
                await fn();
                for (const a of this.afterEachFns) await a();
                results.push({ name, passed: true, logs });
            } catch (error) {
                results.push({ name, passed: false, error, logs });
            } finally {
                restore();
            }
        }
        const ok = results.every((r) => r.passed);
        return { results, ok };
    }
}

export function setLogging(sync: SyncConcept, level: Logging) {
    sync.logging = level;
}

export function captureConsole(onLog: (...args: unknown[]) => void) {
    const original = console.log;
    console.log = (...args: unknown[]) => {
        try {
            onLog(...args);
        } catch {
            // ignore logging capture failures
        }
        original.apply(console, args);
    };
    return () => {
        console.log = original;
    };
}

export function assert(condition: unknown, message = "Assertion failed") {
    if (!condition) throw new Error(message);
}

export function assertEqual<T>(a: T, b: T, message?: string) {
    if (a !== b) {
        throw new Error(
            message ?? `Expected ${String(a)} to equal ${String(b)}`,
        );
    }
}

export function assertDeepEqual(a: unknown, b: unknown, message?: string) {
    const aj = JSON.stringify(a);
    const bj = JSON.stringify(b);
    if (aj !== bj) {
        throw new Error(message ?? `Deep equal failed:\n${aj}\n!==\n${bj}`);
    }
}

export function countLogLines(logs: string[], includes: string) {
    return logs.filter((l) => l.includes(includes)).length;
}

export function pickLogLines(logs: string[], includes: string) {
    return logs.filter((l) => l.includes(includes));
}
