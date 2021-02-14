# Binance Hackathon - Nightfall on BSC Testnet 
We managed to deploy the [Nightfall](https://github.com/EYBlockchain/nightfall) privacy preserving solution (from Ernst & Young) onto the BSC
Testnet. For more information about Nightfall, read the info after this section. Having this working 
on BSC Testnet opens up the **Binance network to Enterprise Private Transactions**, allowing all the
work from the Nightfall and [Baseline](https://github.com/ethereum-oasis/baseline/) community to run within the Binance platform itself.

## Transaction Speeds
We have tried Nightfall on Ropsten, and it is really really slow. The expectation was that running on Binance network would have the same problems and challenges; however we were pleasantly surprised at how fast the transactions took place. 
- A demonstration on Ropsten typically takes an hour to complete; at which point if there was a network issue a restart of the entire process would be required.
- Startup typically took 15-20 minutes as the necessary smart contracts were deployed onto the network.
- It also cost a lot of Ether to deploy so we were constantly running out of Ropsten Ether. We have yet to try a public deploy this solution on the Binance Main-net, but from initial observations gas cost is significantly less.

## Challenges
A few key challenges were faced when migrating to Nightfall. These are due to the underlying issues faced when not owning the node that we're connecting to. Nightfall works by generating random 
Ethereum/Binance accounts, funding this account with some ether, and having these interact with a 
deployed Shield Contract which hides the underlying intent of the user and the transactions that 
occur. Using the public testnet means you don't have access to the underlying accounts. 

To workaround this 
- Stored a list of private keys inside the web3.js / provider.js files within each sub-proejct (BSC Testnet BNB is also valuable, we want to control this and recover it later)
- Have a main 'funding' account hard-coded into the web3.js and provider.js files
- Have an EthSigner component that proxied connections for the web3.js components
- Updating merkle-tree web3.js to have a keep-alive feature as the websocket connection kept timing out (note merkle-tree was the only component that required event subscriptions from the blockchain)

We were pleasantly surprised that the migration to Binance chain was so straight-forward. 

## Starting up
To enable Nightfall to run on BSC Testnet, first do the startup instructions below (in the Nightfall section). The setup takes a very long time... It will do a trusted setup of Nightfall and generate the necessary cryptographic materials. (Important - take note of the instructions on NPM_TOKEN and set this in the environment variable).  

Next, start up Nightfall (this will fail in some sections because a patch is required below). 

Once complete, run the following commands; which will patch the node_modules libraries in the respective docker containers.  

```
# Connect to ZKP image and replace the provider.js for nightlite
docker exec -ti nightfall_zkp_1 bash
# Once inside the zkp container (with base terminal) enter the commands:
cp src/provider.js /app/node_modules/@eyblockchain/nightlite/
cp src/erc20.js /app/node_modules/@eyblockchain/nightlite/

# Connect to Merkle-Tree image and replace the web3.js and utils.web3.js
# Once inside the merkle-tree container (with base terminal) enter the commands:
docker exec -ti nightfall_merkle-tree_1 bash
cp config/web3.js src/
cp config/utils-web3.js src/

# Restart merkle-tree (do this first, order is important)
docker restart nightfall_merkle-tree_1
# Restart zkp (do this after merkle-tree, so the events are registered)
docker restart nightfall_zkp_1
```

## Results
Youtube Video Walkthrough will demonstrate the user interface and transactions privacy. We will also discuss the first impressions of using BSC Testnet, areas of improvements, and future / next steps if this project is to proceed further.  

The simulation resulted in the important Testnet blockchain events detailed below:

|Owner|Public Key|  
|---|---|  
|Alice  |[0x35dc7a411C21D84A28da627abA35e659E1BfC815](https://testnet.bscscan.com/address/0x35dc7a411C21D84A28da627abA35e659E1BfC815)|
|Bob    |[0xcbdd8820fe68d67e8653435Cd1F2ecF924aFeB44](https://testnet.bscscan.com/address/0xcbdd8820fe68d67e8653435cd1f2ecf924afeb44)|
|Charlie|[0x5529b9bC19814733EB4CCd36611Dd6726AdC2982](https://testnet.bscscan.com/address/0x5529b9bC19814733EB4CCd36611Dd6726AdC2982)|  
|...|
|ERC721 Contract  |[0x0fd7adaeadca4b83cca7138230276c42e9118d44](https://testnet.bscscan.com/address/0x0fd7adaeadca4b83cca7138230276c42e9118d44)|
|ERC721 Shield Contract   |[0x765953c805a97c074634069a2b256bdd1a4f63ed](https://testnet.bscscan.com/address/0x765953c805a97c074634069a2b256bdd1a4f63ed)|
|ERC20 Contract  |[0xb6613b3dfd1249c9f306aa9d89857bb31538772c](https://testnet.bscscan.com/address/0xb6613b3dfd1249c9f306aa9d89857bb31538772c)|
|ERC20 Shield Contract |[0x895686400770cc843bed75c112c6ca7895fb64fa](https://testnet.bscscan.com/address/0x895686400770cc843bed75c112c6ca7895fb64fa)|  
|||
For a detailed analysis of the transactions between the contracts, Alice, Bob, and Charlie, see the [attached PDF](binance-hackathon-analysis.pdf)  

By inspecting the ERC721 and ERC20 contract tranasactions, there is no evidence that any transactions occurred which transferred between Alice > Bob > Charlie (ERC721) and Alice > Bob / Charlie (ERC20). Only when Charlie cashed out the 34 OpsCoin do we see a transaction. 


## Future Extensions
The approach we took to connect Nightfall to Binance can also work with the Baseline repository. We
took a more modest approach to demonstrate Nightfall first (as we were not sure if it was possible).

The next steps and future extensions would be:
- Potential PR into Nightfall repository (currently Nightfall uses WebsocketProvider everywhere and this may not be necessary)
- Migrate the solution we have to the Baseline solution and apply any necessary patches to get a Baseline version working on Binance
- Have the temporary accounts return the un-used BNB back to the depositing account (so we can just generate BNB accounts as required without keeping the private keys in code)
- Integrate with a Key Store (like Azure Keyvault or Hashicorp Keyvault). Using [EthSigner](https://docs.ethsigner.consensys.net/en/stable/) makes this really easy
- Find potential client(s) who may want to Baseline their system of records on the public Binance Main-net (Binance team might be able to help here)
- Buy myself a new laptop with the Binance Hackathon winnings (hopefully :D). Eyeing that M1x Macbook Pro coming out soon ...

# END Hackathon Section

# Nightfall

Nightfall integrates a set of smart contracts and microservices, and the ZoKrates zk-snark toolkit,
to enable standard ERC-20 and ERC-721 tokens to be transacted on the Ethereum blockchain with
complete privacy. It is an experimental solution and still being actively developed. We decided to
share our research work in the belief that this will speed adoption of public blockchains. This is
not intended to be a production-ready application and we do not recommend that you use it as such.
If it accelerates your own work, then we are pleased to have helped. We hope that people will feel
motivated to contribute their own ideas and improvements.

**Note that this code has not yet completed a security review and therefore we strongly recommend
that you do not use it in production or to transfer items of material value. We take no
responsibility for any loss you may incur through the use of this code.**

As well as this file, please be sure to check out:

- [The Whitepaper](./doc/whitepaper/nightfall-v1.pdf) for technical details on the protocols and
  their application herein.
- [contributions.md](./contributing.md) to find out how to contribute code.
- [limitations.md](./limitations.md) to understand the limitations of the current code.
- [license.md](./license.md) to understand how we have placed this code completely in the public
  domain, without restrictions (but note that Nightfall makes use of other open source code which
  _does_ apply licence conditions).
- [UI.md](./UI.md) to learn how to drive the demonstration UI and make transactions.
- [SECURITY.md](./SECURITY.md) to learn about how we handle security issues.

## Security updates

Critical security updates will be listed
[here](https://github.com/EYBlockchain/nightfall/security/advisories/GHSA-36j7-5gjq-gq3w). If you
had previously installed Nightfall prior to one of these security updates, please pull the latest
code, and follow the extra re-installation steps.

## Getting started

These instructions give the most direct path to a working Nightfall setup. The application is
compute-intensive and so a high-end processor is preferred. Depending on your machine, setup can
take one to several hours.

### Supported hardware & prerequisites

Mac and Linux machines with at least 16GB of memory and 10GB of disk space are supported.

The Nightfall demonstration requires the following software to run:

- Docker
  - Launch Docker Desktop (on Mac, it is on the menu bar) and set memory to 12GB with 4GB of swap
    space (minimum - 16GB memory is better). **The default values for Docker Desktop will NOT work.
    No, they really won't**.
- Python
  - Be sure npm is setup to use v2.7 of python, not python3. To check the python version, run
    `python --version`
  - You may need to run `npm config set python /usr/bin/python2.7` (or wherever your python 2
    location is)
- Node (tested with node 14.15.0) with npm and node-gyp.
  - Will not work with node v15. To check the node version, run `node --version`
  - If using mac/brew, then you may need to run `brew install node@14` and
    `brew link --overwrite node@14 --force`
- Xcode Command line tools:
  - If running macOS, install Xcode then run `xcode-select --install` to install command line tools.

### Starting servers

Start Docker:

- On Mac, open Docker.app.

### Installing Nightfall

Clone the Nightfall repository:

```sh
git clone git@github.com:EYBlockchain/nightfall.git
```

or:

```sh
git clone https://github.com/EYBlockchain/nightfall.git
```

Enter the directory:

```sh
cd <path/to/nightfall>
```

For Linux users:

- Change permission for the directory

  ```sh
  sudo chmod 777 -R zkp/code/
  ```

- Add the Linux user to docker group to run Docker commands without sudo
  ([read more](https://docs.docker.com/install/linux/linux-postinstall/)). Then log out and enter
  again.

  ```sh
  sudo groupadd docker
  sudo usermod --append --groups docker $USER
  ```

For Mac & Linux users:

Next set a environment variable NPM_TOKEN, value should be a github
personal access token with `:repo` and `:read-package` permission granted.

```sh
export NPM_TOKEN=XXXXX
```

Next pull a compatible Docker image of ZoKrates

```sh
docker pull zokrates/zokrates:0.5.1
```

Next we have to generate the keys and constraint files for Zero Knowledge Proofs
([read more](./zkp/code/README-trusted-setup.md)), this is about 7GB and depends on randomness for
security. This step can take a while, depending on your hardware. Before you start, check once more
that you have provisioned enough memory for Docker, as described above:

```sh
./nightfall-generate-trusted-setup
```

Note that this is an automated run. For an initial installation, select the option to generate all
files. For more information on the MiMC hashing option and further documentation on the setup
process, see [the zkp module documentation](zkp/README.md).

Please be patient - you can check progress in the terminal window and by using `docker stats` in
another terminal.

You just created all the files needed to generate zk-SNARKs. The proving keys, verifying keys and
constraint files will allow you to create hidden tokens, move them under zero knowledge and then
recover them — both for fungible (ERC-20) and non-fungible (ERC-721) tokens.

### Starting Nightfall

#### Re-installation

If this isn't your first time running Nightfall, but you have just pulled new changes from the repo,
then you might need to 're-install' certain features due to code changes. First run:

```sh
docker-compose -f docker-compose.yml build
```

It's important to re-run the trusted setup if any of the `.zok` files have been modified since your
last pull of the repo. You can check by comparing the latest version of Nightlite (where the `.zok`
files are stored):

```sh
npm info @eyblockchain/nightlite version
```

with the version you are using:

```sh
cd zkp
npm list @eyblockchain/nightlite
```

If this shows that your version is behind, then you may need to re-install, as above, then re-run:

```sh
./nightfall-generate-trusted-setup
```

_(If only one or a few of the `.zok` files have been changed, then it will be faster for you to
consult [the zkp module documentation](zkp/README.md) for details on selecting individual files for
trusted setup)._

#### Starting

:night_with_stars: We're ready to go! Be sure to be in the main directory and run the demo:

```sh
./nightfall
```

and wait until you see the message `Compiled successfully` in the console.

This brings up each microservice using docker-compose and finally builds a UI running on a local
Angular server.

Navigate your web browser to <http://localhost:8000> to start using Nightfall (give everything
enough time to start up). There are instructions on how to use the application in the
[UI.md](./UI.md) file.

Note that ./nightfall has deployed an ERC-20 and ERC-721 contract for you (specifically FToken.sol
and NFTokenMetada.sol). These are designed to allow anyone to mint tokens for demonstration
purposes. You will probably want to curtail this behaviour in anything but a demonstration.

The UI pulls token names from the contracts you deploy. In the present case, the tokens are called
EY OpsCoin for the ERC-20 and EY Token for ERC-721.

Note that it can take up to 10 mins to compute a transfer proof (depending on your machine) and the
demonstration UI is intentionally modal while this happens (even though the action returns a
promise). You can see what's happening if you look at the terminal where you ran `./nightfall`.

If you want to close the application, make sure to stop containers and remove containers, networks,
volumes, and images created by up, using:

```sh
docker-compose down -v
```

### To run zkp service unit tests

See [the zkp module documentation](zkp/README.md), "run zkp unit tests".

### To run Nightfall integration test

Be sure to be in the main directory and then open terminal and run

```sh
./nightfall-test
```

- Mac
  - Test suites will open a terminal, where you can see test container's log. This terminal will
    close automatically.
  - configure `Terminal.app` to close window when shell exits `exit`.

## Using the compliance extensions

For details, see the [zkp readme](zkp/README.md). The compliance version requires you to have
selected the correct trusted setup when you ran

```sh
./nightfall-generate-trusted-setup
```

After that, you can start it with

```sh
./nightfall compliance
```

Nightfall will inject test keys into the underlying Nightfall library, warning you that it has done
so. To log in as a compliance administrator, use username `admin`, password `admin`. This is only
for demonstration of course. You should use an appropriate access control system for any other
purpose.

## Using other ERC-20 and ERC-721 contracts

Nightfall will operate with any ERC-20 and ERC-721 compliant contract. The contracts' addresses are
fed into FTokenShield.sol and NFTokenShield.sol respectively during the Truffle migration and cannot
be changed subsequently.

If you wish to use pre-existing ERC-20 and ERC-721 contracts then edit `2_Shield_migration.js` so
that the address of the pre-existing ERC-20 contract is passed to FTokenShield and the address of
the pre-existing ERC-721 contract is passed to NFTokenShield i.e. replace `FToken.address` and
`NFTokenMetadata.address`.

This can also be done from UI, by clicking on the user to go to settings, then clicking on contracts
option in this page. A new shield contract address that has been deployed separately can be provided
here. This new contract will be a replacement for NFTokenShield.sol or FTokenShield.sol. Each of
these contracts currently shields the tokens of an ER721 or ERC20 contract instance respectively.

## Using other networks

The demo mode uses Ganache-cli as a blockchain emulator. This is easier than using a true blockchain
client but has the disadvantage that Ganache-cli doesn't currently support the Whisper protocol,
which Nightfall uses for exchanging secrets between sender and receiver. Accordingly we've written a
Whisper stub, which will emulate whisper for participants who are all on the same node server. If
you want to run across multiple blockchain nodes and server instances then replace all occurrences
of the words `whisper-controller-stub` with `whisper-controller` in the code — but you will need to
use Geth rather than Ganache-cli and construct an appropriate Docker container to replace the
Ganache one we provide.

## Acknowledgements

Team Nightfall thanks those who have indirectly contributed to it, with the ideas and tools that
they have shared with the community:

- [ZoKrates](https://hub.docker.com/r/michaelconnor/zok)
- [Libsnark](https://github.com/scipr-lab/libsnark)
- [Zcash](https://github.com/zcash/zcash)
- [GM17](https://eprint.iacr.org/2017/540.pdf)
- [0xcert](https://github.com/0xcert/ethereum-erc721/)
- [OpenZeppelin](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/token/ERC20/ERC20.sol)
