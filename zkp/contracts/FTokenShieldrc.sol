/**
Contract to enable the management of private fungible token (ERC-20) transactions using zk-SNARKs.
@Author Westlad, Chaitanya-Konda, iAmMichaelConnor
*/

pragma solidity ^0.5.8;

import "./Ownable.sol";
import "./MerkleTree.sol";
import "./Verifier_Interface.sol";
import "./ERC20Interface.sol";
import "./PublicKeyTree.sol";

contract FTokenShield is Ownable, MerkleTree, PublicKeyTree {
  // ENUMS:
  enum TransactionTypes { Mint, Transfer, Burn, SimpleBatchTransfer }

  // EVENTS:
  // Observers may wish to listen for nullification of commitments:
  event Transfer(bytes32[] publicInputs);
  event SimpleBatchTransfer(bytes32 nullifier);
  event Burn(bytes32[] publicInputs);

  // Observers may wish to listen for zkSNARK-related changes:
  event VerifierChanged(address newVerifierContract);
  event VkChanged(TransactionTypes txType);

  // For testing only. This SHOULD be deleted before mainnet deployment:
  event GasUsed(uint256 byShieldContract, uint256 byVerifierContract);

  // CONTRACT INSTANCES:
  Verifier_Interface private verifier; // the verification smart contract
  ERC20Interface private fToken; // the  ERC-20 token contract

  // PRIVATE TRANSACTIONS' PUBLIC STATES:
  mapping(bytes32 => bytes32) public nullifiers; // store nullifiers of spent commitments
  mapping(bytes32 => bytes32) public roots; // holds each root we've calculated so that we can pull the one relevant to the prover
  bytes32 public latestRoot; // holds the index for the latest root so that the prover can provide it later and this contract can look up the relevant root

  // VERIFICATION KEY STORAGE:
  mapping(uint => uint256[]) public vks; // mapped to by an enum uint(TransactionTypes):

  // FUNCTIONS:
  constructor(address _verifier, address _fToken) public {
      _owner = msg.sender;
      verifier = Verifier_Interface(_verifier);
      fToken = ERC20Interface(_fToken);
  }

  /**
  self destruct
  */
  function close() external onlyOwner {
      selfdestruct(address(uint160(_owner)));
  }

  /**
  function to change the address of the underlying Verifier contract
  */
  function changeVerifier(address _verifier) external onlyOwner {
      verifier = Verifier_Interface(_verifier);
      emit VerifierChanged(_verifier);
  }

  /**
  returns the verifier-interface contract address that this shield contract is calling
  */
  function getVerifier() public view returns (address) {
      return address(verifier);
  }

  /**
  returns the ERC-20 contract address that this shield contract is calling
  */
  function getFToken() public view returns (address) {
    return address(fToken);
  }

  /**
  Stores verification keys (for the 'mint', 'transfer' and 'burn' computations).
  */
  function registerVerificationKey(uint256[] calldata _vk, TransactionTypes _txType) external onlyOwner returns (bytes32) {
      // CAUTION: we do not prevent overwrites of vk's. Users must listen for the emitted event to detect updates to a vk.
      vks[uint(_txType)] = _vk;

      emit VkChanged(_txType);
  }

  /**
  The mint function accepts fungible tokens from the specified fToken ERC-20 contract and creates the same amount as a commitment.
  */
  function mint(uint256[] calldata _proof, uint256[] calldata _inputs, uint128 _value, bytes32 _commitment, bytes32 zkpPublicKey) external {

      // gas measurement:
      uint256 gasCheckpoint = gasleft();

      // Check that the publicInputHash equals the hash of the 'public inputs':
      bytes31 publicInputHash = bytes31(bytes32(_inputs[0]) << 8);
      bytes31 publicInputHashCheck = bytes31(sha256(abi.encodePacked(uint128(_value), _commitment, zkpPublicKey)) << 8); // Note that we force the _value to be left-padded with zeros to fill 128-bits, so as to match the padding in the hash calculation performed within the zokrates proof.
      require(publicInputHashCheck == publicInputHash, "publicInputHash cannot be reconciled");

      // Check that we're not blacklisted and, if not, add us to the public key Merkle tree
      if (keyLookup[msg.sender] == 0) {
        keyLookup[msg.sender] = zkpPublicKey; // add unknown user to key lookup
        addPublicKeyToTree(zkpPublicKey); // update the Merkle tree with the new leaf
      }
      require (keyLookup[msg.sender] == zkpPublicKey, "The ZKP public key has not been registered to this address");
      require (blacklist[msg.sender] == 0, "This address is blacklisted - transaction stopped");

      // gas measurement:
      uint256 gasUsedByShieldContract = gasCheckpoint - gasleft();
      gasCheckpoint = gasleft();

      // verify the proof
      bool result = verifier.verify(_proof, _inputs, vks[uint(TransactionTypes.Mint)]);
      require(result, "The proof has not been verified by the contract");

      // gas measurement:
      uint256 gasUsedByVerifierContract = gasCheckpoint - gasleft();
      gasCheckpoint = gasleft();

      // update contract states
      latestRoot = insertLeaf(_commitment); // recalculate the root of the merkleTree as it's now different
      roots[latestRoot] = latestRoot; // and save the new root to the list of roots

      // Finally, transfer the fTokens from the sender to this contract
      fToken.transferFrom(msg.sender, address(this), _value);

      // gas measurement:
      gasUsedByShieldContract = gasUsedByShieldContract + gasCheckpoint - gasleft();
      emit GasUsed(gasUsedByShieldContract, gasUsedByVerifierContract);
  }

  /**
  The transfer function transfers a commitment to a new owner
  */
  function transfer(uint256[] calldata _proof, uint256[] calldata _inputs, bytes32[] calldata publicInputs) external {

      // gas measurement:
      uint256[3] memory gasUsed; // array needed to stay below local stack limit
      gasUsed[0] = gasleft();

      // Check that the publicInputHash equals the hash of the 'public inputs':
      bytes31 publicInputHash = bytes31(bytes32(_inputs[0]) << 8);
      bytes31 publicInputHashCheck = bytes31(sha256(abi.encodePacked(publicInputs)) << 8);
      require(publicInputHashCheck == publicInputHash, "publicInputHash cannot be reconciled");

      // gas measurement:
      gasUsed[1] = gasUsed[0] - gasleft();
      gasUsed[0] = gasleft();

      // verify the proof
      bool result = verifier.verify(_proof, _inputs, vks[uint(TransactionTypes.Transfer)]);
      require(result, "The proof has not been verified by the contract");

      // gas measurement:
      gasUsed[2] = gasUsed[0] - gasleft();
      gasUsed[0] = gasleft();

      //TODO - need to enforce correct public keys!!
      // Unfortunately stack depth constraints mandate an array, so we can't use more friendly names.
      // However, here's a handy guide:
      // publicInputs[0] - root (of the commitment Merkle tree)
      // publicInputs[1] - nullifierC
      // publicInputs[2] - nullifierD
      // publicInputs[3] - commitmentE
      // publicInputs[4] - commitmentF
      // publicInputs[5] - root (of public key Merkle tree)
      // publicInputs[6..] - elGamal

      // check inputs vs on-chain states
      require(roots[publicInputs[0]] == publicInputs[0], "The input root has never been the root of the Merkle Tree");
      require(publicInputs[1] != publicInputs[2], "The two input nullifiers must be different!");
      require(publicInputs[3] != publicInputs[4], "The new commitments (commitmentE and commitmentF) must be different!");
      require(nullifiers[publicInputs[1]] == 0, "The commitment being spent (commitmentE) has already been nullified!");
      require(nullifiers[publicInputs[2]] == 0, "The commitment being spent (commitmentF) has already been nullified!");
      require(publicKeyRoots[publicInputs[5]] == publicInputs[5],"The input public key root has never been a root of the Merkle Tree");
      // update contract states
      nullifiers[publicInputs[1]] = publicInputs[1]; //remember we spent it
      nullifiers[publicInputs[2]] = publicInputs[2]; //remember we spent it

      bytes32[] memory leaves = new bytes32[](2);
      leaves[0] = publicInputs[3];
      leaves[1] = publicInputs[4];

      latestRoot = insertLeaves(leaves); // recalculate the root of the merkleTree as it's now different
      roots[latestRoot] = latestRoot; // and save the new root to the list of roots

      emit Transfer(publicInputs);

      // gas measurement:
      gasUsed[1] = gasUsed[1] + gasUsed[0] - gasleft();
      emit GasUsed(gasUsed[1], gasUsed[2]);
  }

  /**
  The batch transfer function transfers 20 commitments to new owners
  */
  function simpleBatchTransfer(uint256[] calldata _proof, uint256[] calldata _inputs, bytes32 _root, bytes32 _nullifier, bytes32[] calldata _commitments) external {

      // gas measurement:
      uint256 gasCheckpoint = gasleft();

      // Check that the publicInputHash equals the hash of the 'public inputs':
      bytes31 publicInputHash = bytes31(bytes32(_inputs[0]) << 8);
      bytes31 publicInputHashCheck = bytes31(sha256(abi.encodePacked(_root, _nullifier, _commitments)) << 8);
      require(publicInputHashCheck == publicInputHash, "publicInputHash cannot be reconciled");

      // gas measurement:
      uint256 gasUsedByShieldContract = gasCheckpoint - gasleft();
      gasCheckpoint = gasleft();

      // verify the proof
      bool result = verifier.verify(_proof, _inputs, vks[uint(TransactionTypes.SimpleBatchTransfer)]);
      require(result, "The proof has not been verified by the contract");

      // gas measurement:
      uint256 gasUsedByVerifierContract = gasCheckpoint - gasleft();
      gasCheckpoint = gasleft();

      // check inputs vs on-chain states
      require(roots[_root] == _root, "The input root has never been the root of the Merkle Tree");
      require(nullifiers[_nullifier] == 0, "The commitment being spent has already been nullified!");

      // update contract states
      nullifiers[_nullifier] = _nullifier; //remember we spent it

      latestRoot = insertLeaves(_commitments);
      roots[latestRoot] = latestRoot; //and save the new root to the list of roots

      emit SimpleBatchTransfer(_nullifier);

      // gas measurement:
      gasUsedByShieldContract = gasUsedByShieldContract + gasCheckpoint - gasleft();
      emit GasUsed(gasUsedByShieldContract, gasUsedByVerifierContract);
  }


  function burn(uint256[] calldata _proof, uint256[] calldata _inputs, bytes32[] calldata publicInputs) external {

      // gas measurement:
      uint256 gasCheckpoint = gasleft();

      // Check that the publicInputHash equals the hash of the 'public inputs':
      bytes31 publicInputHash = bytes31(bytes32(_inputs[0]) << 8);
      // This line can be made neater when we can use pragma 0.6.0 and array slices
      bytes31 publicInputHashCheck = bytes31(sha256(abi.encodePacked(publicInputs)) << 8); // Note that although _payTo represents an address, we have declared it as a uint256. This is because we want it to be abi-encoded as a bytes32 (left-padded with zeros) so as to match the padding in the hash calculation performed within the zokrates proof. Similarly, we force the _value to be left-padded with zeros to fill 128-bits.
      require(publicInputHashCheck == publicInputHash, "publicInputHash cannot be reconciled");

      // gas measurement:
      uint256 gasUsedByShieldContract = gasCheckpoint - gasleft();
      gasCheckpoint = gasleft();

      // verify the proof
      bool result = verifier.verify(_proof, _inputs, vks[uint(TransactionTypes.Burn)]);
      require(result, "The proof has not been verified by the contract");

      // gas measurement:
      uint256 gasUsedByVerifierContract = gasCheckpoint - gasleft();
      gasCheckpoint = gasleft();

      // Unfortunately stack depth constraints mandate an array, so we can't use more friendly names.
      // publicInputs[0] - root (of the commitment Merkle tree)
      // publicInputs[1] - nullifier
      // publicInputs[2] - value
      // publicInputs[3] - payTo address
      // publicInputs[4] - root (of public key Merkle tree)
      // publicInputs[5:11] - elGamal (6 elements)

      // check inputs vs on-chain states
      require(roots[publicInputs[0]] == publicInputs[0], "The input root has never been the root of the Merkle Tree");
      require(nullifiers[publicInputs[1]]==0, "The commitment being spent has already been nullified!");
      require(publicKeyRoots[publicInputs[4]] == publicInputs[4],"The input public key root has never been a root of the Merkle Tree");

      nullifiers[publicInputs[1]] = publicInputs[1]; // add the nullifier to the list of nullifiers

      //Finally, transfer the fungible tokens from this contract to the nominated address
      address payToAddress = address(uint256(publicInputs[3])); // we passed _payTo as a bytes32, to ensure the packing was correct within the sha256() above
      fToken.transfer(payToAddress, uint256(publicInputs[2]));

      emit Burn(publicInputs);

      // gas measurement:
      gasUsedByShieldContract = gasUsedByShieldContract + gasCheckpoint - gasleft();
      emit GasUsed(gasUsedByShieldContract, gasUsedByVerifierContract);
  }
}
