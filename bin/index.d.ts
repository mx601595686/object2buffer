/// <reference types="node" />
import { dataType } from './DataType';
/**
 * 将Blob转换为node Buffer
 */
export declare function blobToNodeBuffer(data: Blob): Promise<Buffer>;
/**
 * 是不是node Buffer
 */
export declare const isNodeBuffer: (data: any) => boolean;
/**
 * node Buffer转Arraybuffer
 */
export declare const nodeBufferToArraybuffer: (data: Buffer) => ArrayBuffer;
/**
 * node Buffer
 */
export declare const NodeBuffer: typeof Buffer;
/**
 * 序列化标记，标记一个Buffer是object2buffer序列化的结果
 */
export declare const _serializeMark: Buffer;
/**
 * 对数据进行序列化。
 * 二进制数据格式： 元素类型 -> [元素长度] -> 元素内容
 */
export declare function serialize(data: dataType[]): Buffer;
/**
 * 对数据进行反序列化。
 * 注意：传入的Buffer需是使用是object2buffer序列化产生的
 */
export declare function deserialize(data: Buffer): dataType[];
