import * as utils from "./utils";

// #region From X to Uint8Array.
export function fromBinaryToUint8Array(_str: string, isLittleEndian: boolean) {
  if (!_str) {
    return undefined;
  }
  // ignore 0b prefix
  const str = utils.reverseString(_str);
  // calc bits
  const result = new Uint8Array((str.length + 7) / 8);
  for (let i = 0; i < result.length; i++) {
    result[i] = 0;
    for (let j = 0; j < 8 && 8 * i + j < str.length; j++) {
      result[i] += (str[i * 8 + j] == "1" ? 1 : 0) << j;
    }
  }
  if (!isLittleEndian) {
    return result.reverse();
  }
  return result;
}

function fromDecimalToBinary(str: string) {
  let result = "";
  let num = parseInt(str);
  while (true) {
    if (num == 0) break;
    const mod = num % 2;
    result += mod;
    num = (num - mod) / 2;
  }
  return utils.reverseString(result);
}

export function fromDecimalToUint8Array(str: string, isLittleEndian: boolean) {
  if (!str) {
    return undefined;
  }
  return fromBinaryToUint8Array(fromDecimalToBinary(str), isLittleEndian);
}

export function fromHexadecimalToUint8Array(_str: string, isLittleEndian: boolean) {
  if (!_str) return undefined;

  const str = _str.replace("0x", "").split("").reverse().join("");
  const length = str.length;
  const result = new Uint8Array((length + 1) / 2);
  result.forEach((_, i) => {
    result[i] = parseInt(str[2 * i], 16) + (2 * i + 1 < length ? 16 * parseInt(str[2 * i + 1], 16) : 0);
  });

  if (!isLittleEndian) {
    return result.reverse();
  }
  return result;
}
// #endregion

// #region From bytes to X.
export function toDecimalUnsigned(bytes: Uint8Array) {
  if (bytes.length == 0) {
    return "";
  }

  let dec = new Uint8Array(3 * bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    let temp = new Uint32Array(3 * bytes.length);
    temp[0] = bytes[i] % 10;
    temp[1] = (bytes[i] / 10) % 10;
    temp[2] = (bytes[i] / 100) % 10;

    for (let j = 0; j < i; j++) {
      for (let k = 0; k < temp.length; k++) {
        temp[k] *= 256;
      }

      for (let k = 0; k < temp.length - 1; k++) {
        if (temp[k] >= 10) {
          temp[k + 1] += temp[k] / 10;
          temp[k] %= 10;
        }
      }
    }

    for (let j = 0; j < dec.length; j++) {
      dec[j] += temp[j];
    }
    for (let j = 0; j < dec.length - 1; j++) {
      if (dec[j] >= 10) {
        dec[j + 1] += dec[j] / 10;
        dec[j] %= 10;
      }
    }
  }

  let length = 0;
  for (let j = 0; j < dec.length; j++) {
    if (dec[j] != 0) {
      length = j;
    }
  }

  let result = "";
  for (let j = 0; j <= length; j++) {
    result = dec[j] + result;
  }

  return result;
}

export function toDecimalSigned(bytes: Uint8Array) {
  if (bytes.length == 0) {
    return "";
  }

  let copy = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; ++i) {
    copy[i] = bytes[i];
  }

  let sign = copy[copy.length - 1] >> 7;
  copy[copy.length - 1] &= 0x7f;
  return (sign ? "-" : "") + toDecimalUnsigned(copy);
}

export function toBinary(bytes: Uint8Array) {
  let result = "";
  for (const byte of bytes) {
    for (let i = 0; i < 8; i++) {
      result = ((byte >> i) % 2) + result;
    }
  }
  return result;
}

export function toHexadecimal(bytes: Uint8Array) {
  let result = "";
  for (const byte of bytes) {
    result = ("0" + byte.toString(16)).slice(-2) + result;
  }
  return result;
}

export function toBase64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}
// #endregion
