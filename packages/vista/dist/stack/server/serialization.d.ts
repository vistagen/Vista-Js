import type { StackSerializationMode } from './types';
export interface StackSerializer {
    mode: StackSerializationMode;
    serialize(value: unknown): unknown;
    deserialize(value: unknown): unknown;
}
export declare function serializeWithMode(value: unknown, mode?: StackSerializationMode): unknown;
export declare function deserializeWithMode<T = unknown>(value: unknown, mode?: StackSerializationMode): T;
export declare function createSerializer(mode?: StackSerializationMode): StackSerializer;
