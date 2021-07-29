const linewrap = require('linewrap');
const {createCanvas} = require('canvas');
const Dither = require('canvas-dither');
const Flatten = require('canvas-flatten');
const CodepageEncoder = require('codepage-encoder');


const codepageMappings = {
  epson: {
    'cp437': 0x00,
    'shiftjis': 0x01,
    'cp850': 0x02,
    'cp860': 0x03,
    'cp863': 0x04,
    'cp865': 0x05,
    'cp851': 0x0b,
    'cp853': 0x0c,
    'cp857': 0x0d,
    'cp737': 0x0e,
    'iso88597': 0x0f,
    'windows1252': 0x10,
    'cp866': 0x11,
    'cp852': 0x12,
    'cp858': 0x13,
    'cp720': 0x20,
    'cp775': 0x21,
    'cp855': 0x22,
    'cp861': 0x23,
    'cp862': 0x24,
    'cp864': 0x25,
    'cp869': 0x26,
    'iso88592': 0x27,
    'iso885915': 0x28,
    'cp1098': 0x29,
    'cp1118': 0x2a,
    'cp1119': 0x2b,
    'cp1125': 0x2c,
    'windows1250': 0x2d,
    'windows1251': 0x2e,
    'windows1253': 0x2f,
    'windows1254': 0x30,
    'windows1255': 0x31,
    'windows1256': 0x32,
    'windows1257': 0x33,
    'windows1258': 0x34,
    'rk1048': 0x35,
  },

  zjiang: {
    'cp437': 0x00,
    'shiftjis': 0x01,
    'cp850': 0x02,
    'cp860': 0x03,
    'cp863': 0x04,
    'cp865': 0x05,
    'windows1252': 0x10,
    'cp866': 0x11,
    'cp852': 0x12,
    'cp858': 0x13,
    'windows1255': 0x20,
    'cp861': 0x38,
    'cp855': 0x3c,
    'cp857': 0x3d,
    'cp862': 0x3e,
    'cp864': 0x3f,
    'cp737': 0x40,
    'cp851': 0x41,
    'cp869': 0x42,
    'cp1119': 0x44,
    'cp1118': 0x45,
    'windows1250': 0x48,
    'windows1251': 0x49,
    'cp3840': 0x4a,
    'cp3843': 0x4c,
    'cp3844': 0x4d,
    'cp3845': 0x4e,
    'cp3846': 0x4f,
    'cp3847': 0x50,
    'cp3848': 0x51,
    'cp2001': 0x53,
    'cp3001': 0x54,
    'cp3002': 0x55,
    'cp3011': 0x56,
    'cp3012': 0x57,
    'cp3021': 0x58,
    'cp3041': 0x59,
    'windows1253': 0x5a,
    'windows1254': 0x5b,
    'windows1256': 0x5c,
    'cp720': 0x5d,
    'windows1258': 0x5e,
    'cp775': 0x5f,
  },

  bixolon: {
    'cp437': 0x00,
    'shiftjis': 0x01,
    'cp850': 0x02,
    'cp860': 0x03,
    'cp863': 0x04,
    'cp865': 0x05,
    'cp851': 0x0b,
    'cp858': 0x13,
  },

  star: {
    'cp437': 0x00,
    'shiftjis': 0x01,
    'cp850': 0x02,
    'cp860': 0x03,
    'cp863': 0x04,
    'cp865': 0x05,
    'windows1252': 0x10,
    'cp866': 0x11,
    'cp852': 0x12,
    'cp858': 0x13,
  },

  legacy: {
    'cp437': 0x00,
    'cp737': 0x40,
    'cp850': 0x02,
    'cp775': 0x5f,
    'cp852': 0x12,
    'cp855': 0x3c,
    'cp857': 0x3d,
    'cp858': 0x13,
    'cp860': 0x03,
    'cp861': 0x38,
    'cp862': 0x3e,
    'cp863': 0x04,
    'cp864': 0x1c,
    'cp865': 0x05,
    'cp866': 0x11,
    'cp869': 0x42,
    'cp936': 0xff,
    'cp949': 0xfd,
    'cp950': 0xfe,
    'cp1252': 0x10,
    'iso88596': 0x16,
    'shiftjis': 0xfc,
    'windows874': 0x1e,
    'windows1250': 0x48,
    'windows1251': 0x49,
    'windows1252': 0x47,
    'windows1253': 0x5a,
    'windows1254': 0x5b,
    'windows1255': 0x20,
    'windows1256': 0x5c,
    'windows1257': 0x19,
    'windows1258': 0x5e,
  },
};


