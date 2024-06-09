import EscPosEncoder from '../src/esc-pos-encoder.js';
import {assert, expect} from 'chai';


describe('EscPosEncoder', function() {
  const encoder = new EscPosEncoder();
  const rasterEncoder = new EscPosEncoder({imageMode: 'raster'});

  describe('text(hello)', function() {
    const result = encoder.text('hello').encode();

    it('should be [ 104, 101, 108, 108, 111 ]', function() {
      assert.deepEqual(new Uint8Array([104, 101, 108, 108, 111]), result);
    });
  });

  describe('text(hello).newline()', function() {
    const result = encoder.text('hello').newline().encode();

    it('should be [ 104, 101, 108, 108, 111, 10, 13 ]', function() {
      assert.deepEqual(new Uint8Array([104, 101, 108, 108, 111, 10, 13]), result);
    });
  });

  describe('line(hello)', function() {
    const result = encoder.line('hello').encode();

    it('should be [ 104, 101, 108, 108, 111, 10, 13 ]', function() {
      assert.deepEqual(new Uint8Array([104, 101, 108, 108, 111, 10, 13]), result);
    });
  });

  describe('text(héllo) - é -> ?', function() {
    const result = encoder.text('héllo').encode();

    it('should be [ 104, 63, 108, 108, 111 ]', function() {
      assert.deepEqual(new Uint8Array([104, 63, 108, 108, 111]), result);
    });
  });

  describe('codepage(cp437).text(héllo) - é -> 130', function() {
    const result = encoder.codepage('cp437').text('héllo').encode();

    it('should be [ 27, 116, 0, 104, 130, 108, 108, 111 ]', function() {
      assert.deepEqual(new Uint8Array([27, 116, 0, 104, 130, 108, 108, 111]), result);
    });
  });

  describe('codepage(windows1252).text(héllo) - é -> 233', function() {
    const result = encoder.codepage('windows1252').text('héllo').encode();

    it('should be [ 27, 116, 16, 104, 233, 108, 108, 111 ]', function() {
      assert.deepEqual(new Uint8Array([27, 116, 16, 104, 233, 108, 108, 111]), result);
    });
  });

  describe('codepage(unknown).text(héllo)', function() {
    it('should throw an "Unknown codepage" error', function() {
      expect(function() {
        const result = encoder.codepage('unknown').text('héllo').encode();
      }).to.throw('Unknown codepage');
    });
  });

  describe('bold(true).text(hello).bold(false)', function() {
    const result = encoder.bold(true).text('hello').bold(false).encode();

    it('should be [ 27, 69, 1, ..., 27, 69, 0 ]', function() {
      assert.deepEqual(new Uint8Array([27, 69, 1, 104, 101, 108, 108, 111, 27, 69, 0]), result);
    });
  });

  describe('bold().text(hello).bold()', function() {
    const result = encoder.bold().text('hello').bold().encode();

    it('should be [ 27, 69, 1, ..., 27, 69, 0 ]', function() {
      assert.deepEqual(new Uint8Array([27, 69, 1, 104, 101, 108, 108, 111, 27, 69, 0]), result);
    });
  });

  describe('italic().text(hello).italic()', function() {
    const result = encoder.italic().text('hello').italic().encode();

    it('should be [ 27, 69, 1, ..., 27, 69, 0 ]', function() {
      assert.deepEqual(new Uint8Array([27, 52, 1, 104, 101, 108, 108, 111, 27, 52, 0]), result);
    });
  });

  describe('underline(true).text(hello).underline(false)', function() {
    const result = encoder.underline(true).text('hello').underline(false).encode();

    it('should be [ 27, 45, 1, ..., 27, 45, 0 ]', function() {
      assert.deepEqual(new Uint8Array([27, 45, 1, 104, 101, 108, 108, 111, 27, 45, 0]), result);
    });
  });

  describe('underline().text(hello).underline()', function() {
    const result = encoder.underline().text('hello').underline().encode();

    it('should be [ 27, 45, 1, ..., 27, 45, 0 ]', function() {
      assert.deepEqual(new Uint8Array([27, 45, 1, 104, 101, 108, 108, 111, 27, 45, 0]), result);
    });
  });

  describe('invert().text(hello).invert()', function() {
    const result = encoder.invert().text('hello').invert().encode();

    it('should be [ 29, 66, 1, ..., 29, 66, 0 ]', function() {
      assert.deepEqual(new Uint8Array([29, 66, 1, 104, 101, 108, 108, 111, 29, 66, 0]), result);
    });
  });

  describe('width(2).text(hello).width(1)', function() {
    const result = encoder.width(2).text('hello').width(1).encode();

    it('should be [ 29, 33, 16, ..., 29, 33, 0 ]', function() {
      assert.deepEqual(new Uint8Array([29, 33, 16, 104, 101, 108, 108, 111, 29, 33, 0]), result);
    });
  });

  describe('height(2).text(hello).height(1)', function() {
    const result = encoder.height(2).text('hello').height(1).encode();

    it('should be [ 29, 33, 1, ..., 29, 33, 0 ]', function() {
      assert.deepEqual(new Uint8Array([29, 33, 1, 104, 101, 108, 108, 111, 29, 33, 0]), result);
    });
  });

  describe('width(2).height(2).text(hello).width(1).height(1)', function() {
    const result = encoder.width(2).height(2).text('hello').width(1).height(1).encode();

    it('should be [ 29, 33, 16, 29, 33, 17, ..., 29, 33, 1, 29, 33, 0 ]', function() {
      assert.deepEqual(new Uint8Array([29, 33, 16, 29, 33, 17, 104, 101, 108, 108, 111, 29, 33, 1, 29, 33, 0]), result);
    });
  });

  describe('align(left).line(hello)', function() {
    const result = encoder.align('left').line('hello').encode();

    it('should be [ 27, 97, 0, ..., 10, 13 ]', function() {
      assert.deepEqual(new Uint8Array([27, 97, 0, 104, 101, 108, 108, 111, 10, 13]), result);
    });
  });

  describe('align(center).line(hello)', function() {
    const result = encoder.align('center').line('hello').encode();

    it('should be [ 27, 97, 1, ..., 10, 13 ]', function() {
      assert.deepEqual(new Uint8Array([27, 97, 1, 104, 101, 108, 108, 111, 10, 13]), result);
    });
  });

  describe('align(right).line(hello)', function() {
    const result = encoder.align('right').line('hello').encode();

    it('should be [ 27, 97, 2, ..., 10, 13 ]', function() {
      assert.deepEqual(new Uint8Array([27, 97, 2, 104, 101, 108, 108, 111, 10, 13]), result);
    });
  });

  describe('qrcode(https://nielsleenheer.com)', function() {
    const result = encoder.qrcode('https://nielsleenheer.com').encode();

    it('should be [ 10, 29, 40, 107, 4, 0, 49, 65, 50, 0, 29, 40, 107, 3, 0, ... ]', function() {
      assert.deepEqual(new Uint8Array([10, 29, 40, 107, 4, 0, 49, 65, 50, 0, 29, 40, 107, 3, 0, 49, 67, 6, 29, 40, 107, 3, 0, 49, 69, 49, 29, 40, 107, 28, 0, 49, 80, 48, 104, 116, 116, 112, 115, 58, 47, 47, 110, 105, 101, 108, 115, 108, 101, 101, 110, 104, 101, 101, 114, 46, 99, 111, 109, 29, 40, 107, 3, 0, 49, 81, 48]), result);
    });
  });

  describe('qrcode(https://nielsleenheer.com, 1, 8, h)', function() {
    const result = encoder.qrcode('https://nielsleenheer.com', 1, 8, 'h').encode();

    it('should be [ 10, 29, 40, 107, 4, 0, 49, 65, 49, 0, 29, 40, 107, 3, 0, ... ]', function() {
      assert.deepEqual(new Uint8Array([10, 29, 40, 107, 4, 0, 49, 65, 49, 0, 29, 40, 107, 3, 0, 49, 67, 8, 29, 40, 107, 3, 0, 49, 69, 51, 29, 40, 107, 28, 0, 49, 80, 48, 104, 116, 116, 112, 115, 58, 47, 47, 110, 105, 101, 108, 115, 108, 101, 101, 110, 104, 101, 101, 114, 46, 99, 111, 109, 29, 40, 107, 3, 0, 49, 81, 48]), result);
    });
  });

  describe('barcode(3130630574613, ean13, 60)', function() {
    const result = encoder.barcode('3130630574613', 'ean13', 60).encode();

    it('should be [ 29, 104, 60, 29, 119, 3, 29, 107, 2, ... ]', function() {
      assert.deepEqual(new Uint8Array([29, 104, 60, 29, 119, 3, 29, 107, 2, 51, 49, 51, 48, 54, 51, 48, 53, 55, 52, 54, 49, 51, 0]), result);
    });
  });

  describe('barcode(CODE128, code128, 60)', function() {
    const result = encoder.barcode('CODE128', 'code128', 60).encode();

    it('should be [ 29, 104, 60, 29, 119, 3, 29, 107, 73, ... ]', function() {
      assert.deepEqual(new Uint8Array([29, 104, 60, 29, 119, 3, 29, 107, 73, 9, 123, 66, 67, 79, 68, 69, 49, 50, 56]), result);
    });
  });

  describe('barcode({ACODE128, code128, 60)', function() {
    const result = encoder.barcode('{ACODE128', 'code128', 60).encode();

    it('should be [ 29, 104, 60, 29, 119, 3, 29, 107, 73, ... ]', function() {
      assert.deepEqual(new Uint8Array([29, 104, 60, 29, 119, 3, 29, 107, 73, 9, 123, 65, 67, 79, 68, 69, 49, 50, 56]), result);
    });
  });

  describe('barcode({BCODE128, code128, 60)', function() {
    const result = encoder.barcode('{BCODE128', 'code128', 60).encode();

    it('should be [ 29, 104, 60, 29, 119, 3, 29, 107, 73, ... ]', function() {
      assert.deepEqual(new Uint8Array([29, 104, 60, 29, 119, 3, 29, 107, 73, 9, 123, 66, 67, 79, 68, 69, 49, 50, 56]), result);
    });
  });

  describe('barcode({C2Uc#, code128, 60)', function() {
    const result = encoder.barcode('{C2Uc#', 'code128', 60).encode();

    it('should be [ 29, 104, 60, 29, 119, 3, 29, 107, 73, ... ]', function() {
      assert.deepEqual(new Uint8Array([29, 104, 60, 29, 119, 3, 29, 107, 73, 6, 123, 67, 50, 85, 99, 35]), result);
    });
  });

  // describe('image(canvas, 8, 8) - with a black pixel at 0,0 (legacy)', function() {
  //   const canvas = make(8, 8);
  //   const context = canvas.getContext('2d');
  //   context.fillStyle = 'rgba(0, 0, 0, 1)';
  //   context.fillRect( 0, 0, 1, 1 );
  //
  //   const result = rasterEncoder.image(canvas, 8, 8).encode();
  //
  //   it('should be [ 29, 118, 48, 0, 1, 0, 8, 0, 128, 0, 0, 0, 0, 0, 0, 0 ]', function() {
  //     assert.deepEqual(new Uint8Array([29, 118, 48, 0, 1, 0, 8, 0, 128, 0, 0, 0, 0, 0, 0, 0]), result);
  //   });
  // });

  // describe('image(canvas, 8, 8) - with a black pixel at 0,0', function() {
  //   const canvas = make(8, 8);
  //   const context = canvas.getContext('2d');
  //   context.fillStyle = 'rgba(0, 0, 0, 1)';
  //   context.fillRect( 0, 0, 1, 1 );
  //
  //   const result = encoder.image(canvas, 8, 8).encode();
  //
  //   it('should be [ 27, 51, 36, 27, 42, 33, 8, 0, 128, 0, 0, 0, 0, ... ]', function() {
  //     assert.deepEqual(new Uint8Array([27, 51, 36, 27, 42, 33, 8, 0, 128, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 27, 50]), result);
  //   });
  // });

  describe('pulse()', function() {
    const result = encoder.pulse().encode();

    it('should be [ 27, 112, 0, 50, 250 ]', function() {
      assert.deepEqual(new Uint8Array([27, 112, 0, 50, 250]), result);
    });
  });

  describe('cut()', function() {
    const result = encoder.cut().encode();

    it('should be [ 29, 86, 00 ]', function() {
      assert.deepEqual(new Uint8Array([29, 86, 0]), result);
    });
  });

  describe('cut(full)', function() {
    const result = encoder.cut('full').encode();

    it('should be [ 29, 86, 00 ]', function() {
      assert.deepEqual(new Uint8Array([29, 86, 0]), result);
    });
  });

  describe('cut(partial)', function() {
    const result = encoder.cut('partial').encode();

    it('should be [ 29, 86, 01 ]', function() {
      assert.deepEqual(new Uint8Array([29, 86, 1]), result);
    });
  });

  describe('raw([ 0x1c, 0x2e ])', function() {
    const result = encoder.raw([0x1c, 0x2e]).encode();

    it('should be [ 28, 46 ]', function() {
      assert.deepEqual(new Uint8Array([28, 46]), result);
    });
  });

  describe('codepage(auto).text(héψжł)', function() {
    const result = encoder.codepage('auto').text('héψжł').encode();

    it('should be [27, 116, 0, 104, 130, 27, 116, 38, 246, 27, 116, 34, 233, 27, 116, 18, 136]', function() {
      assert.deepEqual(new Uint8Array([27, 116, 0, 104, 130, 27, 116, 38, 246, 27, 116, 34, 233, 27, 116, 18, 136]), result);
    });
  });
});
