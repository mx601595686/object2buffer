"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const blobToNodeBuffer = require('blob-to-buffer');
const typedArrayToNodeBuffer = require("typedarray-to-buffer");
const isNode = require('is-node');
exports.isNodeBuffer = require('is-buffer');
exports.nodeBufferToArraybuffer = require('to-arraybuffer');
exports.NodeBuffer = isNode ? Buffer : require('buffer/').Buffer;
/**
 * 序列化标记，标记一个Buffer是object2buffer序列化的结果
 */
exports._serializeMark = exports.NodeBuffer.from('+o2b`');
/**
 * 对数据进行序列化。
 * 二进制数据格式： 元素类型 -> [元素长度] -> 元素内容
 */
function serialize(data) {
    const bufferItems = [exports._serializeMark];
    for (let item of data)
        switch (Object.prototype.toString.call(item)) {
            case '[object Number]': {
                const type = exports.NodeBuffer.alloc(1);
                const content = exports.NodeBuffer.alloc(8);
                type.writeUInt8(0 /* number */, 0);
                content.writeDoubleBE(item, 0);
                bufferItems.push(type, content);
                break;
            }
            case '[object String]': {
                const type = exports.NodeBuffer.alloc(1);
                const content = exports.NodeBuffer.from(item);
                const contentLength = exports.NodeBuffer.alloc(8);
                type.writeUInt8(1 /* string */, 0);
                contentLength.writeDoubleBE(content.length, 0);
                bufferItems.push(type, contentLength, content);
                break;
            }
            case '[object Boolean]': {
                const type = exports.NodeBuffer.alloc(1);
                const content = exports.NodeBuffer.alloc(1);
                type.writeUInt8(2 /* boolean */, 0);
                content.writeUInt8(item ? 1 : 0, 0);
                bufferItems.push(type, content);
                break;
            }
            case '[object Null]': {
                const type = exports.NodeBuffer.alloc(1);
                type.writeUInt8(3 /* null */, 0);
                bufferItems.push(type);
                break;
            }
            case '[object Undefined]': {
                const type = exports.NodeBuffer.alloc(1);
                type.writeUInt8(4 /* undefined */, 0);
                bufferItems.push(type);
                break;
            }
            case '[object Date]': {
                const type = exports.NodeBuffer.alloc(1);
                const content = exports.NodeBuffer.alloc(8);
                type.writeUInt8(5 /* Date */, 0);
                content.writeDoubleBE(item.getTime(), 0);
                bufferItems.push(type, content);
                break;
            }
            case '[object RegExp]': {
                const type = exports.NodeBuffer.alloc(1);
                const source = item.source; //正则匹配模式 
                const flags = item.flags;
                const sourceContent = exports.NodeBuffer.from(source);
                const sourceContentLength = exports.NodeBuffer.alloc(8);
                const flagsContent = exports.NodeBuffer.from(flags);
                const flagsContentLength = exports.NodeBuffer.alloc(8);
                type.writeUInt8(6 /* RegExp */, 0);
                sourceContentLength.writeDoubleBE(sourceContent.length, 0);
                flagsContentLength.writeDoubleBE(flagsContent.length, 0);
                bufferItems.push(type, sourceContentLength, sourceContent, flagsContentLength, flagsContent);
                break;
            }
            case '[object Array]': {
                const type = exports.NodeBuffer.alloc(1);
                const content = serialize(item);
                const contentLength = exports.NodeBuffer.alloc(8);
                type.writeUInt8(7 /* Array */, 0);
                contentLength.writeDoubleBE(content.length, 0);
                bufferItems.push(type, contentLength, content);
                break;
            }
            case '[object Object]': {
                const keys = Object.keys(item);
                const values = keys.map(key => item[key]);
                const type = exports.NodeBuffer.alloc(1);
                const content = serialize([keys, values]);
                const contentLength = exports.NodeBuffer.alloc(8);
                type.writeUInt8(8 /* Object */, 0);
                contentLength.writeDoubleBE(content.length, 0);
                bufferItems.push(type, contentLength, content);
                break;
            }
            case exports.isNodeBuffer(item): {
                const type = exports.NodeBuffer.alloc(1);
                const content = item;
                const contentLength = exports.NodeBuffer.alloc(8);
                type.writeUInt8(9 /* Buffer */, 0);
                contentLength.writeDoubleBE(content.length, 0);
                bufferItems.push(type, contentLength, content);
                break;
            }
            case '[object Blob]': {
                const type = exports.NodeBuffer.alloc(1);
                const content = blobToNodeBuffer(item);
                const contentLength = exports.NodeBuffer.alloc(8);
                type.writeUInt8(9 /* Buffer */, 0);
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
                const type = exports.NodeBuffer.alloc(1);
                const content = typedArrayToNodeBuffer(item);
                const contentLength = exports.NodeBuffer.alloc(8);
                type.writeUInt8(9 /* Buffer */, 0);
                contentLength.writeDoubleBE(content.length, 0);
                bufferItems.push(type, contentLength, content);
                break;
            }
            default: {
                const type = exports.NodeBuffer.alloc(1);
                type.writeUInt8(10 /* unknow */, 0);
                bufferItems.push(type);
                break;
            }
        }
    return exports.NodeBuffer.concat(bufferItems);
}
exports.serialize = serialize;
/**
 * 对数据进行反序列化。
 * 注意：传入的Buffer需是使用是object2buffer序列化产生的
 */
