/**
@module f-token-zkp.js
@author Westlad, iAmMichaelConnor
@desc This code interacts with the blockchain to mint, transfer and burn an f token commitment.
It talks to FTokenShield.sol and you need to give it aninstance of that contract
before it will work. This version works by transforming an existing commitment to a
new one, which enables sending of arbritrary amounts. The code also talks directly to Verifier.
*/

import { merkleTree } from '@eyblockchain/nightlite';
import utils from './zkpUtils';
import logger from './logger';

/**
checks the details of an incoming (newly transferred token), to ensure the data we have received is correct and legitimate!!
*/
async function checkCorrectness(
  erc20Address,
  value,
  publicKey,
  salt,
  commitment,
  commitmentIndex,
  blockNumber,
  fTokenShield,
) {
  logger.info('Checking h(contractAddress|value|publicKey|salt) = z...');
  const commitmentCheck = utils.concatenateThenHash(
    `0x${utils.strip0x(erc20Address).padStart(64, '0')}`,
    value,
    publicKey,
    salt,
  );
  const zCorrect = commitmentCheck === commitment;
  logger.info('commitment:', commitment);
  logger.info('commitmentCheck:', commitmentCheck);

  logger.info(
    'Checking the commitment exists in the merkle-tree db (and therefore was emitted as an event on-chain)...',
  );
  logger.info('commitment:', commitment);
  logger.info('commitmentIndex:', commitmentIndex);
  const { contractName } = fTokenShield.constructor._json; // eslint-disable-line no-underscore-dangle

  // query the merkle-tree microservice until it's filtered the blockNumber we wish to query:
  await merkleTree.waitForBlockNumber(contractName, blockNumber);

  const leaf = await merkleTree.getLeafByLeafIndex(contractName, commitmentIndex);
  logger.info('leaf found:', leaf);
  if (leaf.value !== commitment)
    throw new Error(
      `Could not find commitment ${commitment} at the given commitmentIndex ${commitmentIndex} in  the merkle-tree microservice. Found ${leaf.value} instead.`,
    );

  const zOnchainCorrect = leaf.value === commitment;
  logger.info('commitment:', commitment);
  logger.info('commitment emmitted by blockchain:', leaf.value);

  return {
    zCorrect,
    zOnchainCorrect,
  };
}

export default {
  checkCorrectness,
};
