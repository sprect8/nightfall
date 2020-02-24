const fs = require('fs');
/**
Force MerkleTree.sol to use chosen hashing
*/

console.log('Hash type is set to:', process.env.HASH_TYPE);
const codePath = './code/gm17/';
if (process.env.HASH_TYPE === 'sha') {
  fs.copyFileSync('./contracts/MerkleTreeSHA.sol', './contracts/MerkleTree.sol');
  if (fs.existsSync('./code/gm17/ft-consolidation-transfer')) {
    console.log(
      'Note that Zokrates files using MiMC hashing for root calculation already exist in Nightfall - they will not be replaced. Delete them and their directories if you want to replace them (e.g. if you have changed the hash type to sha).',
    );
  }
else {
    // creates directories so ./nightfall-generate-trusted-setup will point to the right place
    if (!fs.existsSync('./code/gm17')) {
      fs.mkdirSync('./code/gm17');
    }
  }
    fs.mkdirSync(`${codePath}ft-batch-transfer`);
    fs.mkdirSync(`${codePath}ft-burn`);
    fs.mkdirSync(`${codePath}ft-mint`);
    fs.mkdirSync(`${codePath}ft-transfer`);
    fs.mkdirSync(`${codePath}nft-burn`);
    fs.mkdirSync(`${codePath}nft-mint`);
    fs.mkdirSync(`${codePath}nft-transfer`);
  }


  // fsx.copySync('./code/gm17/common/sha', './code/gm17'); // pre nightlite code files
} else if (process.env.HASH_TYPE === 'mimc') {
  fs.copyFileSync('./contracts/MerkleTreeMiMC.sol', './contracts/MerkleTree.sol');
  if (fs.existsSync('./code/gm17/ft-consolidation-transfer')) {
    // Arbritrarily chosen ft-transfer
    console.log(
      'Note that Zokrates files using MiMC hashing for root calculation already exist in Nightfall - they will not be replaced. Delete them if you want to replace them (e.g. if you have changed the hash type).',
    );
  }
 else {
    // creates directories so ./nightfall-generate-trusted-setup will point to the right place
    if (!fs.existsSync('./code/gm17')) {
      fs.mkdirSync('./code/gm17');
    }
  }
    fs.mkdirSync(`${codePath}ft-batch-transfer`);
    fs.mkdirSync(`${codePath}ft-burn`);
    fs.mkdirSync(`${codePath}ft-consolidation-transfer`);
    fs.mkdirSync(`${codePath}ft-mint`);
    fs.mkdirSync(`${codePath}ft-transfer`);
    fs.mkdirSync(`${codePath}nft-burn`);
    fs.mkdirSync(`${codePath}nft-mint`);
    fs.mkdirSync(`${codePath}nft-transfer`);
  } 


  // fsx.copySync('./code/gm17/common/mimc', './code/gm17'); //pre nightlite code files
}