function deserialize(data) {
    let previous = 0;
    if (!data.slice(0, previous += exports._serializeMark.length).equals(exports._serializeMark))
        throw new Error('传入的Buffer并不是由object2buffer序列化产生的，无法进行反序列化');
    const result = [];
    while (previous < data.length) {
        const type = data.readUInt8(previous++);
        switch (type) {
            case 0 /* number */: {
                result.push(data.readDoubleBE(previous));
                previous += 8;
                break;
            }
            case 1 /* string */: {
                const length = data.readDoubleBE(previous);
                previous += 8;
                const content = data.slice(previous, previous += length);
                result.push(content.toString());
                break;
            }
            case 2 /* boolean */: {
                const content = data.readUInt8(previous++);
                result.push(content === 1);
                break;
            }
            case 3 /* null */: {
                result.push(null);
                break;
            }
            case 4 /* undefined */: {
                result.push(undefined);
                break;
            }
            case 5 /* Date */: {
                const time = data.readDoubleBE(previous);
                previous += 8;
                result.push(new Date(time));
                break;
            }
            case 6 /* RegExp */: {
                const sourceContentLength = data.readDoubleBE(previous);
                previous += 8;
                const sourceContent = data.slice(previous, previous += sourceContentLength);
                const flagsContentLength = data.readDoubleBE(previous);
                previous += 8;
                const flagsContent = data.slice(previous, previous += flagsContentLength);
                result.push(new RegExp(sourceContent.toString(), flagsContent.toString()));
                break;
            }
            case 7 /* Array */: {
                const length = data.readDoubleBE(previous);
                previous += 8;
                const content = data.slice(previous, previous += length);
                result.push(deserialize(content));
                break;
            }
            case 8 /* Object */: {
                const length = data.readDoubleBE(previous);
                previous += 8;
                const content = data.slice(previous, previous += length);
                const [keys, values] = deserialize(content);
                const obj = {};
                for (var i = 0; i < keys.length; i++) {
                    obj[keys[i]] = values[i];
                }
                result.push(obj);
                break;
            }
            case 9 /* Buffer */: {
                const length = data.readDoubleBE(previous);
                previous += 8;
                result.push(data.slice(previous, previous += length));
                break;
            }
            case 10 /* unknow */: {
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
exports.deserialize = deserialize;

//# sourceMappingURL=data:application/json;charset=utf8;base64,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TyxDQUFRLENBQUM7Z0JBRW5ELE1BQU0sR0FBRyxHQUFRLEVBQUUsQ0FBQztnQkFDcEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7b0JBQ25DLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzdCLENBQUM7Z0JBRUQsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDakIsS0FBSyxDQUFDO1lBQ1YsQ0FBQztZQUNELHFCQUFzQixDQUFDO2dCQUNuQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUMzQyxRQUFRLElBQUksQ0FBQyxDQUFDO2dCQUVkLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsUUFBUSxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUM7Z0JBQ3RELEtBQUssQ0FBQztZQUNWLENBQUM7WUFDRCxzQkFBc0IsQ0FBQztnQkFDbkIsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDdkIsS0FBSyxDQUFDO1lBQ1YsQ0FBQztZQUNELFNBQVMsQ0FBQztnQkFDTixNQUFNLElBQUksS0FBSyxDQUFDLHNCQUFzQixHQUFHLElBQUksQ0FBQyxDQUFDO1lBQ25ELENBQUM7UUFDTCxDQUFDO0lBQ0wsQ0FBQztJQUVELE1BQU0sQ0FBQyxNQUFNLENBQUM7QUFDbEIsQ0FBQztBQWpHRCxrQ0FpR0MiLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBkYXRhVHlwZSwgRGF0YVR5cGUgfSBmcm9tICcuL0RhdGFUeXBlJztcclxuY29uc3QgYmxvYlRvTm9kZUJ1ZmZlciA9IHJlcXVpcmUoJ2Jsb2ItdG8tYnVmZmVyJyk7XHJcbmNvbnN0IHR5cGVkQXJyYXlUb05vZGVCdWZmZXIgPSByZXF1aXJlKFwidHlwZWRhcnJheS10by1idWZmZXJcIik7XHJcbmNvbnN0IGlzTm9kZSA9IHJlcXVpcmUoJ2lzLW5vZGUnKTtcclxuXHJcbmV4cG9ydCBjb25zdCBpc05vZGVCdWZmZXI6IChkYXRhOiBCdWZmZXIpID0+IGJvb2xlYW4gPSByZXF1aXJlKCdpcy1idWZmZXInKTtcclxuZXhwb3J0IGNvbnN0IG5vZGVCdWZmZXJUb0FycmF5YnVmZmVyOiAoZGF0YTogQnVmZmVyKSA9PiBBcnJheUJ1ZmZlciA9IHJlcXVpcmUoJ3RvLWFycmF5YnVmZmVyJyk7XHJcbmV4cG9ydCBjb25zdCBOb2RlQnVmZmVyOiB0eXBlb2YgQnVmZmVyID0gaXNOb2RlID8gQnVmZmVyIDogcmVxdWlyZSgnYnVmZmVyLycpLkJ1ZmZlcjtcclxuXHJcbi8qKlxyXG4gKiDluo/liJfljJbmoIforrDvvIzmoIforrDkuIDkuKpCdWZmZXLmmK9vYmplY3QyYnVmZmVy5bqP5YiX5YyW55qE57uT5p6cXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgX3NlcmlhbGl6ZU1hcmsgPSBOb2RlQnVmZmVyLmZyb20oJytvMmJgJyk7XHJcblxyXG4vKipcclxuICog5a+55pWw5o2u6L+b6KGM5bqP5YiX5YyW44CCXHJcbiAqIOS6jOi/m+WItuaVsOaNruagvOW8j++8miDlhYPntKDnsbvlnosgLT4gW+WFg+e0oOmVv+W6pl0gLT4g5YWD57Sg5YaF5a65ICAgXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplKGRhdGE6IGRhdGFUeXBlW10pOiBCdWZmZXIge1xyXG4gICAgY29uc3QgYnVmZmVySXRlbXM6IEJ1ZmZlcltdID0gW19zZXJpYWxpemVNYXJrXTtcclxuXHJcbiAgICBmb3IgKGxldCBpdGVtIG9mIDxhbnk+ZGF0YSkgc3dpdGNoIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoaXRlbSkpIHtcclxuICAgICAgICBjYXNlICdbb2JqZWN0IE51bWJlcl0nOiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSBOb2RlQnVmZmVyLmFsbG9jKDEpO1xyXG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gTm9kZUJ1ZmZlci5hbGxvYyg4KTtcclxuXHJcbiAgICAgICAgICAgIHR5cGUud3JpdGVVSW50OChEYXRhVHlwZS5udW1iZXIsIDApO1xyXG4gICAgICAgICAgICBjb250ZW50LndyaXRlRG91YmxlQkUoaXRlbSwgMCk7XHJcblxyXG4gICAgICAgICAgICBidWZmZXJJdGVtcy5wdXNoKHR5cGUsIGNvbnRlbnQpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgY2FzZSAnW29iamVjdCBTdHJpbmddJzoge1xyXG4gICAgICAgICAgICBjb25zdCB0eXBlID0gTm9kZUJ1ZmZlci5hbGxvYygxKTtcclxuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IE5vZGVCdWZmZXIuZnJvbShpdGVtKTtcclxuICAgICAgICAgICAgY29uc3QgY29udGVudExlbmd0aCA9IE5vZGVCdWZmZXIuYWxsb2MoOCk7XHJcblxyXG4gICAgICAgICAgICB0eXBlLndyaXRlVUludDgoRGF0YVR5cGUuc3RyaW5nLCAwKTtcclxuICAgICAgICAgICAgY29udGVudExlbmd0aC53cml0ZURvdWJsZUJFKGNvbnRlbnQubGVuZ3RoLCAwKTtcclxuXHJcbiAgICAgICAgICAgIGJ1ZmZlckl0ZW1zLnB1c2godHlwZSwgY29udGVudExlbmd0aCwgY29udGVudCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXNlICdbb2JqZWN0IEJvb2xlYW5dJzoge1xyXG4gICAgICAgICAgICBjb25zdCB0eXBlID0gTm9kZUJ1ZmZlci5hbGxvYygxKTtcclxuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IE5vZGVCdWZmZXIuYWxsb2MoMSk7XHJcblxyXG4gICAgICAgICAgICB0eXBlLndyaXRlVUludDgoRGF0YVR5cGUuYm9vbGVhbiwgMCk7XHJcbiAgICAgICAgICAgIGNvbnRlbnQud3JpdGVVSW50OChpdGVtID8gMSA6IDAsIDApO1xyXG5cclxuICAgICAgICAgICAgYnVmZmVySXRlbXMucHVzaCh0eXBlLCBjb250ZW50KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhc2UgJ1tvYmplY3QgTnVsbF0nOiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSBOb2RlQnVmZmVyLmFsbG9jKDEpO1xyXG4gICAgICAgICAgICB0eXBlLndyaXRlVUludDgoRGF0YVR5cGUubnVsbCwgMCk7XHJcblxyXG4gICAgICAgICAgICBidWZmZXJJdGVtcy5wdXNoKHR5cGUpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgY2FzZSAnW29iamVjdCBVbmRlZmluZWRdJzoge1xyXG4gICAgICAgICAgICBjb25zdCB0eXBlID0gTm9kZUJ1ZmZlci5hbGxvYygxKTtcclxuICAgICAgICAgICAgdHlwZS53cml0ZVVJbnQ4KERhdGFUeXBlLnVuZGVmaW5lZCwgMCk7XHJcblxyXG4gICAgICAgICAgICBidWZmZXJJdGVtcy5wdXNoKHR5cGUpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgY2FzZSAnW29iamVjdCBEYXRlXSc6IHtcclxuICAgICAgICAgICAgY29uc3QgdHlwZSA9IE5vZGVCdWZmZXIuYWxsb2MoMSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBOb2RlQnVmZmVyLmFsbG9jKDgpO1xyXG5cclxuICAgICAgICAgICAgdHlwZS53cml0ZVVJbnQ4KERhdGFUeXBlLkRhdGUsIDApO1xyXG4gICAgICAgICAgICBjb250ZW50LndyaXRlRG91YmxlQkUoaXRlbS5nZXRUaW1lKCksIDApO1xyXG5cclxuICAgICAgICAgICAgYnVmZmVySXRlbXMucHVzaCh0eXBlLCBjb250ZW50KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhc2UgJ1tvYmplY3QgUmVnRXhwXSc6IHtcclxuICAgICAgICAgICAgY29uc3QgdHlwZSA9IE5vZGVCdWZmZXIuYWxsb2MoMSk7XHJcblxyXG4gICAgICAgICAgICBjb25zdCBzb3VyY2UgPSBpdGVtLnNvdXJjZTsgLy/mraPliJnljLnphY3mqKHlvI8gXHJcbiAgICAgICAgICAgIGNvbnN0IGZsYWdzID0gaXRlbS5mbGFncztcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHNvdXJjZUNvbnRlbnQgPSBOb2RlQnVmZmVyLmZyb20oc291cmNlKTtcclxuICAgICAgICAgICAgY29uc3Qgc291cmNlQ29udGVudExlbmd0aCA9IE5vZGVCdWZmZXIuYWxsb2MoOCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGZsYWdzQ29udGVudCA9IE5vZGVCdWZmZXIuZnJvbShmbGFncyk7XHJcbiAgICAgICAgICAgIGNvbnN0IGZsYWdzQ29udGVudExlbmd0aCA9IE5vZGVCdWZmZXIuYWxsb2MoOCk7XHJcblxyXG4gICAgICAgICAgICB0eXBlLndyaXRlVUludDgoRGF0YVR5cGUuUmVnRXhwLCAwKTtcclxuICAgICAgICAgICAgc291cmNlQ29udGVudExlbmd0aC53cml0ZURvdWJsZUJFKHNvdXJjZUNvbnRlbnQubGVuZ3RoLCAwKTtcclxuICAgICAgICAgICAgZmxhZ3NDb250ZW50TGVuZ3RoLndyaXRlRG91YmxlQkUoZmxhZ3NDb250ZW50Lmxlbmd0aCwgMCk7XHJcblxyXG4gICAgICAgICAgICBidWZmZXJJdGVtcy5wdXNoKHR5cGUsIHNvdXJjZUNvbnRlbnRMZW5ndGgsIHNvdXJjZUNvbnRlbnQsIGZsYWdzQ29udGVudExlbmd0aCwgZmxhZ3NDb250ZW50KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhc2UgJ1tvYmplY3QgQXJyYXldJzoge1xyXG4gICAgICAgICAgICBjb25zdCB0eXBlID0gTm9kZUJ1ZmZlci5hbGxvYygxKTtcclxuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IHNlcmlhbGl6ZShpdGVtKTtcclxuICAgICAgICAgICAgY29uc3QgY29udGVudExlbmd0aCA9IE5vZGVCdWZmZXIuYWxsb2MoOCk7XHJcblxyXG4gICAgICAgICAgICB0eXBlLndyaXRlVUludDgoRGF0YVR5cGUuQXJyYXksIDApO1xyXG4gICAgICAgICAgICBjb250ZW50TGVuZ3RoLndyaXRlRG91YmxlQkUoY29udGVudC5sZW5ndGgsIDApO1xyXG5cclxuICAgICAgICAgICAgYnVmZmVySXRlbXMucHVzaCh0eXBlLCBjb250ZW50TGVuZ3RoLCBjb250ZW50KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhc2UgJ1tvYmplY3QgT2JqZWN0XSc6IHtcclxuICAgICAgICAgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKGl0ZW0pO1xyXG4gICAgICAgICAgICBjb25zdCB2YWx1ZXMgPSBrZXlzLm1hcChrZXkgPT4gaXRlbVtrZXldKTtcclxuXHJcbiAgICAgICAgICAgIGNvbnN0IHR5cGUgPSBOb2RlQnVmZmVyLmFsbG9jKDEpO1xyXG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gc2VyaWFsaXplKFtrZXlzLCB2YWx1ZXNdKTtcclxuICAgICAgICAgICAgY29uc3QgY29udGVudExlbmd0aCA9IE5vZGVCdWZmZXIuYWxsb2MoOCk7XHJcblxyXG4gICAgICAgICAgICB0eXBlLndyaXRlVUludDgoRGF0YVR5cGUuT2JqZWN0LCAwKTtcclxuICAgICAgICAgICAgY29udGVudExlbmd0aC53cml0ZURvdWJsZUJFKGNvbnRlbnQubGVuZ3RoLCAwKTtcclxuXHJcbiAgICAgICAgICAgIGJ1ZmZlckl0ZW1zLnB1c2godHlwZSwgY29udGVudExlbmd0aCwgY29udGVudCk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXNlIGlzTm9kZUJ1ZmZlcihpdGVtKToge1xyXG4gICAgICAgICAgICBjb25zdCB0eXBlID0gTm9kZUJ1ZmZlci5hbGxvYygxKTtcclxuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGl0ZW07XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnRMZW5ndGggPSBOb2RlQnVmZmVyLmFsbG9jKDgpO1xyXG5cclxuICAgICAgICAgICAgdHlwZS53cml0ZVVJbnQ4KERhdGFUeXBlLkJ1ZmZlciwgMCk7XHJcbiAgICAgICAgICAgIGNvbnRlbnRMZW5ndGgud3JpdGVEb3VibGVCRShjb250ZW50Lmxlbmd0aCwgMCk7XHJcblxyXG4gICAgICAgICAgICBidWZmZXJJdGVtcy5wdXNoKHR5cGUsIGNvbnRlbnRMZW5ndGgsIGNvbnRlbnQpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgY2FzZSAnW29iamVjdCBCbG9iXSc6IHtcclxuICAgICAgICAgICAgY29uc3QgdHlwZSA9IE5vZGVCdWZmZXIuYWxsb2MoMSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBibG9iVG9Ob2RlQnVmZmVyKGl0ZW0pO1xyXG4gICAgICAgICAgICBjb25zdCBjb250ZW50TGVuZ3RoID0gTm9kZUJ1ZmZlci5hbGxvYyg4KTtcclxuXHJcbiAgICAgICAgICAgIHR5cGUud3JpdGVVSW50OChEYXRhVHlwZS5CdWZmZXIsIDApO1xyXG4gICAgICAgICAgICBjb250ZW50TGVuZ3RoLndyaXRlRG91YmxlQkUoY29udGVudC5sZW5ndGgsIDApO1xyXG5cclxuICAgICAgICAgICAgYnVmZmVySXRlbXMucHVzaCh0eXBlLCBjb250ZW50TGVuZ3RoLCBjb250ZW50KTtcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhc2UgJ1tvYmplY3QgRGF0YVZpZXddJzoge1xyXG4gICAgICAgICAgICBpdGVtID0gaXRlbS5idWZmZXI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhc2UgJ1tvYmplY3QgQXJyYXlCdWZmZXJdJzpcclxuICAgICAgICBjYXNlICdbb2JqZWN0IEludDhBcnJheV0nOlxyXG4gICAgICAgIGNhc2UgJ1tvYmplY3QgSW50MTZBcnJheV0nOlxyXG4gICAgICAgIGNhc2UgJ1tvYmplY3QgSW50MzJBcnJheV0nOlxyXG4gICAgICAgIGNhc2UgJ1tvYmplY3QgVWludDhBcnJheV0nOlxyXG4gICAgICAgIGNhc2UgJ1tvYmplY3QgVWludDhDbGFtcGVkQXJyYXldJzpcclxuICAgICAgICBjYXNlICdbb2JqZWN0IFVpbnQxNkFycmF5XSc6XHJcbiAgICAgICAgY2FzZSAnW29iamVjdCBVaW50MzJBcnJheV0nOlxyXG4gICAgICAgIGNhc2UgJ1tvYmplY3QgRmxvYXQzMkFycmF5XSc6XHJcbiAgICAgICAgY2FzZSAnW29iamVjdCBGbG9hdDY0QXJyYXldJzoge1xyXG4gICAgICAgICAgICBjb25zdCB0eXBlID0gTm9kZUJ1ZmZlci5hbGxvYygxKTtcclxuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IHR5cGVkQXJyYXlUb05vZGVCdWZmZXIoaXRlbSk7XHJcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnRMZW5ndGggPSBOb2RlQnVmZmVyLmFsbG9jKDgpO1xyXG5cclxuICAgICAgICAgICAgdHlwZS53cml0ZVVJbnQ4KERhdGFUeXBlLkJ1ZmZlciwgMCk7XHJcbiAgICAgICAgICAgIGNvbnRlbnRMZW5ndGgud3JpdGVEb3VibGVCRShjb250ZW50Lmxlbmd0aCwgMCk7XHJcblxyXG4gICAgICAgICAgICBidWZmZXJJdGVtcy5wdXNoKHR5cGUsIGNvbnRlbnRMZW5ndGgsIGNvbnRlbnQpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgZGVmYXVsdDoge1xyXG4gICAgICAgICAgICBjb25zdCB0eXBlID0gTm9kZUJ1ZmZlci5hbGxvYygxKTtcclxuICAgICAgICAgICAgdHlwZS53cml0ZVVJbnQ4KERhdGFUeXBlLnVua25vdywgMCk7XHJcblxyXG4gICAgICAgICAgICBidWZmZXJJdGVtcy5wdXNoKHR5cGUpO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIE5vZGVCdWZmZXIuY29uY2F0KGJ1ZmZlckl0ZW1zKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIOWvueaVsOaNrui/m+ihjOWPjeW6j+WIl+WMluOAgiAgIFxyXG4gKiDms6jmhI/vvJrkvKDlhaXnmoRCdWZmZXLpnIDmmK/kvb/nlKjmmK9vYmplY3QyYnVmZmVy5bqP5YiX5YyW5Lqn55Sf55qEXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZGVzZXJpYWxpemUoZGF0YTogQnVmZmVyKTogZGF0YVR5cGVbXSB7XHJcbiAgICBsZXQgcHJldmlvdXMgPSAwO1xyXG5cclxuICAgIGlmICghZGF0YS5zbGljZSgwLCBwcmV2aW91cyArPSBfc2VyaWFsaXplTWFyay5sZW5ndGgpLmVxdWFscyhfc2VyaWFsaXplTWFyaykpXHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCfkvKDlhaXnmoRCdWZmZXLlubbkuI3mmK/nlLFvYmplY3QyYnVmZmVy5bqP5YiX5YyW5Lqn55Sf55qE77yM5peg5rOV6L+b6KGM5Y+N5bqP5YiX5YyWJyk7XHJcblxyXG4gICAgY29uc3QgcmVzdWx0ID0gW107XHJcblxyXG4gICAgd2hpbGUgKHByZXZpb3VzIDwgZGF0YS5sZW5ndGgpIHtcclxuICAgICAgICBjb25zdCB0eXBlID0gZGF0YS5yZWFkVUludDgocHJldmlvdXMrKyk7XHJcblxyXG4gICAgICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgICAgICBjYXNlIERhdGFUeXBlLm51bWJlcjoge1xyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goZGF0YS5yZWFkRG91YmxlQkUocHJldmlvdXMpKTtcclxuICAgICAgICAgICAgICAgIHByZXZpb3VzICs9IDg7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIERhdGFUeXBlLnN0cmluZzoge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbGVuZ3RoID0gZGF0YS5yZWFkRG91YmxlQkUocHJldmlvdXMpO1xyXG4gICAgICAgICAgICAgICAgcHJldmlvdXMgKz0gODtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50ID0gZGF0YS5zbGljZShwcmV2aW91cywgcHJldmlvdXMgKz0gbGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNvbnRlbnQudG9TdHJpbmcoKSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIERhdGFUeXBlLmJvb2xlYW46IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBkYXRhLnJlYWRVSW50OChwcmV2aW91cysrKTtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGNvbnRlbnQgPT09IDEpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBEYXRhVHlwZS5udWxsOiB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChudWxsKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgRGF0YVR5cGUudW5kZWZpbmVkOiB7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh1bmRlZmluZWQpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBEYXRhVHlwZS5EYXRlOiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB0aW1lID0gZGF0YS5yZWFkRG91YmxlQkUocHJldmlvdXMpO1xyXG4gICAgICAgICAgICAgICAgcHJldmlvdXMgKz0gODtcclxuXHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChuZXcgRGF0ZSh0aW1lKSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIERhdGFUeXBlLlJlZ0V4cDoge1xyXG4gICAgICAgICAgICAgICAgY29uc3Qgc291cmNlQ29udGVudExlbmd0aCA9IGRhdGEucmVhZERvdWJsZUJFKHByZXZpb3VzKTtcclxuICAgICAgICAgICAgICAgIHByZXZpb3VzICs9IDg7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBzb3VyY2VDb250ZW50ID0gZGF0YS5zbGljZShwcmV2aW91cywgcHJldmlvdXMgKz0gc291cmNlQ29udGVudExlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBmbGFnc0NvbnRlbnRMZW5ndGggPSBkYXRhLnJlYWREb3VibGVCRShwcmV2aW91cyk7XHJcbiAgICAgICAgICAgICAgICBwcmV2aW91cyArPSA4O1xyXG4gICAgICAgICAgICAgICAgY29uc3QgZmxhZ3NDb250ZW50ID0gZGF0YS5zbGljZShwcmV2aW91cywgcHJldmlvdXMgKz0gZmxhZ3NDb250ZW50TGVuZ3RoKTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChuZXcgUmVnRXhwKHNvdXJjZUNvbnRlbnQudG9TdHJpbmcoKSwgZmxhZ3NDb250ZW50LnRvU3RyaW5nKCkpKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgRGF0YVR5cGUuQXJyYXk6IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGxlbmd0aCA9IGRhdGEucmVhZERvdWJsZUJFKHByZXZpb3VzKTtcclxuICAgICAgICAgICAgICAgIHByZXZpb3VzICs9IDg7XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGRhdGEuc2xpY2UocHJldmlvdXMsIHByZXZpb3VzICs9IGxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChkZXNlcmlhbGl6ZShjb250ZW50KSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjYXNlIERhdGFUeXBlLk9iamVjdDoge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbGVuZ3RoID0gZGF0YS5yZWFkRG91YmxlQkUocHJldmlvdXMpO1xyXG4gICAgICAgICAgICAgICAgcHJldmlvdXMgKz0gODtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCBjb250ZW50ID0gZGF0YS5zbGljZShwcmV2aW91cywgcHJldmlvdXMgKz0gbGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IFtrZXlzLCB2YWx1ZXNdID0gZGVzZXJpYWxpemUoY29udGVudCkgYXMgYW55O1xyXG5cclxuICAgICAgICAgICAgICAgIGNvbnN0IG9iajogYW55ID0ge307XHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBvYmpba2V5c1tpXV0gPSB2YWx1ZXNbaV07XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2gob2JqKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgRGF0YVR5cGUuQnVmZmVyOiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBsZW5ndGggPSBkYXRhLnJlYWREb3VibGVCRShwcmV2aW91cyk7XHJcbiAgICAgICAgICAgICAgICBwcmV2aW91cyArPSA4O1xyXG5cclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGRhdGEuc2xpY2UocHJldmlvdXMsIHByZXZpb3VzICs9IGxlbmd0aCkpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSBEYXRhVHlwZS51bmtub3c6IHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHVuZGVmaW5lZCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBkZWZhdWx0OiB7XHJcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ+imgeiiq+WPjeW6j+WIl+WMlueahOaVsOaNruexu+Wei+S4jeWtmOWcqO+8jOexu+Wei+S4ujogJyArIHR5cGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiByZXN1bHQ7XHJcbn0iXX0=
