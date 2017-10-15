import { dataType, DataType } from './DataType';
const blobToNodeBuffer = require('blob-to-buffer');
const typedArrayToNodeBuffer = require("typedarray-to-buffer");
const isNode = require('is-node');

export const isNodeBuffer: (data: Buffer) => boolean = require('is-buffer');
export const nodeBufferToArraybuffer: (data: Buffer) => ArrayBuffer = require('to-arraybuffer');
export const NodeBuffer: typeof Buffer = isNode ? Buffer : require('buffer/').Buffer;

/**
 * 序列化标记，标记一个Buffer是object2buffer序列化的结果
 */
export const _serializeMark = NodeBuffer.from('+o2b`');

/**
 * 对数据进行序列化。
 * 二进制数据格式： 元素类型 -> [元素长度] -> 元素内容   
 */
export function serialize(data: dataType[]): Buffer {
    const bufferItems: Buffer[] = [_serializeMark];

    for (let item of <any>data) switch (Object.prototype.toString.call(item)) {
        case '[object Number]': {
            const type = NodeBuffer.alloc(1);
            const content = NodeBuffer.alloc(8);

            type.writeUInt8(DataType.number, 0);
            content.writeDoubleBE(item, 0);

            bufferItems.push(type, content);
            break;
        }
        case '[object String]': {
            const type = NodeBuffer.alloc(1);
            const content = NodeBuffer.from(item);
            const contentLength = NodeBuffer.alloc(8);

            type.writeUInt8(DataType.string, 0);
            contentLength.writeDoubleBE(content.length, 0);

            bufferItems.push(type, contentLength, content);
            break;
        }
        case '[object Boolean]': {
            const type = NodeBuffer.alloc(1);
            const content = NodeBuffer.alloc(1);

            type.writeUInt8(DataType.boolean, 0);
            content.writeUInt8(item ? 1 : 0, 0);

            bufferItems.push(type, content);
            break;
        }
        case '[object Null]': {
            const type = NodeBuffer.alloc(1);
            type.writeUInt8(DataType.null, 0);

            bufferItems.push(type);
            break;
        }
        case '[object Undefined]': {
            const type = NodeBuffer.alloc(1);
            type.writeUInt8(DataType.undefined, 0);

            bufferItems.push(type);
            break;
        }
        case '[object Date]': {
            const type = NodeBuffer.alloc(1);
            const content = NodeBuffer.alloc(8);

            type.writeUInt8(DataType.Date, 0);
            content.writeDoubleBE(item.getTime(), 0);

            bufferItems.push(type, content);
            break;
        }
        case '[object RegExp]': {
            const type = NodeBuffer.alloc(1);

            const source = item.source; //正则匹配模式 
            const flags = item.flags;

            const sourceContent = NodeBuffer.from(source);
            const sourceContentLength = NodeBuffer.alloc(8);
            const flagsContent = NodeBuffer.from(flags);
            const flagsContentLength = NodeBuffer.alloc(8);

            type.writeUInt8(DataType.RegExp, 0);
            sourceContentLength.writeDoubleBE(sourceContent.length, 0);
            flagsContentLength.writeDoubleBE(flagsContent.length, 0);

            bufferItems.push(type, sourceContentLength, sourceContent, flagsContentLength, flagsContent);
            break;
        }
        case '[object Array]': {
            const type = NodeBuffer.alloc(1);
            const content = serialize(item);
            const contentLength = NodeBuffer.alloc(8);

            type.writeUInt8(DataType.Array, 0);
            contentLength.writeDoubleBE(content.length, 0);

            bufferItems.push(type, contentLength, content);
            break;
        }
        case '[object Object]': {
            const keys = Object.keys(item);
            const values = keys.map(key => item[key]);

            const type = NodeBuffer.alloc(1);
            const content = serialize([keys, values]);
            const contentLength = NodeBuffer.alloc(8);

            type.writeUInt8(DataType.Object, 0);
            contentLength.writeDoubleBE(content.length, 0);

            bufferItems.push(type, contentLength, content);
            break;
        }
        case isNodeBuffer(item): {
            const type = NodeBuffer.alloc(1);
            const content = item;
            const contentLength = NodeBuffer.alloc(8);

            type.writeUInt8(DataType.Buffer, 0);
            contentLength.writeDoubleBE(content.length, 0);

            bufferItems.push(type, contentLength, content);
            break;
        }
        case '[object Blob]': {
            const type = NodeBuffer.alloc(1);
            const content = blobToNodeBuffer(item);
            const contentLength = NodeBuffer.alloc(8);

            type.writeUInt8(DataType.Buffer, 0);
            contentLength.writeDoubleBE(content.length, 0);

            bufferItems.push(type, contentLength, content);
            break;
        }
        case '[object DataView]': {
            item = item.buffer;
        }
        case '[object ArrayBuffer]':
        case '[object Int8Array]':
        case '[object Int16Array]':
        case '[object Int32Array]':
        case '[object Uint8Array]':
        case '[object Uint8ClampedArray]':
        case '[object Uint16Array]':
        case '[object Uint32Array]':
        case '[object Float32Array]':
        case '[object Float64Array]': {
            const type = NodeBuffer.alloc(1);
            const content = typedArrayToNodeBuffer(item);
            const contentLength = NodeBuffer.alloc(8);

            type.writeUInt8(DataType.Buffer, 0);
            contentLength.writeDoubleBE(content.length, 0);

            bufferItems.push(type, contentLength, content);
            break;
        }
        default: {
            const type = NodeBuffer.alloc(1);
            type.writeUInt8(DataType.unknow, 0);

            bufferItems.push(type);
            break;
        }
    }

    return NodeBuffer.concat(bufferItems);
}

