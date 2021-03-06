import { ethers } from 'ethers';
import { BigNumber } from '@0x/utils';

export function bytes32ToString(value: string): string {
  return ethers.utils.toUtf8String(value);
}

export function stringToBytes32(value: string): string {
  return ethers.utils.formatBytes32String(value);
}

export function bigNumberToDate(value: BigNumber) {
  const date = new Date(0);
  date.setUTCSeconds(value.toNumber());
  return date;
}

export function dateToBigNumber(value: Date) {
  return new BigNumber(parseInt((value.getTime() / 1000).toFixed(0), 10));
}

export function numberToBigNumber(value: number) {
  return new BigNumber(value);
}

export function bigNumberToNumber(value: BigNumber) {
  return value.toNumber();
}

export function dateArrayToBigNumberArray(value: Date[]) {
  return value.map<BigNumber>(x => {
    return dateToBigNumber(x);
  });
}

export function numberArrayToBigNumberArray(value: number[]) {
  return value.map<BigNumber>(x => {
    return numberToBigNumber(x);
  });
}

export function stringArrayToBytes32Array(value: string[]) {
  return value.map<string>(x => {
    return stringToBytes32(x);
  });
}

export function bytes32ArrayToStringArray(value: string[]) {
  return value.map<string>(x => {
    return bytes32ToString(x);
  });
}
