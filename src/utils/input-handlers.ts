"use strict";

import * as converters from "./converters";
import * as utils from "./utils";

const availableFormsMap = {
  decimal: function (bytes: Uint8Array) {
    const asLittleEndian = utils.addSeparatorToNumber(converters.toDecimalUnsigned(bytes), ",", 3);
    const asBigEndian = utils.addSeparatorToNumber(converters.toDecimalUnsigned(bytes.reverse()), ",", 3);
    return `${asLittleEndian} / ${asBigEndian}(reverse)`;
  },
  hexadecimal: function (bytes: Uint8Array) {
    return `0x${converters.toHexadecimal(bytes)}`;
  },
  hexadecimalReverse: function (bytes: Uint8Array) {
    return `0x${converters.toHexadecimal(bytes.reverse())}(reverse)`;
  },
  binary: function (bytes: Uint8Array) {
    return utils.addSeparatorToNumber(converters.toBinary(bytes), " ", 8);
  },
  base64: converters.toBase64,
  gwei: function (bytes: Uint8Array) {
    return `${utils.shiftBy(converters.toDecimalUnsigned(bytes), 9)}gwei / ${utils.shiftBy(
      converters.toDecimalUnsigned(bytes),
      -9
    )}gwei(From Ether)`;
  },
  ether: function (bytes: Uint8Array) {
    return `${utils.shiftBy(converters.toDecimalUnsigned(bytes), 18)}ether`;
  },
};

function createFormsMap(forms: string[]) {
  const result = {};
  for (const form of forms) {
    if (!(form in availableFormsMap)) continue;
    result[form] = availableFormsMap[form];
  }
  return result;
}

export type MapFormToFunction = {
  [name: string]: (bytes: Uint8Array) => string;
};

abstract class InputHandler {
  abstract parse(str: string): string;
  abstract convert(str: string, isLittleEndian: boolean): Uint8Array;
  abstract getFormsMap(): MapFormToFunction;
}

class InputHandlerBinary extends InputHandler {
  parse(str: string) {
    let regexes = ["0b([0-1]+)"];

    for (let regex of regexes) {
      let re = new RegExp("^" + regex + "$");
      let match = re.exec(str);
      if (match) {
        return match[1];
      }
    }
  }

  convert(str: string, isLittleEndian: boolean) {
    return converters.fromBinaryToUint8Array(str, isLittleEndian);
  }

  getFormsMap() {
    return createFormsMap(["ascii", "decimal", "hexadecimal", "hexadecimalReverse", "size", "base64"]);
  }
}

class InputHandlerDecimal extends InputHandler {
  parse(str: string) {
    let regexes = ["([0-9]+)(?:[uU])?(?:[lL])?(?:[lL])?"];

    for (let regex of regexes) {
      let re = new RegExp("^" + regex + "$");
      let match = re.exec(str);
      if (match) {
        return match[1];
      }
    }
  }

  convert(str: string, isLittleEndian: boolean) {
    return converters.fromDecimalToUint8Array(str, !isLittleEndian);
  }

  getFormsMap() {
    return createFormsMap(["ascii", "binary", "hexadecimal", "hexadecimalReverse", "size", "base64", "gwei", "ether"]);
  }
}

class InputHandlerHexadecimal extends InputHandler {
  parse(str: string) {
    let regexes = ["0x([0-9a-fA-F]+)(?:[uU])?(?:[lL])?(?:[lL])?", "#([0-9a-fA-F]+)"];

    for (let regex of regexes) {
      let re = new RegExp("^" + regex + "$");
      let match = re.exec(str);
      if (match) {
        return match[1];
      }
    }
  }

  convert(str: string, isLittleEndian: boolean) {
    return converters.fromHexadecimalToUint8Array(str, isLittleEndian);
  }

  getFormsMap() {
    return createFormsMap([
      "ascii",
      "binary",
      "decimal",
      "hexadecimal",
      "hexadecimalReverse",
      "size",
      "base64",
      "gwei",
      "ether",
    ]);
  }
}

export function createInputHandler(name: string) {
  let map = {
    binary: new InputHandlerBinary(),
    decimal: new InputHandlerDecimal(),
    hexadecimal: new InputHandlerHexadecimal(),
  };

  return map[name];
}
