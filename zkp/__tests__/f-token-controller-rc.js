/* eslint-disable import/no-unresolved */

import { erc20, elgamal } from '@eyblockchain/nightlite';
import utils from 'nightlite-utils';

import Web3 from '../src/web3';
import controller from '../src/f-token-controller';
import { getTruffleContractInstance, getContractAddress } from '../src/contractUtils';
// import { setAuthorityPrivateKeys, rangeGenerator } from '../src/el-gamal';

const web3 = Web3.connection();
const amountC = '0x00000000000000000000000000000020'; // 128 bits = 16 bytes = 32 chars
const amountD = '0x00000000000000000000000000000030';
const amountE = '0x00000000000000000000000000000040';
const amountF = '0x00000000000000000000000000000010'; // don't forget to make C+D=E+F
const amountG = '0x00000000000000000000000000000030';
const amountH = '0x00000000000000000000000000000020'; // these constants used to enable a second transfer
const amountI = '0x00000000000000000000000000000050';
const secretKeyA = '0x1111111111111111111111111111111111111111111111111111111111111111';
const secretKeyB = '0x2222222222222222222222222222222222222222222222222222222222222222';
let saltAliceC;
let saltAliceD;
let saltAliceToBobE;
let saltAliceToAliceF;
let publicKeyA;
let publicKeyB;
const publicKeyE = '0x1111111111111111111111111111111111111111111111111111111111111112';
let commitmentAliceC;
let commitmentAliceD;
let saltBobG;
let saltBobToEveH;
let saltBobToBobI;
let commitmentBobG;
let commitmentBobE;
let commitmentAliceF;
// storage for z indexes
let zInd1;
let zInd2;
let zInd3;

