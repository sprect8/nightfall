/** ***************************************************************************
 * Presents an API which can be used to control Ethereum account creation
 *
 * version 0.0.1
 **************************************************************************** */

import Web3 from '../web3';

const accounts = [
  "0xda7bbd3f9120fc010b81603dae88612b5aa551b0417f57643aeb458cd19d8ccb",
  "0x89df02eec8119fc1983b3d214fc0f2580676d6029fa81ea544f1a0672366cfca",
  "0xfcc9c5cbe1b9d0c76d725e8a3fd773a8bf5fefd8a92fef547bdfe35782319a78",
  "0xbc696d9be5af89ff3389f2517b419dea6928054997ddf231791c38783a8e86f0",
  "0xc87509a1c067bbde78beb793e6fa76530b6382a4c0241e5e4a9ec0a0f44dc0d3",
  "0x00aedc621fa89a6e1332d4f67b9b843b675c540fbfbee07bb692482ba71316cd",
  "0xf12491fe2adcca656cd02c0b97659cbfd01d2cb987cf30e69ce0c71a98095e9f",
  "0xd8b2ae51f15df1d9304cbcd7fabbbb8a277003eabac007b08c7f69edcdc079e0",
  "0x8417a78e079e3ef6e6f43bd904d579276f664d4408b18c1a8617c43ab79a3b3e",
  "0x741dc271874bde7cc5579505d625daa823c2d932ea2941cb55269740cb2babbc"
];
let idx = 0;

/**
 * Returns ether balance of an account
 * @param {*} address - address of the account
 */
export async function getBalance(address) {
  const web3 = Web3.connection();
  const balance = await web3.eth.getBalance(address);
  return web3.utils.fromWei(balance, 'ether').toString();
}

/**
 * Creates an account in blockchain
 * @param {*} password - password to create account in blockchain
 */
export function newAccount(password) {
  const web3 = Web3.connection();
  // return web3.eth.personal.newAccount(password);
    // return web3.eth.personal.newAccount(password);
    const account = accounts[idx];
    idx++;
    idx = idx % accounts.length;
  
    console.log("Creating account", idx, account);
  
    return web3.eth.accounts.privateKeyToAccount(account).address; //importRawKey(accounts.pop(), password);
  
}

/**
 * This method will unlock an account to sign transaction
 * @param {*} account - address of the account
 * @param {*} password - password of the account
 */
export function unlockAccount(account, password) {
  // const web3 = Web3.connection();
  // return web3.eth.personal.unlockAccount(account, password, 0);
  console.log("Unlocking account");
  return Promise.resolve();
}

/**
 * Sends ether from coinbase to account
 * @param {*} to - to address
 * @param {*} from - from address
 * @param {*} amount - amount of ether
 */
export async function transferEtherToAccount(to, from, amount) {
  // const web3 = Web3.connection();
  // const coinbase = from || (await getCoinbaseAddress());
  // const value = amount || 2000000000000000000;
  // return web3.eth.sendTransaction({
  //   from: coinbase,
  //   to,
  //   value,
  //   gas: 3000000,
  //   gasPrice: 20000000000,
  // });
    // const web3 = Web3.connection();
  // const coinbase = from || (await web3.eth.getCoinbase());
  // const value = amount || 2000000000000000000;
  // return web3.eth.sendTransaction({
  //   from: coinbase,
  //   to,
  //   value,
  //   gas: 3000000,
  //   gasPrice: 20000000000,
  // });

  const web3 = Web3.connection();
  const coinbase = from || (web3.eth.accounts.privateKeyToAccount("0xbc696d9be5af89ff3389f2517b419dea6928054997ddf231791c38783a8e86f0").address);
  const value = amount || 1000000000000000000;
  console.log(coinbase, to);
  return web3.eth.sendTransaction({
    from: coinbase,
    to,
    value,
    gas: 3000000,
    gasPrice: 20000000000,
  });
}

export async function getCoinbaseAddress() {
  const web3 = Web3.connection();
  
  return web3.eth.getCoinbase() || web3.eth.defaultAccount;
}
