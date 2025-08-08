import { uuid } from "../engine/util.ts";

export interface APIRequestRecord {
    request: string;
    method: string;
    path: string;
    input: unknown;
    output?: unknown;
    resolver?: (out: unknown) => void;
}

export class APIConcept {
    private requests: Map<string, APIRequestRecord> = new Map();

    request(
        { request, method, path, ...input }: {
            request?: string;
            method: string;
            path: string;
            [key: string]: unknown;
        },
    ): { request: string } {
        const id = request ?? uuid();
        let resolver: (out: unknown) => void = () => {};
        const promise = new Promise((res) => {
            resolver = res;
        });
        // Save resolver via closure
        this.requests.set(id, { request: id, method, path, input, resolver });
        // Attach promise for server-side waiting
        (promise as any).request = id;
        return { request: id };
    }

    response(
        { request, output }: { request: string; output: unknown },
    ): { request: string } {
        const rec = this.requests.get(request);
        if (rec) {
            rec.output = output;
            rec.resolver?.(output);
        }
        return { request };
    }

    _get(
        { request }: { request: string },
    ): {
        request: string;
        method: string;
        path: string;
        input: unknown;
        output: unknown;
    }[] {
        const rec = this.requests.get(request);
        return rec
            ? [{
                request: rec.request,
                method: rec.method,
                path: rec.path,
                input: rec.input,
                output: rec.output as unknown,
            }]
            : [];
    }

    async _waitForResponse({ request }: { request: string }): Promise<unknown> {
        const rec = this.requests.get(request);
        if (!rec) return undefined;
        if (rec.output !== undefined) return rec.output;
        return new Promise((resolve) => {
            rec.resolver = resolve;
        });
    }
}