/**
 * Create a byte stream based on commands for ESC/POS printers
 */
class EscPosEncoder {
  /**
     * Create a new object
     *
     * @param  {object}   options   Object containing configuration options
    */
  constructor(options) {
    this._reset(options);
  }

  /**
     * Reset the state of the object
     *
     * @param  {object}   options   Object containing configuration options
    */
  _reset(options) {
    this._options = Object.assign({
      legacy: false,
      codepageMapping: 'epson',
      codepageCandidates: [
        'cp437', 'cp858', 'cp860', 'cp861', 'cp863', 'cp865',
        'cp852', 'cp857', 'cp855', 'cp866', 'cp869',
      ],
    }, options);

    this._buffer = [];
    this._codepage = 'ascii';

    this._state = {
      'bold': false,
      'italic': false,
      'underline': false,
      'invert': false,
      'hanzi': false,
      'width': 1,
      'height': 1,
    };
  }

  /**
     * Encode a string with the current code page
     *
     * @param  {string}   value  String to encode
     * @return {object}          Encoded string as a ArrayBuffer
     *
    */
  _encode(value) {
    if (this._codepage != 'auto') {
      return CodepageEncoder.encode(value, this._codepage);
    }

    let codepages;

    if (typeof this._options.codepageMapping == 'string') {
      codepages = codepageMappings[this._options.codepageMapping];
    } else {
      codepages = this._options.codepageMapping;
    }

    const fragments = CodepageEncoder.autoEncode(value, this._options.codepageCandidates);

    let length = 0;
    for (let f = 0; f < fragments.length; f++) {
      length += 3 + fragments[f].bytes.byteLength;
    }

    const buffer = new Uint8Array(length);
    let i = 0;

    for (let f = 0; f < fragments.length; f++) {
      buffer.set([0x1b, 0x74, codepages[fragments[f].codepage]], i);
      buffer.set(fragments[f].bytes, i + 3);
      i += 3 + fragments[f].bytes.byteLength;
    }

    return buffer;
  }

  /**
     * Add commands to the buffer
     *
     * @param  {array}   value  And array of numbers, arrays, buffers or Uint8Arrays to add to the buffer
     *
    */
  _queue(value) {
    value.forEach((item) => this._buffer.push(item));
  }

  /**
     * Initialize the printer
     *
     * @return {object}          Return the object, for easy chaining commands
     *
     */
  initialize() {
    this._queue([
      0x1b, 0x40,
    ]);

    return this;
  }

  /**
     * Change the code page
     *
     * @param  {string}   codepage  The codepage that we set the printer to
     * @return {object}             Return the object, for easy chaining commands
     *
     */
  codepage(codepage) {
    if (codepage === 'auto') {
      this._codepage = codepage;
      return this;
    }

    if (!CodepageEncoder.supports(codepage)) {
      throw new Error('Unknown codepage');
    }

    let codepages;

    if (typeof this._options.codepageMapping == 'string') {
      codepages = codepageMappings[this._options.codepageMapping];
    } else {
      codepages = this._options.codepageMapping;
    }

    if (typeof codepages[codepage] !== 'undefined') {
      this._codepage = codepage;
      this._queue([
        0x1b, 0x74, codepages[codepage],
      ]);
    } else {
      throw new Error('Codepage not supported by printer');
    }

    return this;
  }

  /**
     * Print text
     *
     * @param  {string}   value  Text that needs to be printed
     * @param  {number}   wrap   Wrap text after this many positions
     * @return {object}          Return the object, for easy chaining commands
     *
     */
  text(value, wrap) {
    if (wrap) {
      const w = linewrap(wrap, {lineBreak: '\r\n'});
      value = w(value);
    }

    const bytes = this._encode(value);

    this._queue([
      bytes,
    ]);

    return this;
  }

