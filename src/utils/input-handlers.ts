"use strict";

import {
  fromBinaryToUint8Array,
  fromDecimalToUint8Array,
  fromHexadecimalToUint8Array,
  toBase64,
  toBinary,
  toDecimalUnsigned,
  toHexadecimal,
} from "./converters";
import { addSeparatorToNumber, copyBytes, shiftBy } from "./utils";

const availableFormsMap = {
  decimal: function (bytes: Uint8Array) {
    const asLittleEndian = addSeparatorToNumber(toDecimalUnsigned(bytes), ",", 3);
    const asBigEndian = addSeparatorToNumber(toDecimalUnsigned(copyBytes(bytes).reverse()), ",", 3);
    return `${asLittleEndian} / ${asBigEndian}(reverse)`;
  },
  hexadecimal: function (bytes: Uint8Array) {
    if (bytes.length >= 20) {
      return `0x${toHexadecimal(bytes)}`;
    }
    return `0x ${addSeparatorToNumber(toHexadecimal(bytes), " ", 2)}`;
  },
  hexadecimalReverse: function (bytes: Uint8Array) {
    const reverseBytes = copyBytes(bytes).reverse();
    if (reverseBytes.length >= 20) {
      return `0x${toHexadecimal(reverseBytes)}`;
    }
    return `0x ${addSeparatorToNumber(toHexadecimal(reverseBytes), " ", 2)}`;
  },
  binary: function (bytes: Uint8Array) {
    return addSeparatorToNumber(toBinary(bytes), " ", 8);
  },
  base64: toBase64,
  gwei: function (bytes: Uint8Array) {
    return `${shiftBy(toDecimalUnsigned(bytes), 9)}Gwei / ${shiftBy(toDecimalUnsigned(bytes), -9)}Gwei(From Ether)`;
  },
  ether: function (bytes: Uint8Array) {
    return `${shiftBy(toDecimalUnsigned(bytes), 18)}Ether`;
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
    return fromBinaryToUint8Array(str, isLittleEndian);
  }

  getFormsMap() {
    return createFormsMap(["decimal", "hexadecimal", "hexadecimalReverse", "size", "base64"]);
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
    return fromDecimalToUint8Array(str, isLittleEndian);
  }

  getFormsMap() {
    return createFormsMap(["binary", "hexadecimal", "hexadecimalReverse", "size", "base64", "gwei", "ether"]);
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
    return fromHexadecimalToUint8Array(str, isLittleEndian);
  }

  getFormsMap() {
    return createFormsMap(["binary", "decimal", "hexadecimalReverse", "size", "base64", "gwei", "ether"]);
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
