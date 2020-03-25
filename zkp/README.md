# Nightfall Zero-Knowledge Proof Service

_This module is part of Nightfall. Most users will only be interested in using the application as a whole, we direct those readers to [the main README](../README.md). This file provides additional information on how this module works so you can learn about, tinker and improve it._

## Tasks you can perform

### Run zkp service unit tests

You will need to have completed the trusted setup. This is done simply by running (from the Nightfall root):

```sh
./nightfall-generate-trusted-setup
```

If you have previously run the Nightfall application, you will already have completed this step and there is no need to repeat it (it takes about and hour so it's worth avoiding where possible!).

_Alternatively_, if you change one of the proofs in the Nightfall suite, then you can perform the trusted setup for just that proof, which is a lot faster by running

```sh
npm run setup -- -i gm17/<dir containing your proof>
```

Also, before running these tests, don't forget to make sure you have a current version of the zkp container. If in doubt, run:

```sh
docker-compose build zkp
```

After your trusted setup is complete run:

```sh
docker-compose run --rm truffle-zkp compile --all && docker-compose run --rm truffle-zkp migrate --reset --network=default
```

This will run ganache in a container; compile all of the nightfall contracts; and deploy them.  

To run the zkp unit tests (in another terminal window):

```sh
docker-compose run --rm zkp npm test
```

The relevant files for these tests can be found under `zkp/__tests__`.

-   `f-token-controller.test.js` - These are units tests to verify mint, transfer and burn of ERC-20 tokens and ERC-20 commitments
-   `nf-token-controller.test.js` - These are units tests to verify mint, transfer and burn of ERC-721 tokens and ERC-721 commitments
-   `utils.test.js` - These are unit tests for utils used for running the tests.

Note that the zkp service tests take a while to run (approx. 1 hour)

### Use MiMC hashing

MiMC hashes use far fewer constraints in a zk-SNARK, but cost more gas than a SHA-256 hash. This allows us to consolidate 20 commitments in one proof. If you like, you can use MiMC hashing for merkle tree path calculation by selecting it when running `./nightfall-generate-trusted-setup`. After that, you must write:

```sh
-f docker-compose.yml -f docker-compose.override.mimc.yml
```
wherever you are running docker-compose. For example, instead of:

```sh
docker-compose run --rm truffle-zkp compile --all && docker-compose run --rm truffle-zkp migrate --reset --network=default
```

run:

```sh
docker-compose -f docker-compose.yml -f docker-compose.override.mimc.yml run --rm truffle-zkp compile --all && docker-compose -f docker-compose.yml -f docker-compose.override.mimc.yml run --rm truffle-zkp migrate --reset --network=default
```

The `docker-compose.override.mimc.yml` file changes which merkle tree handling smart contracts the truffle container looks for, plus it tells the zkp and merkle-tree containers that any path calculations use MiMC.

This is the only way you can run a consolidation proof, which takes 20 commitments and transfers them in a single proof. The test `consolidation-mimc.test.js` goes through the process of completing a batch transfer, creating 20 commitments from one, then consolidating them back into one.

You will find that, using MiMC, all proofs will compute much faster but cost more in gas.

When swapping from using MiMC hashes back to SHA-256, remember to delete `contracts/MiMC.sol` and shut down any open containers.

### Development

Running the zkp module as part of the fully application is handled by Docker Compose. But you will be running this directly on your machine. Prerequesites for development of Nightfall are documented in [the main project README](../README.md). Satisfy those first before proceeding.

Build and run service (on port 80)

```sh
# These instructions are interpreted from docker-compose.yml, zkp section, and the zkp Dockerfile
cd zkp
npm ci
npm start
```

Troubleshooting

```sh
# REQUIRES NPM V6.10.1+
# Source https://github.com/ethereum/web3.js/issues/2863#issuecomment-514226742
npm update -g npm
```

Run trusted setup

```sh
NODE_ENV=setup npx babel-node code/index.js
```

Clean

```sh
rm -rf node_modules
```

## Further reading

-   [README-tools-trusted-setup.md](code/README-tools-trusted-setup.md) Instructions for manually generating the verification keys and proving keys for ZoKrates from the .pcode files.
-   [README-manual-trusted-setup.md](code/README-manual-trusted-setup.md) is a deeper walkthrough of the "generating key pairs" task above.
-   [README-tools-code-preprop.md](code/README-tools-code-preprop.md) explains "pcode", an abbreviated language Nightfall uses that transpiles down to the ZoKrates "code" language.