  /**
     * Print a newline
     *
     * @return {object}          Return the object, for easy chaining commands
     *
     */
  newline() {
    this._queue([
      0x0a, 0x0d,
    ]);

    return this;
  }

  /**
     * Print text, followed by a newline
     *
     * @param  {string}   value  Text that needs to be printed
     * @param  {number}   wrap   Wrap text after this many positions
     * @return {object}          Return the object, for easy chaining commands
     *
     */
  line(value, wrap) {
    this.text(value, wrap);
    this.newline();

    return this;
  }

  /**
     * Underline text
     *
     * @param  {boolean|number}   value  true to turn on underline, false to turn off, or 2 for double underline
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  underline(value) {
    if (typeof value === 'undefined') {
      value = ! this._state.underline;
    }

    this._state.underline = value;

    this._queue([
      0x1b, 0x2d, Number(value),
    ]);

    return this;
  }

  /**
     * Italic text
     *
     * @param  {boolean}          value  true to turn on italic, false to turn off
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  italic(value) {
    if (typeof value === 'undefined') {
      value = ! this._state.italic;
    }

    this._state.italic = value;

    this._queue([
      0x1b, 0x34, Number(value),
    ]);

    return this;
  }

  /**
     * Bold text
     *
     * @param  {boolean}          value  true to turn on bold, false to turn off
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  bold(value) {
    if (typeof value === 'undefined') {
      value = ! this._state.bold;
    }

    this._state.bold = value;

    this._queue([
      0x1b, 0x45, Number(value),
    ]);

    return this;
  }

  /**
     * Change width of text
     *
     * @param  {number}          width    The width of the text, 1 - 8
     * @return {object}                   Return the object, for easy chaining commands
     *
     */
  width(width) {
    if (typeof width === 'undefined') {
      width = 1;
    }

    if (typeof width !== 'number') {
      throw new Error('Width must be a number');
    }

    if (width < 1 || width > 8) {
      throw new Error('Width must be between 1 and 8');
    }

    this._state.width = width;

    this._queue([
      0x1d, 0x21, (this._state.height - 1) | (this._state.width - 1) << 4,
    ]);

    return this;
  }