let accounts;
let fTokenShieldAddress;
let fTokenShieldInstance;
let erc20Address;
if (process.env.COMPLIANCE === 'true') {
  beforeAll(async () => {
    elgamal.setAuthorityPrivateKeys(); // setup test keys
    accounts = await web3.eth.getAccounts();
    console.log('Number of test accounts', accounts.length);
    const { contractInstance } = await getTruffleContractInstance('FTokenShield');
    fTokenShieldAddress = contractInstance.address;
    fTokenShieldInstance = contractInstance;

    erc20Address = await getContractAddress('FToken');
    const erc20AddressPadded = `0x${utils.strip0x(erc20Address).padStart(64, '0')}`;

    // blockchainOptions = { account, fTokenShieldJson, fTokenShieldAddress };
    saltAliceC = await utils.randomHex(32);
    saltAliceD = await utils.randomHex(32);
    saltAliceToBobE = await utils.randomHex(32);
    saltAliceToAliceF = await utils.randomHex(32);
    // publicKeyA = utils.ensure0x(utils.strip0x(utils.hash(secretKeyA)).padStart(32, '0'));
    publicKeyA = utils.shaHash(utils.strip0x(secretKeyA));
    publicKeyB = utils.shaHash(utils.strip0x(secretKeyB));
    commitmentAliceC = utils.shaHash(
      utils.strip0x(erc20AddressPadded),
      utils.strip0x(amountC),
      utils.strip0x(publicKeyA),
      utils.strip0x(saltAliceC),
    );
    commitmentAliceD = utils.shaHash(
      utils.strip0x(erc20AddressPadded),
      utils.strip0x(amountD),
      utils.strip0x(publicKeyA),
      utils.strip0x(saltAliceD),
    );
    saltBobG = await utils.randomHex(32);
    saltBobToEveH = await utils.randomHex(32);
    saltBobToBobI = await utils.randomHex(32);
    commitmentBobG = utils.shaHash(erc20AddressPadded, amountG, publicKeyB, saltBobG);
    commitmentBobE = utils.shaHash(
      utils.strip0x(erc20AddressPadded),
      utils.strip0x(amountE),
      utils.strip0x(publicKeyB),
      utils.strip0x(saltAliceToBobE),
    );
    commitmentAliceF = utils.shaHash(
      utils.strip0x(erc20AddressPadded),
      utils.strip0x(amountF),
      utils.strip0x(publicKeyA),
      utils.strip0x(saltAliceToAliceF),
    );
    fTokenShieldInstance.setRootPruningInterval(100, {
      from: accounts[0],
      gas: 6500000,
      gasPrice: 20000000000,
    });
    fTokenShieldInstance.setCompressedAdminPublicKeys(
      elgamal.AUTHORITY_PUBLIC_KEYS.map(pt => elgamal.edwardsCompress(pt)),
      {
        from: accounts[0],
        gas: 6500000,
        gasPrice: 20000000000,
      },
    );
  });

  // eslint-disable-next-line no-undef
  describe('f-token-controller.js tests', () => {
    // Alice has C + D to start total = 50 ETH
    // Alice sends Bob E and gets F back (Bob has 40 ETH, Alice has 10 ETH)
    // Bob then has E+G at total of 70 ETH
    // Bob sends H to Alice and keeps I (Bob has 50 ETH and Alice has 10+20=30 ETH)
    let transferTxReceipt;
    let burnTxReceipt;

    test('Should create 10000 tokens in accounts[0] and accounts[1]', async () => {
      // fund some accounts with FToken
      const AMOUNT = 10000;
      const bal1 = await controller.getBalance(accounts[0]);
      await controller.buyFToken(AMOUNT, accounts[0]);
      await controller.buyFToken(AMOUNT, accounts[1]);
      const bal2 = await controller.getBalance(accounts[0]);
      expect(AMOUNT).toEqual(bal2 - bal1);
    });

    test('Should move 1 ERC-20 token from accounts[0] to accounts[1]', async () => {
      const AMOUNT = 1;
      const bal1 = await controller.getBalance(accounts[0]);
      const bal3 = await controller.getBalance(accounts[1]);
      await controller.transferFToken(AMOUNT, accounts[0], accounts[1]);
      const bal2 = await controller.getBalance(accounts[0]);
      const bal4 = await controller.getBalance(accounts[1]);
      expect(AMOUNT).toEqual(bal1 - bal2);
      expect(AMOUNT).toEqual(bal4 - bal3);
    });

    test('Should burn 1 ERC-20 from accounts[1]', async () => {
      const AMOUNT = 1;
      const bal1 = await controller.getBalance(accounts[1]);
      await controller.burnFToken(AMOUNT, accounts[1]);
      const bal2 = await controller.getBalance(accounts[1]);
      expect(AMOUNT).toEqual(bal1 - bal2);
    });

    test('Should get the ERC-20 metadata', async () => {
      const { symbol, name } = await controller.getTokenInfo(accounts[0]);
      expect('OPS').toEqual(symbol);
      expect('EY OpsCoin').toEqual(name);
    });

    test('Should mint an ERC-20 commitment commitmentAliceC for Alice for asset C', async () => {
      expect.assertions(1);
      console.log('Alices account ', (await controller.getBalance(accounts[0])).toNumber());
      const { commitment: zTest, commitmentIndex: zIndex } = await erc20.mint(
        amountC,
        publicKeyA,
        saltAliceC,
        {
          erc20Address,
          account: accounts[0],
          fTokenShieldAddress,
        },
        {
          codePath: `${process.cwd()}/code/gm17/ft-mint/out`,
          outputDirectory: `${process.cwd()}/code/gm17/ft-mint`,
          pkPath: `${process.cwd()}/code/gm17/ft-mint/proving.key`,
        },
      );
      zInd1 = parseInt(zIndex, 10);
      expect(commitmentAliceC).toEqual(zTest);
      console.log(`Alice's account `, (await controller.getBalance(accounts[0])).toNumber());
    });

    test('Should mint another ERC-20 commitment commitmentAliceD for Alice for asset D', async () => {
      expect.assertions(1);
      const { commitment: zTest, commitmentIndex: zIndex } = await erc20.mint(
        amountD,
        publicKeyA,
        saltAliceD,
        {
          erc20Address,
          account: accounts[0],
          fTokenShieldAddress,
        },
        {
          codePath: `${process.cwd()}/code/gm17/ft-mint/out`,
          outputDirectory: `${process.cwd()}/code/gm17/ft-mint`,
          pkPath: `${process.cwd()}/code/gm17/ft-mint/proving.key`,
        },
      );
      zInd2 = parseInt(zIndex, 10);
      expect(commitmentAliceD).toEqual(zTest);
      console.log(`Alice's account `, (await controller.getBalance(accounts[0])).toNumber());
    });

    test("Should fail to transfer a ERC-20 commitment to Bob because he's not registered yet)", async () => {
      // E becomes Bob's, F is change returned to Alice
      expect.assertions(1);
      try {
        const inputCommitments = [
          {
            value: amountC,
            salt: saltAliceC,
            commitment: commitmentAliceC,
            commitmentIndex: zInd1,
          },
          {
            value: amountD,
            salt: saltAliceD,
            commitment: commitmentAliceD,
            commitmentIndex: zInd2,
          },
        ];
        const outputCommitments = [
          { value: amountE, salt: saltAliceToBobE },
          { value: amountF, salt: saltAliceToAliceF },
        ];
        ({ txReceipt: transferTxReceipt } = await erc20.transfer(
          inputCommitments,
          outputCommitments,
          publicKeyB,
          secretKeyA,
          {
            erc20Address,
            account: accounts[0],
            fTokenShieldAddress,
          },
          {
            codePath: `${process.cwd()}/code/gm17/ft-transfer/out`,
            outputDirectory: `${process.cwd()}/code/gm17/ft-transfer`,
            pkPath: `${process.cwd()}/code/gm17/ft-transfer/proving.key`,
          },
        ));
      } catch (err) {
        expect(err).toEqual(expect.anything());
        // register Bob so this test passes when we try to run it again
        console.log(err);
      }
    });

    test("Should register bob's and Eve's public keys", async () => {
      await fTokenShieldInstance.checkUser(publicKeyB, {
        from: accounts[1],
        gas: 6500000,
        gasPrice: 20000000000,
      });
      await fTokenShieldInstance.checkUser(publicKeyE, {
        from: accounts[3],
        gas: 6500000,
        gasPrice: 20000000000,
      });
    });

    test('Should transfer a ERC-20 commitment to Bob (two coins get nullified, two created; one coin goes to Bob, the other goes back to Alice as change)', async () => {
      // E becomes Bob's, F is change returned to Alice
      const inputCommitments = [
        { value: amountC, salt: saltAliceC, commitment: commitmentAliceC, commitmentIndex: zInd1 },
        { value: amountD, salt: saltAliceD, commitment: commitmentAliceD, commitmentIndex: zInd2 },
      ];
      const outputCommitments = [
        { value: amountE, salt: saltAliceToBobE },
        { value: amountF, salt: saltAliceToAliceF },
      ];
      ({ txReceipt: transferTxReceipt } = await erc20.transfer(
        inputCommitments,
        outputCommitments,
        publicKeyB,
        secretKeyA,
        {
          erc20Address,
          account: accounts[0],
          fTokenShieldAddress,
        },
        {
          codePath: `${process.cwd()}/code/gm17/ft-transfer/out`,
          outputDirectory: `${process.cwd()}/code/gm17/ft-transfer`,
          pkPath: `${process.cwd()}/code/gm17/ft-transfer/proving.key`,
        },
      ));
      // now Bob should have 40 (E) ETH
    });

    test('Should mint another ERC-20 commitment commitmentBobG for Bob for asset G', async () => {
      expect.assertions(1);
      const { commitment: zTest, commitmentIndex: zIndex } = await erc20.mint(
        amountG,
        publicKeyB,
        saltBobG,
        {
          erc20Address,
          account: accounts[1],
          fTokenShieldAddress,
        },
        {
          codePath: `${process.cwd()}/code/gm17/ft-mint/out`,
          outputDirectory: `${process.cwd()}/code/gm17/ft-mint`,
          pkPath: `${process.cwd()}/code/gm17/ft-mint/proving.key`,
        },
      );
      zInd3 = parseInt(zIndex, 10);
      expect(commitmentBobG).toEqual(zTest);
    });

    test("Should have three public key roots stored (from addition of Alice's then Bob's and Eve's keys)", async () => {
      expect.assertions(2);
      let root = await fTokenShieldInstance.currentPublicKeyRoot.call();
      let rootCount = 0;
      const publicKeyRootComputations = await fTokenShieldInstance.publicKeyRootComputations.call();
      while (BigInt(root) !== BigInt(0)) {
        const publicKeyRoot = await fTokenShieldInstance.publicKeyRoots.call(root); // eslint-disable-line no-await-in-loop
        rootCount++;
        root = publicKeyRoot;
      }
      rootCount--;
      expect(rootCount).toEqual(3);
      expect(publicKeyRootComputations.toNumber()).toEqual(3);
    });

    test(`Should blacklist Bob so he can't transfer an ERC-20 commitment to Eve`, async () => {
      expect.assertions(1);
      await fTokenShieldInstance.blacklistAddress(accounts[1], {
        from: accounts[0],
        gas: 6500000,
        gasPrice: 20000000000,
      });

      // H becomes Eve's, I is change returned to Bob
      const inputCommitments = [
        {
          value: amountE,
          salt: saltAliceToBobE,
          commitment: commitmentBobE,
          commitmentIndex: zInd1 + 2,
        },
        {
          value: amountG,
          salt: saltBobG,
          commitment: commitmentBobG,
          commitmentIndex: zInd3,
        },
      ];
      const outputCommitments = [
        { value: amountH, salt: saltBobToEveH },
        { value: amountI, salt: saltBobToBobI },
      ];
      expect.assertions(1);
      try {
        await erc20.transfer(
          inputCommitments,
          outputCommitments,
          publicKeyE,
          secretKeyB,
          {
            erc20Address,
            account: accounts[1],
            fTokenShieldAddress,
          },
          {
            codePath: `${process.cwd()}/code/gm17/ft-transfer/out`,
            outputDirectory: `${process.cwd()}/code/gm17/ft-transfer`,
            pkPath: `${process.cwd()}/code/gm17/ft-transfer/proving.key`,
          },
        );
      } catch (e) {
        expect(e).toEqual(expect.anything());
        console.log(e);
      }
    });

    test(`Should unblacklist Bob so he can transfer an ERC-20 commitment to Eve`, async () => {
      await fTokenShieldInstance.unBlacklistAddress(accounts[1], {
        from: accounts[0],
        gas: 6500000,
        gasPrice: 20000000000,
      });

      // H becomes Eve's, I is change returned to Bob
      const inputCommitments = [
        {
          value: amountE,
          salt: saltAliceToBobE,
          commitment: commitmentBobE,
          commitmentIndex: zInd1 + 2,
        },
        {
          value: amountG,
          salt: saltBobG,
          commitment: commitmentBobG,
          commitmentIndex: zInd3,
        },
      ];
      const outputCommitments = [
        { value: amountH, salt: saltBobToEveH },
        { value: amountI, salt: saltBobToBobI },
      ];

      await erc20.transfer(
        inputCommitments,
        outputCommitments,
        publicKeyE,
        secretKeyB,
        {
          erc20Address,
          account: accounts[1],
          fTokenShieldAddress,
        },
        {
          codePath: `${process.cwd()}/code/gm17/ft-transfer/out`,
          outputDirectory: `${process.cwd()}/code/gm17/ft-transfer`,
          pkPath: `${process.cwd()}/code/gm17/ft-transfer/proving.key`,
        },
      );
    });

    test("Should have two roots stored (latest root when Bob was blacklisted and additon of Bob's re-enabled key)", async () => {
      expect.assertions(2);
      let root = await fTokenShieldInstance.currentPublicKeyRoot.call();
      let rootCount = 0;
      const publicKeyRootComputations = await fTokenShieldInstance.publicKeyRootComputations.call();
      while (BigInt(root) !== BigInt(0)) {
        const publicKeyRoot = await fTokenShieldInstance.publicKeyRoots.call(root); // eslint-disable-line no-await-in-loop
        rootCount++;
        root = publicKeyRoot;
      }
      rootCount--;
      expect(rootCount).toEqual(2);
      expect(publicKeyRootComputations.toNumber()).toEqual(2);
    });

    test(`Should burn Alice's remaining ERC-20 commitment (to Eve)`, async () => {
      expect.assertions(1);
      const bal1 = await controller.getBalance(accounts[3]);
      const bal = await controller.getBalance(accounts[0]);
      console.log('accounts[3]', bal1.toNumber());
      console.log('accounts[0]', bal.toNumber());
      ({ txReceipt: burnTxReceipt } = await erc20.burn(
        amountF,
        secretKeyA,
        saltAliceToAliceF,
        commitmentAliceF,
        zInd2 + 2,
        {
          erc20Address,
          account: accounts[0],
          tokenReceiver: accounts[3],
          fTokenShieldAddress,
        },
        {
          codePath: `${process.cwd()}/code/gm17/ft-burn/out`,
          outputDirectory: `${process.cwd()}/code/gm17/ft-burn`,
          pkPath: `${process.cwd()}/code/gm17/ft-burn/proving.key`,
        },
      ));
      const bal2 = await controller.getBalance(accounts[3]);
      console.log('accounts[3]', bal2.toNumber());
      expect(parseInt(amountF, 16)).toEqual(bal2 - bal1);
    });

    test(`Should decrypt Alice's Transfer commitment to Bob`, () => {
      expect.assertions(3);
      const decrypt = erc20.decryptTransaction(transferTxReceipt, {
        type: 'TransferRC',
        guessers: [
          elgamal.rangeGenerator(1000000),
          [publicKeyA, publicKeyB, publicKeyE],
          [publicKeyA, publicKeyB, publicKeyE],
        ],
      });
      expect(BigInt(decrypt[0])).toEqual(BigInt(amountE));
      expect(decrypt[1]).toMatch(publicKeyA);
      expect(decrypt[2]).toMatch(publicKeyB);
    });

    test(`Should decrypt Alice's Burn commitment`, () => {
      expect.assertions(1);
      const decrypt = erc20.decryptTransaction(burnTxReceipt, {
        type: 'BurnRC',
        guessers: [[publicKeyA, publicKeyB, publicKeyE]],
      });
      expect(decrypt[0]).toMatch(publicKeyA);
    });

    test('Should register 106 new users', async () => {
      const userPromises = [];
      const zkpPublicKeysPromises = [];
      // generate some public keys
      for (let i = 0; i < accounts.length; i++) zkpPublicKeysPromises.push(utils.randomHex(32));
      const zkpPublicKeys = await Promise.all(zkpPublicKeysPromises);
      // try to register the new keys with accounts (ignore Alice's and Bob's accounts)
      for (let i = 4; i < accounts.length; i++) {
        userPromises.push(
          fTokenShieldInstance.checkUser(zkpPublicKeys[i], {
            from: accounts[i],
            gas: 6500000,
            gasPrice: 20000000000,
          }),
        );
      }
      await Promise.all(userPromises);
    });

    test('After 108 root computations we should still have only 100 roots stored due to pruning of oldest root', async () => {
      expect.assertions(2);
      let root = await fTokenShieldInstance.currentPublicKeyRoot.call();
      let rootCount = 0;
      const publicKeyRootComputations = await fTokenShieldInstance.publicKeyRootComputations.call();
      while (BigInt(root) !== BigInt(0)) {
        const publicKeyRoot = await fTokenShieldInstance.publicKeyRoots.call(root); // eslint-disable-line no-await-in-loop
        rootCount++;
        root = publicKeyRoot;
      }
      rootCount--;
      expect(rootCount).toEqual(100);
      expect(publicKeyRootComputations.toNumber()).toEqual(108);
    });

    test('Alice and Bob are already registered, so attempting to register them again with a different ZKP public key should fail', async () => {
      expect.assertions(1);
      try {
        await fTokenShieldInstance.checkUser(await utils.randomHex(32), {
          from: accounts[0],
          gas: 6500000,
          gasPrice: 20000000000,
        });
        await fTokenShieldInstance.checkUser(await utils.randomHex(32), {
          from: accounts[0],
          gas: 6500000,
          gasPrice: 20000000000,
        });
      } catch (err) {
        expect(err).toEqual(expect.anything());
      }
    });
  });
} else {
  describe('Compliance-mode fungible tests disabled', () => {
    test('COMPLIANCE env variable is not set to `true`', () => {
      expect(process.env.COMPLIANCE).not.toEqual('true');
    });
  });
}
