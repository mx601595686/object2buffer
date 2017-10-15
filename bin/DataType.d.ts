/// <reference types="node" />
/**
 * 可以进行序列化的数据类型
 * 注意：TypedBuffer、ArrayBuffer、DataView都会被转换成node的Buffer
 *
 * @export
 * @enum {number}
 */
export declare const enum DataType {
    number = 0,
    string = 1,
    boolean = 2,
    null = 3,
    undefined = 4,
    Date = 5,
    RegExp = 6,
    Array = 7,
    Object = 8,
    Buffer = 9,
    unknow = 10,
}
export declare type _basedt = number | string | boolean | null | undefined | Date | RegExp | Buffer | DataView | ArrayBuffer | Int8Array | Int16Array | Int32Array | Uint8Array | Uint8ClampedArray | Uint16Array | Uint32Array | Float32Array | Float64Array;
export declare type dataType = _basedt | Array<_basedt> | {
    [key: string]: _basedt;
};