  /**
     * Change height of text
     *
     * @param  {number}          height  The height of the text, 1 - 8
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  height(height) {
    if (typeof height === 'undefined') {
      height = 1;
    }

    if (typeof height !== 'number') {
      throw new Error('Height must be a number');
    }

    if (height < 1 || height > 8) {
      throw new Error('Height must be between 1 and 8');
    }

    this._state.height = height;

    this._queue([
      0x1d, 0x21, (this._state.height - 1) | (this._state.width - 1) << 4,
    ]);

    return this;
  }

  /**
     * Invert text
     *
     * @param  {boolean}          value  true to turn on white text on black, false to turn off
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  invert(value) {
    if (typeof value === 'undefined') {
      value = ! this._state.invert;
    }

    this._state.invert = value;

    this._queue([
      0x1d, 0x42, Number(value),
    ]);

    return this;
  }

  /**
     * Change text size
     *
     * @param  {string}          value   small or normal
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  size(value) {
    if (value === 'small') {
      value = 0x01;
    } else {
      value = 0x00;
    }

    this._queue([
      0x1b, 0x4d, value,
    ]);

    return this;
  }

  /**
     * Change text alignment
     *
     * @param  {string}          value   left, center or right
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  align(value) {
    const alignments = {
      'left': 0x00,
      'center': 0x01,
      'right': 0x02,
    };

    if (value in alignments) {
      this._queue([
        0x1b, 0x61, alignments[value],
      ]);
    } else {
      throw new Error('Unknown alignment');
    }

    return this;
  }

  /**
     * Barcode
     *
     * @param  {string}           value  the value of the barcode
     * @param  {string}           symbology  the type of the barcode
     * @param  {number}           height  height of the barcode
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  barcode(value, symbology, height) {
    const symbologies = {
      'upca': 0x00,
      'upce': 0x01,
      'ean13': 0x02,
      'ean8': 0x03,
      'code39': 0x04,
      'coda39': 0x04, /* typo, leave here for backwards compatibility */
      'itf': 0x05,
      'codabar': 0x06,
      'code93': 0x48,
      'code128': 0x49,
      'gs1-128': 0x50,
      'gs1-databar-omni': 0x51,
      'gs1-databar-truncated': 0x52,
      'gs1-databar-limited': 0x53,
      'gs1-databar-expanded': 0x54,
      'code128-auto': 0x55,
    };

    if (symbology in symbologies) {
      const bytes = CodepageEncoder.encode(value, 'ascii');

      this._queue([
        0x1d, 0x68, height,
        0x1d, 0x77, symbology === 'code39' ? 0x02 : 0x03,
      ]);

      if (symbology == 'code128' && bytes[0] !== 0x7b) {
        /* Not yet encodeded Code 128, assume data is Code B, which is similar to ASCII without control chars */

        this._queue([
          0x1d, 0x6b, symbologies[symbology],
          bytes.length + 2,
          0x7b, 0x42,
          bytes,
        ]);
      } else if (symbologies[symbology] > 0x40) {
        /* Function B symbologies */

        this._queue([
          0x1d, 0x6b, symbologies[symbology],
          bytes.length,
          bytes,
        ]);
      } else {
        /* Function A symbologies */

        this._queue([
          0x1d, 0x6b, symbologies[symbology],
          bytes,
          0x00,
        ]);
      }
    } else {
      throw new Error('Symbology not supported by printer');
    }

    return this;
  }

  /**
     * QR code
     *
     * @param  {string}           value  the value of the qr code
     * @param  {number}           model  model of the qrcode, either 1 or 2
     * @param  {number}           size   size of the qrcode, a value between 1 and 8
     * @param  {string}           errorlevel  the amount of error correction used, either 'l', 'm', 'q', 'h'
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  qrcode(value, model, size, errorlevel) {
    /* Force printing the print buffer and moving to a new line */

    this._queue([
      0x0a,
    ]);

    /* Model */

    const models = {
      1: 0x31,
      2: 0x32,
    };

    if (typeof model === 'undefined') {
      model = 2;
    }

    if (model in models) {
      this._queue([
        0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, models[model], 0x00,
      ]);
    } else {
      throw new Error('Model must be 1 or 2');
    }

    /* Size */

    if (typeof size === 'undefined') {
      size = 6;
    }

    if (typeof size !== 'number') {
      throw new Error('Size must be a number');
    }

    if (size < 1 || size > 8) {
      throw new Error('Size must be between 1 and 8');
    }

    this._queue([
      0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size,
    ]);

    /* Error level */

    const errorlevels = {
      'l': 0x30,
      'm': 0x31,
      'q': 0x32,
      'h': 0x33,
    };

    if (typeof errorlevel === 'undefined') {
      errorlevel = 'm';
    }

    if (errorlevel in errorlevels) {
      this._queue([
        0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, errorlevels[errorlevel],
      ]);
    } else {
      throw new Error('Error level must be l, m, q or h');
    }

    /* Data */

    const bytes = CodepageEncoder.encode(value, 'iso88591');
    const length = bytes.length + 3;

    this._queue([
      0x1d, 0x28, 0x6b, length % 0xff, length / 0xff, 0x31, 0x50, 0x30, bytes,
    ]);

    /* Print QR code */

    this._queue([
      0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30,
    ]);

    return this;
  }

  /**
     * Image
     *
     * @param  {object}         element  an element, like a canvas or image that needs to be printed
     * @param  {number}         width  width of the image on the printer
     * @param  {number}         height  height of the image on the printer
     * @param  {string}         algorithm  the dithering algorithm for making the image black and white
     * @param  {number}         threshold  threshold for the dithering algorithm
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  image(element, width, height, algorithm, threshold) {
    if (width % 8 !== 0) {
      throw new Error('Width must be a multiple of 8');
    }

    if (height % 8 !== 0) {
      throw new Error('Height must be a multiple of 8');
    }

    if (typeof algorithm === 'undefined') {
      algorithm = 'threshold';
    }

    if (typeof threshold === 'undefined') {
      threshold = 128;
    }

    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    context.drawImage(element, 0, 0, width, height);
    let image = context.getImageData(0, 0, width, height);

    image = Flatten.flatten(image, [0xff, 0xff, 0xff]);

    switch (algorithm) {
      case 'threshold': image = Dither.threshold(image, threshold); break;
      case 'bayer': image = Dither.bayer(image, threshold); break;
      case 'floydsteinberg': image = Dither.floydsteinberg(image); break;
      case 'atkinson': image = Dither.atkinson(image); break;
    }

    const getPixel = (x, y) => x < width && y < height ? (image.data[((width * y) + x) * 4] > 0 ? 0 : 1) : 0;

    const getColumnData = (width, height) => {
      const data = [];

      for (let s = 0; s < Math.ceil(height / 24); s++) {
        const bytes = new Uint8Array(width * 3);

        for (let x = 0; x < width; x++) {
          for (let c = 0; c < 3; c++) {
            for (let b = 0; b < 8; b++) {
              bytes[(x * 3) + c] |= getPixel(x, (s * 24) + b + (8 * c)) << (7 - b);
            }
          }
        }

        data.push(bytes);
      }

      return data;
    };

    const getRowData = (width, height) => {
      const bytes = new Uint8Array((width * height) >> 3);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x = x + 8) {
          for (let b = 0; b < 8; b++) {
            bytes[(y * (width >> 3)) + (x >> 3)] |= getPixel(x + b, y) << (7 - b);
          }
        }
      }

      return bytes;
    };

    /* Encode images with ESC * */

    if (this._options.legacy == false) {
      this._queue([
        0x1b, 0x33, 0x24,
      ]);

      getColumnData(width, height).forEach((bytes) => {
        this._queue([
          0x1b, 0x2a, 0x21,
          (width) & 0xff, (((width) >> 8) & 0xff),
          bytes,
          0x0a,
        ]);
      });

      this._queue([
        0x1b, 0x32,
      ]);
    }

    /* Encode images with GS v */

    if (this._options.legacy == true) {
      this._queue([
        0x1d, 0x76, 0x30, 0x00,
        (width >> 3) & 0xff, (((width >> 3) >> 8) & 0xff),
        height & 0xff, ((height >> 8) & 0xff),
        getRowData(width, height),
      ]);
    }

    return this;
  }

  /**
     * Cut paper
     *
     * @param  {string}          value   full or partial. When not specified a full cut will be assumed
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  cut(value) {
    let data = 0x00;

    if (value == 'partial') {
      data = 0x01;
    }

    this._queue([
      0x1d, 0x56, data,
    ]);

    return this;
  }

  /**
     * Pulse
     *
     * @param  {number}          device  0 or 1 for on which pin the device is connected, default of 0
     * @param  {number}          on      Time the pulse is on in milliseconds, default of 100
     * @param  {number}          off     Time the pulse is off in milliseconds, default of 500
     * @return {object}                  Return the object, for easy chaining commands
     *
     */
  pulse(device, on, off) {
    if (typeof device === 'undefined') {
      device = 0;
    }

    if (typeof on === 'undefined') {
      on = 100;
    }

    if (typeof off === 'undefined') {
      off = 500;
    }

    on = Math.min(500, Math.round(on / 2));
    off = Math.min(500, Math.round(off / 2));

    this._queue([
      0x1b, 0x70, device ? 1 : 0, on & 0xff, off & 0xff,
    ]);

    return this;
  }

  /**
     * Add raw printer commands
     *
     * @param  {array}           data   raw bytes to be included
     * @return {object}          Return the object, for easy chaining commands
     *
     */
  raw(data) {
    this._queue(data);

    return this;
  }

  /**
     * Encode all previous commands
     *
     * @return {Uint8Array}         Return the encoded bytes
     *
     */
  encode() {
    let length = 0;

    this._buffer.forEach((item) => {
      if (typeof item === 'number') {
        length++;
      } else {
        length += item.length;
      }
    });

    const result = new Uint8Array(length);

    let index = 0;

    this._buffer.forEach((item) => {
      if (typeof item === 'number') {
        result[index] = item;
        index++;
      } else {
        result.set(item, index);
        index += item.length;
      }
    });

    this._reset();

    return result;
  }
}

module.exports = EscPosEncoder;
