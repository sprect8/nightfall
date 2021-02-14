/**
@module web3.js
@desc
@author liju jose
*/

import Web3 from 'web3';
import config from 'config';


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

const mapping = {}


export default {
    mapping, 
    connection() {
        return this.web3;
    },

    _getProvider() {
        const provider = new Web3.providers.WebsocketProvider(
            `wss://data-seed-prebsc-1-s1.binance.org:${config.web3.port}`,
            config.web3.options,
          );
      
        provider.on('error', console.error);
        provider.on('connect', () => console.log('Blockchain Connected ...'));
        provider.on('end', e=>{
            //console.log("Connection dropped");
            //console.error(e);
            this.web3.setProvider(this._getProvider());
            console.log("Connection dropped, reconnecting");
        });
        return provider;
    },

    /**
     * Connects to web3 and then sets proper handlers for events
     */
    connect() {
        if (this.web3) return this.web3;

        console.log('Blockchain Connecting ...');
        // const provider = new Web3.providers.HttpProvider(
        //     `${config.web3.host}:${config.web3.port}`
        //     //   null,
        //     //   config.web3.options,
        // );

        // // provider.on('error', console.error);
        // // provider.on('connect', () => console.log('Blockchain Connected ...'));
        // // provider.on('end', console.error);

        const provider = this._getProvider();

        this.web3 = new Web3(provider);
        accounts.forEach(e => {
          const account = this.web3.eth.accounts.privateKeyToAccount(e);
          this.web3.eth.accounts.wallet.add(account);
          mapping[account.address.toUpperCase()] = e;
        });

        // attempt to keep connection alive
        setInterval(async e=>{
            await this.web3.eth.getBlock("latest");
        }, 30000);
    
        this.web3.eth.defaultAccount = this.web3.eth.accounts.privateKeyToAccount("0xbc696d9be5af89ff3389f2517b419dea6928054997ddf231791c38783a8e86f0").address;
        // this.web3 = new Web3(provider);
    
        return this.web3;
    },

    /**
     * Checks the status of connection
     *
     * @return {Boolean} - Resolves to true or false
     */
    isConnected() {
        if (this.web3) {
            return this.web3.eth.net.isListening();
        }
        return false;
    },
};