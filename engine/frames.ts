export type Mapping = Record<string, unknown>;
export type Frame = Record<symbol, unknown>;

export type ActionFunction<TInput = Mapping, TOutput = Mapping> = (
    input: TInput,
) => TOutput;

type ExtractSymbolMappings<TOutputMapping, TFunctionOutput> = {
    [
        K in keyof TOutputMapping as TOutputMapping[K] extends symbol
            ? TOutputMapping[K]
            : never
    ]: K extends keyof TFunctionOutput ? TFunctionOutput[K] : never;
};

export interface Frames<TFrame extends Frame = Frame> {
    filter<S extends TFrame>(
        predicate: (
            value: TFrame,
            index: number,
            array: TFrame[],
        ) => value is S,
        thisArg?: unknown,
    ): Frames<S>;
    filter(
        predicate: (value: TFrame, index: number, array: TFrame[]) => unknown,
        thisArg?: unknown,
    ): this;

    slice(start?: number, end?: number): this;

    concat(...items: ConcatArray<TFrame>[]): this;
    concat(...items: (TFrame | ConcatArray<TFrame>)[]): this;

    reverse(): this;
    sort(compareFn?: (a: TFrame, b: TFrame) => number): this;

    splice(start: number, deleteCount?: number): this;
    splice(start: number, deleteCount: number, ...items: TFrame[]): this;
}

export class Frames<TFrame extends Frame = Frame> extends Array<TFrame> {
    constructor(...frames: TFrame[]) {
        super(...frames);
        // Return a proxy that only handles method interception
        return new Proxy(this, {
            get(target, prop, receiver) {
                const value = Reflect.get(target, prop, receiver);

                // Only intercept function calls that might return arrays
                if (typeof value === "function" && prop !== "query") {
                    return function (this: Frames<TFrame>, ...args: unknown[]) {
                        const result = value.apply(this, args);

                        // If method returns an array, wrap it
                        if (
                            Array.isArray(result) && !(result instanceof Frames)
                        ) {
                            return new Frames(...result);
                        }

                        return result;
                    };
                }

                return value;
            },
        });
    }

    query<
        TFunction extends (...args: never[]) => unknown[],
        TInputMapping extends Record<string, unknown>,
        TOutputMapping extends Record<string, symbol>,
        TFunctionOutput = ReturnType<TFunction> extends (infer U)[] ? U : never,
        TNewFrame extends Frame =
            & TFrame
            & ExtractSymbolMappings<TOutputMapping, TFunctionOutput>,
    >(
        f: TFunction,
        input: TInputMapping,
        output: TOutputMapping,
    ): Frames<TNewFrame> {
        const result = new Frames<TNewFrame>();

        for (const frame of this) {
            const entries: [string, unknown][] = [];
            // Lookup any unbound variables
            for (const [key, binding] of Object.entries(input)) {
                let value: unknown = binding;
                if (typeof binding === "symbol") {
                    const bound = frame[binding];
                    if (bound === undefined) {
                        throw new Error(
                            `Binding: ${
                                String(binding)
                            } not found in frame: ${frame}`,
                        );
                    }
                    value = bound;
                }
                entries.push([key, value]);
            }
            const boundInput = Object.fromEntries(entries);

            // Execute the function - expect array of bindings
            const functionOutputArray = f(
                boundInput as Parameters<TFunction>[0],
            );

            for (const functionOutput of functionOutputArray) {
                // Create new frame with output bindings
                const newFrame = { ...frame };
                for (const [outputKey, symbolKey] of Object.entries(output)) {
                    if (
                        typeof symbolKey === "symbol" &&
                        functionOutput &&
                        typeof functionOutput === "object" &&
                        outputKey in functionOutput
                    ) {
                        (newFrame as Record<symbol, unknown>)[symbolKey] =
                            (functionOutput as Record<string, unknown>)[
                                outputKey
                            ];
                    }
                }

                result.push(newFrame as unknown as TNewFrame);
            }
        }
        return result;
    }
}
