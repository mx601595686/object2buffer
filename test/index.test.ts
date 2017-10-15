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
        new Blob(['blob']),
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
            new Date,
            /abc/g,
            o2b.NodeBuffer.from('buffer'),
            new Blob(['blob']),
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
            h: new Date,
            i: /abc/g,
            j: o2b.NodeBuffer.from('buffer'),
            k: new Blob(['blob']),
            l: dataView,
            m: new ArrayBuffer(10),
            n: (new Uint32Array(10)).fill(1),
            o: function () { } as any
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
    expect(o2b.NodeBuffer.from('blob').equals(testData[10])).to.be.ok();
    expect(dataView.equals(testData[11])).to.be.ok();
    expect(o2b.NodeBuffer.alloc(10).equals(testData[12])).to.be.ok();
    expect(o2b.NodeBuffer.alloc(10).fill(1).equals(testData[13])).to.be.ok();
    expect(testData[14]).to.be(undefined);

    expect(testData[15][0]).to.be(1);
    expect(testData[15][1]).to.be(0.123);
    expect(testData[15][2]).to.be('test');
    expect(testData[15][3]).to.be(true);
    expect(testData[15][4]).to.be(false);
    expect(testData[15][5]).to.be(null);
    expect(testData[15][6]).to.be(undefined);
    expect(testData[15][7].getTime()).to.be(1234);
    expect(testData[15][8].toString()).to.be('/abc/g');
    expect(o2b.NodeBuffer.from('buffer').equals(testData[15][9])).to.be.ok();
    expect(o2b.NodeBuffer.from('blob').equals(testData[15][10])).to.be.ok();
    expect(dataView.equals(testData[15][11])).to.be.ok();
    expect(o2b.NodeBuffer.alloc(10).equals(testData[15][12])).to.be.ok();
    expect(o2b.NodeBuffer.alloc(10).fill(1).equals(testData[15][13])).to.be.ok();
    expect(testData[15][14]).to.be(undefined);

    expect(testData[16]['a']).to.be(1);
    expect(testData[16]['b']).to.be(0.123);
    expect(testData[16]['c']).to.be('test');
    expect(testData[16]['d']).to.be(true);
    expect(testData[16]['e']).to.be(false);
    expect(testData[16]['f']).to.be(null);
    expect(testData[16]['g']).to.be(undefined);
    expect(testData[16]['h'].getTime()).to.be(1234);
    expect(testData[16]['i'].toString()).to.be('/abc/g');
    expect(o2b.NodeBuffer.from('buffer').equals(testData[16]['j'])).to.be.ok();
    expect(o2b.NodeBuffer.from('blob').equals(testData[16]['k'])).to.be.ok();
    expect(dataView.equals(testData[16]['l'])).to.be.ok();
    expect(o2b.NodeBuffer.alloc(10).equals(testData[16]['m'])).to.be.ok();
    expect(o2b.NodeBuffer.alloc(10).fill(1).equals(testData[16]['n'])).to.be.ok();
    expect(testData[16]['o']).to.be(undefined);
});

it('测试序列化，不是由o2b生成的buffer', function () {
    expect(o2b.deserialize).withArgs(o2b.NodeBuffer.alloc(123)).to.throwException();
});