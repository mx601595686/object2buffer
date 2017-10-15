# object2buffer
序列化对象到Buffer,支持浏览器。

## 可以序列化的类型包括
* [object Number]
* [object String]
* [object Boolean]
* [object Null]
* [object Undefined]
* [object Date]
* [object RegExp]
* [object Array]
* [object Object]
* node Buffer

下面这些类型也可以被序列化，不过它们都将自动被转换成node Buffer
* [object DataView]
* [object ArrayBuffer]
* [object Int8Array]
* [object Int16Array]
* [object Int32Array]
* [object Uint8Array]
* [object Uint8ClampedArray]
* [object Uint16Array]
* [object Uint32Array]
* [object Float32Array]
* [object Float64Array] 

## [API](./bin/index.d.ts)