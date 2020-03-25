import express from 'express';
import {
  newAccount,
  transferEtherToAccount,
  getBalance,
  unlockAccount,
} from '../services/accounts';

const router = express.Router({ mergeParams: true });

/**
 * This function is to create an account
 * req.body : {
 *    "password":"b"
 * }
 *
 * res.data : "0x48fB6f41fF365C8FE4450ED294876Dfa664F0416"
 *
 * @param {*} req
 * @param {*} res
 */
async function createAccount(req, res, next) {
  const { password } = req.body;
  try {
    const address = await newAccount(password);
    if (password) {
      await transferEtherToAccount(address);
    }
    res.data = address;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * This function is to get accout balance
 * @param {*} req
 * @param {*} res
 */
async function getAccountBalance(req, res, next) {
  const { accountAddress } = req.query;
  const balance = await getBalance(accountAddress);
  res.data = balance;
  next();
}

/**
 * This function is to transfer ether to an account
 * @param {*} req
 * @param {*} res
 */
async function transferEther(req, res, next) {
  const { from, amount, address } = req.body;
  try {
    const txHash = await transferEtherToAccount(address, from, amount);
    res.data = txHash;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * This function is to unloack an account
 * req.body : {
 *    "address":"0x48fB6f41fF365C8FE4450ED294876Dfa664F0416",
 *    "password":"b"
 * }
 *
 * res.data : {
 *    "message":"Unlocked"
 * }
 *
 * @param {*} req
 * @param {*} res
 */
async function unlockUserAccount(req, res, next) {
  const { address, password } = req.body;

  try {
    await unlockAccount(address, password);
    res.data = { message: 'Unlocked' };
    next();
  } catch (err) {
    next(err);
  }
}

router.post('/createAccount', createAccount);
router.get('/getAccountBalance', getAccountBalance);
router.post('/unlockAccount', unlockUserAccount);
router.post('/transferEther', transferEther);

export default router;
