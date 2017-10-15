/**
 * 可以进行序列化的数据类型   
 * 注意：TypedBuffer、Blob、ArrayBuffer、DataView都会被转换成node的Buffer
 * 
 * @export
 * @enum {number}
 */
export const enum DataType {
    number,
    string,
    boolean,
    null,
    undefined,
    Date,
    RegExp,
    Array,
    Object,
    Buffer,
    unknow  //无法序列化的类型。默认等于undefined
}

export type _basedt =
    number |
    string |
    boolean |
    null |
    undefined |
    Date |
    RegExp |
    Buffer |
    Blob |
    DataView |
    ArrayBuffer |
    Int8Array |
    Int16Array |
    Int32Array |
    Uint8Array |
    Uint8ClampedArray |
    Uint16Array |
    Uint32Array |
    Float32Array |
    Float64Array;

export type dataType = _basedt | Array<_basedt> | { [key: string]: _basedt };