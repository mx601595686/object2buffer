import expect = require('expect.js');
import * as o2b from '../';

let serialized: Buffer;

it('测试序列化', function () {
    const dataView = new DataView(new ArrayBuffer(8));
    dataView.setFloat64(0, 123456);
    const testData = [
        1, 0.123,
        'test',
        true, false,
        null,
        undefined,
        new Date(1234),
        /abc/g,
        o2b.NodeBuffer.from('buffer'),
        dataView,
        new ArrayBuffer(10),
        (new Uint32Array(10)).fill(1),
        function () { } as any,
        [
            1, 0.123,
            'test',
            true, false,
            null,
            undefined,
            new Date(1234),
            /abc/g,
            o2b.NodeBuffer.from('buffer'),
            dataView,
            new ArrayBuffer(10),
            (new Uint32Array(10)).fill(1),
            function () { } as any
        ],
        {
            a: 1,
            b: 0.123,
            c: 'test',
            d: true,
            e: false,
            f: null,
            g: undefined,
            h: new Date(1234),
            i: /abc/g,
            j: o2b.NodeBuffer.from('buffer'),
            k: dataView,
            l: new ArrayBuffer(10),
            m: (new Uint32Array(10)).fill(1),
            n: function () { } as any
        }
    ];

    // 注意测试一下typescript类型检查
    serialized = o2b.serialize(testData);
});

it('测试反序列化', function () {
    const testData: any = o2b.deserialize(serialized);

    const dataView = o2b.NodeBuffer.alloc(8);
    dataView.writeDoubleBE(123456, 0);

    expect(testData[0]).to.be(1);
    expect(testData[1]).to.be(0.123);
    expect(testData[2]).to.be('test');
    expect(testData[3]).to.be(true);
    expect(testData[4]).to.be(false);
    expect(testData[5]).to.be(null);
    expect(testData[6]).to.be(undefined);
    expect(testData[7].getTime()).to.be(1234);
    expect(testData[8].toString()).to.be('/abc/g');
    expect(o2b.NodeBuffer.from('buffer').equals(testData[9])).to.be.ok();
    expect(dataView.equals(testData[10])).to.be.ok();
    expect(o2b.NodeBuffer.alloc(10).equals(testData[11])).to.be.ok();
    expect(o2b.NodeBuffer.from((new Uint32Array(10)).fill(1).buffer).equals(testData[12])).to.be.ok();
    expect(testData[13]).to.be(undefined);

    expect(testData[14][0]).to.be(1);
    expect(testData[14][1]).to.be(0.123);
    expect(testData[14][2]).to.be('test');
    expect(testData[14][3]).to.be(true);
    expect(testData[14][4]).to.be(false);
    expect(testData[14][5]).to.be(null);
    expect(testData[14][6]).to.be(undefined);
    expect(testData[14][7].getTime()).to.be(1234);
    expect(testData[14][8].toString()).to.be('/abc/g');
    expect(o2b.NodeBuffer.from('buffer').equals(testData[14][9])).to.be.ok();
    expect(dataView.equals(testData[14][10])).to.be.ok();
    expect(o2b.NodeBuffer.alloc(10).equals(testData[14][11])).to.be.ok();
    expect(o2b.NodeBuffer.from((new Uint32Array(10)).fill(1).buffer).equals(testData[14][12])).to.be.ok();
    expect(testData[14][13]).to.be(undefined);

    expect(testData[15]['a']).to.be(1);
    expect(testData[15]['b']).to.be(0.123);
    expect(testData[15]['c']).to.be('test');
    expect(testData[15]['d']).to.be(true);
    expect(testData[15]['e']).to.be(false);
    expect(testData[15]['f']).to.be(null);
    expect(testData[15]['g']).to.be(undefined);
    expect(testData[15]['h'].getTime()).to.be(1234);
    expect(testData[15]['i'].toString()).to.be('/abc/g');
    expect(o2b.NodeBuffer.from('buffer').equals(testData[15]['j'])).to.be.ok();
    expect(dataView.equals(testData[15]['k'])).to.be.ok();
    expect(o2b.NodeBuffer.alloc(10).equals(testData[15]['l'])).to.be.ok();
    expect(o2b.NodeBuffer.from((new Uint32Array(10)).fill(1).buffer).equals(testData[15]['m'])).to.be.ok();
    expect(testData[15]['n']).to.be(undefined);
});

it('测试序列化，不是由o2b生成的buffer', function () {
    expect(o2b.deserialize).withArgs(o2b.NodeBuffer.alloc(123)).to.throwException();
});

describe('序列化、反序列化速度以及文件大小对比', function () {

    let data = [
        1, 0.123,
        'test',
        true, false,
        null,
        [
            1, 0.123,
            'test',
            true, false,
            null,
        ],
        {
            a: 1,
            b: 0.123,
            c: 'test',
            d: true,
            e: false,
            f: null,
        }
    ];

    it('o2b', function () {
        console.time('o2b time');

        const result = o2b.serialize(data);
        console.log('o2b size:', result.length);
        expect(o2b.deserialize(result)).to.eql(data);

        console.timeEnd('o2b time');
    });

    it('JSON.stringify', function () {
        console.time('JSON.stringify time');

        const result = JSON.stringify(data);
        console.log('JSON.stringify size:', Buffer.from(result).length);
        expect(JSON.parse(result)).to.eql(data);

        console.timeEnd('JSON.stringify time');
    });
});