/**
 * 对数据进行反序列化。   
 * 注意：传入的Buffer需是使用是object2buffer序列化产生的
 */
export function deserialize(data: Buffer): dataType[] {
    let previous = 0;

    if (!data.slice(0, previous += _serializeMark.length).equals(_serializeMark))
        throw new Error('传入的Buffer并不是由object2buffer序列化产生的，无法进行反序列化');

    const result = [];

    while (previous < data.length) {
        const type = data.readUInt8(previous++);

        switch (type) {
            case DataType.number: {
                result.push(data.readDoubleBE(previous));
                previous += 8;
                break;
            }
            case DataType.string: {
                const length = data.readDoubleBE(previous);
                previous += 8;

                const content = data.slice(previous, previous += length);
                result.push(content.toString());
                break;
            }
            case DataType.boolean: {
                const content = data.readUInt8(previous++);
                result.push(content === 1);
                break;
            }
            case DataType.null: {
                result.push(null);
                break;
            }
            case DataType.undefined: {
                result.push(undefined);
                break;
            }
            case DataType.Date: {
                const time = data.readDoubleBE(previous);
                previous += 8;

                result.push(new Date(time));
                break;
            }
            case DataType.RegExp: {
                const sourceContentLength = data.readDoubleBE(previous);
                previous += 8;
                const sourceContent = data.slice(previous, previous += sourceContentLength);
                const flagsContentLength = data.readDoubleBE(previous);
                previous += 8;
                const flagsContent = data.slice(previous, previous += flagsContentLength);

                result.push(new RegExp(sourceContent.toString(), flagsContent.toString()));
                break;
            }
            case DataType.Array: {
                const length = data.readDoubleBE(previous);
                previous += 8;

                const content = data.slice(previous, previous += length);
                result.push(deserialize(content));
                break;
            }
            case DataType.Object: {
                const length = data.readDoubleBE(previous);
                previous += 8;

                const content = data.slice(previous, previous += length);
                const [keys, values] = deserialize(content) as any;

                const obj: any = {};
                for (var i = 0; i < keys.length; i++) {
                    obj[keys[i]] = values[i];
                }

                result.push(obj);
                break;
            }
            case DataType.Buffer: {
                const length = data.readDoubleBE(previous);
                previous += 8;

                result.push(data.slice(previous, previous += length));
                break;
            }
            case DataType.unknow: {
                result.push(undefined);
                break;
            }
            default: {
                throw new Error('要被反序列化的数据类型不存在，类型为: ' + type);
            }
        }
    }

    return result;
}