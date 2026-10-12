declare module 'pako' {
  export class Inflate {
    constructor(options?: any);
    onData: (chunk: Uint8Array) => void;
    onEnd: (status: number) => void;
    push(data: Uint8Array, flushMode?: boolean | number): boolean;
    err: number;
    msg: string;
    result: Uint8Array;
  }
  export function inflate(data: Uint8Array | ArrayBuffer, options?: any): Uint8Array;
}
