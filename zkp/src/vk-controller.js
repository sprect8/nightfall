/**
 * @module vk-controller.js
 * @author iAmMichaelConnor
 * @desc this acts as a layer of logic between the restapi.js, which lands the
 * rest api calls, and the heavy-lifitng token-zkp.js and zokrates.js.  It exists so that the amount of logic in restapi.js is absolutely minimised.
 */

import config from 'config';
import { vks } from '@eyblockchain/nightlite';
import Web3 from './web3';
import { getContractInterface, getWeb3ContractInstance } from './contractUtils';

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

/**
 * Loads VKs to the VkRegistry (Shield contracts)
 * @param {string} shieldContractName The vkRegistry is just the contract which stores the verification keys. In our case, that's the FTokenShield.sol and NFTokenShield.sol contracts.
 */
async function initializeVks(shieldContractName) {
  await Web3.waitTillConnected();
  const web3 = Web3.connection();
  const accounts = await web3.eth.getAccounts();
  const account = accounts[0] || web3.eth.defaultAccount;
  console.log("Account is", account, accounts);

  // Get vkRegistry contract details. The vkRegistry is just the contract which stores the verification keys. In our case, that's the FTokenShield.sol and NFTokenShield.sol contracts.
  const shieldJson = getContractInterface(shieldContractName);
  const shieldContract = await getWeb3ContractInstance(shieldContractName);

  const blockchainOptions = {
    shieldJson,
    shieldAddress: shieldContract._address, // eslint-disable-line no-underscore-dangle
    account,
  };

  // Load VK to the vkRegistry
  const vkPaths = config.VK_PATHS[shieldContractName];
  const vkDescriptions = Object.keys(vkPaths);
  
  try {
    // await Promise.all(
    //   vkDescriptions.map(vkDescription => {
    //     console.log("Processing", vkDescription);
    //     return vks.loadVk(vkDescription, vkPaths[vkDescription], blockchainOptions);
    //   }),
    // );
    await asyncForEach(vkDescriptions, async (vkDescription) => {
      await vks.loadVk(vkDescription, vkPaths[vkDescription], blockchainOptions);
    });
    console.log("All vks registration is done");
  } catch (err) {
    throw new Error(`Error while loading VKs: ${err.message}`);
  }
}

async function runController() {
  await initializeVks('FTokenShield');
  await initializeVks('NFTokenShield');
}

export default {
  runController,
};
