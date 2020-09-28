/**
@module pkd-controller.js
This module provides an API for interacting with the pkd smart contract.
The functions are fairly self-documenting so not individually commented.
*/

import tc from 'truffle-contract';
import jsonfile from 'jsonfile';
import { utf8ToHex, hexToUtf8, ensure0x } from 'zkp-utils';

import Web3 from './web3';

const bytes32 = name => utf8ToHex(name, 32);

const PKD = tc(jsonfile.readFileSync('/app/build/contracts/PKD.json'));
PKD.setProvider(Web3.connect());

export async function isNameInUse(name) {
  const pkd = await PKD.deployed();
  return pkd.isNameInUse.call(bytes32(name));
}

export async function getAddressFromName(name) {
  const pkd = await PKD.deployed();
  return pkd.getAddressFromName.call(bytes32(name));
}

export async function getNameFromAddress(address) {
  const pkd = await PKD.deployed();
  return hexToUtf8(await pkd.getNameFromAddress.call(ensure0x(address)));
}

export async function getNames() {
  const pkd = await PKD.deployed();
  const names = await pkd.getNames.call();
  return names.map(name => hexToUtf8(name));
}

export async function getWhisperPublicKeyFromName(name) {
  const pkd = await PKD.deployed();
  return pkd.getWhisperPublicKeyFromName(bytes32(name));
}

export async function getWhisperPublicKeyFromAddress(address) {
  const pkd = await PKD.deployed();
  return pkd.getWhisperPublicKeyFromAddress.call(ensure0x(address));
}

export async function getZkpPublicKeyFromName(name) {
  const pkd = await PKD.deployed();
  return pkd.getZkpPublicKeyFromName(bytes32(name));
}

export async function getZkpPublicKeyFromAddress(address) {
  const pkd = await PKD.deployed();
  return pkd.getZkpPublicKeyFromAddress.call(ensure0x(address));
}

export async function getPublicKeysFromName(name) {
  const pkd = await PKD.deployed();
  return pkd.getPublicKeysFromName(bytes32(name));
}

export async function getNameFromZkpPublicKey(zkp) {
  const pkd = await PKD.deployed();
  return hexToUtf8(await pkd.getNameFromZkpPublicKey(zkp));
}

export async function getPublicKeysFromAddress(address) {
  const pkd = await PKD.deployed();
  return pkd.getPublicKeysFromAddress.call(ensure0x(address));
}

// set a name for the user (the smart contract enforces uniqueness)
export async function setName(name, address) {
  const pkd = await PKD.deployed();
  return pkd.setName(bytes32(name), { from: address, gas: 4000000 });
}

export async function setPublicKeys([whisperPublicKey, zkpPublicKey], account) {
  const pkd = await PKD.deployed();
  return pkd.setPublicKeys(whisperPublicKey, zkpPublicKey, { from: account });
}

export async function setWhisperPublicKey(wpk, address) {
  const pkd = await PKD.deployed();
  return pkd.setWhisperPublicKey(wpk, { from: address, gas: 4000000 });
}

export async function setZkpPublicKey(zpk, address) {
  const pkd = await PKD.deployed();
  return pkd.setZkpPublicKey(zpk, { from: address, gas: 4000000 });
}
