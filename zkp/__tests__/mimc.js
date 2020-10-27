import contract from 'truffle-contract';
import { mimcHash, ensure0x } from 'zkp-utils';
import { GN } from 'general-number';

import { getContractAddress, getContractInterface } from '../src/contractUtils';
import bc from '../src/web3';

if (process.env.HASH_TYPE === 'mimc') {
  let accounts;
  let contractInstance;
  beforeAll(async done => {
    if (!(await bc.isConnected())) await bc.connect();
    accounts = await (await bc.connection()).eth.getAccounts();

    const contractJson = await getContractInterface('FTokenShield');
    contractInstance = contract(contractJson);
    contractInstance.setProvider(bc.connect());

    const verifierAddress = await getContractAddress('Verifier');
    contractInstance = await contractInstance.new(verifierAddress, { from: accounts[0] });
    done();
  });

  const commitment1 = new GN('2').hex(32);
  const commitment2 = new GN('2').hex(32);

  // NOTE - the MerkleTree.sol tests will not work without a newly deployed shield contract
  describe('MiMC hash function tests', () => {
    test('HASH_TYPE should be set to MiMC', async () => {
      expect(process.env.HASH_TYPE).toEqual('mimc');
    });

    test('MiMC hash correctly returns the hash of "0x12345"', async () => {
      const msg = '0x005b570ac05e96f3d8d205138e9b5ee0371377117020468b0fa81419a0a007ae';
      const testHash = await contractInstance.mimcHash([msg], { from: accounts[1], gas: 4000000 });
      const hash = mimcHash([BigInt(msg)], 'ALT_BN_254')
        .toString(16)
        .padStart(64, '0');
      console.log('node', hash);
      console.log('shield contract', testHash);
      expect(ensure0x(hash)).toEqual(testHash);
    });

    test('MiMC hash correctly returns the hash of two commitments', async () => {
      const testConcatHash = await contractInstance.mimcHash([commitment1, commitment2], {
        from: accounts[1],
        gas: 4000000,
      });
      const concatHash = mimcHash([BigInt(commitment1), BigInt(commitment2)], 'ALT_BN_254')
        .toString(16)
        .padStart(64, '0');
      console.log('node', concatHash);
      console.log('shield contract', testConcatHash);
      expect(ensure0x(concatHash)).toEqual(testConcatHash);
    });

    // NB - below two tests require a fresh MerkleTree.sol

    test('MerkleTree.sol (via FTokenShield) correctly inserts two first leaves to Merkle Tree', async () => {
      const result = await contractInstance.insertLeaves([commitment1, commitment2], {
        from: accounts[1],
        gas: 4000000,
      });
      const newLeavesLog = result.logs.filter(log => {
        return log.event === 'NewLeaves';
      });
      const testlatestRoot = newLeavesLog[0].args.root;
      // console.log(result.logs[0].args);
      // console.log('no. of leaves:', result.logs[0].args);
      let _latestRoot = mimcHash([BigInt(commitment1), BigInt(commitment2)], 'ALT_BN_254')
        .toString(16)
        .padStart(64, '0'); // hash two newest leaves
      for (let i = 0; i < 31; i++) {
        // hash up the tree: 32-1 hashings to do
        _latestRoot = mimcHash([BigInt(ensure0x(_latestRoot)), BigInt('0')], 'ALT_BN_254')
          .toString(16)
          .padStart(64, '0');
      }
      console.log('Shield new root', testlatestRoot);
      console.log('MiMC new root', _latestRoot);
      expect(testlatestRoot).toEqual(ensure0x(_latestRoot));
    });

    test('MerkleTree.sol (via FTokenShield) correctly inserts a single new leaf to Merkle Tree', async () => {
      // do two above leaves stay in? -yes
      const newcommit = new GN('4').hex(32);
      const result = await contractInstance.insertLeaf(newcommit, {
        from: accounts[1],
        gas: 4000000,
      });
      const newLeafLog = result.logs.filter(log => {
        return log.event === 'NewLeaf';
      });
      const testnewlatestRoot = newLeafLog[0].args.root;
      const concatHash = mimcHash([BigInt(commitment1), BigInt(commitment2)], 'ALT_BN_254')
        .toString(16)
        .padStart(64, '0');
      const newcommithash = mimcHash([BigInt(newcommit), BigInt('0')], 'ALT_BN_254')
        .toString(16)
        .padStart(64, '0');
      let newlatestRoot = mimcHash(
        [BigInt(ensure0x(concatHash)), BigInt(ensure0x(newcommithash))],
        'ALT_BN_254',
      )
        .toString(16)
        .padStart(64, '0'); // hash newest leaf PLUS next layer up
      for (let i = 0; i < 30; i++) {
        // so 32-2 hashings to do
        newlatestRoot = mimcHash([BigInt(ensure0x(newlatestRoot)), BigInt('0')], 'ALT_BN_254')
          .toString(16)
          .padStart(64, '0');
      }
      console.log('Shield latest root', testnewlatestRoot);
      console.log('MiMC latest root', newlatestRoot);
      expect(testnewlatestRoot).toEqual(ensure0x(newlatestRoot));
    });
  });
} else {
  describe('MiMC hash function tests disabled', () => {
    test('HASH_TYPE env variable is set to `sha`', () => {
      expect(process.env.HASH_TYPE).toEqual('sha');
    });
  });
}
