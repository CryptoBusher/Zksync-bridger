import fs from "fs";
import fetch from "node-fetch";
import { createGlobalProxyAgent } from 'global-agent';
import { ethers, JsonRpcProvider } from "ethers";
import { logger } from './src/logger/dev-logger.js';
import { bridgeEth } from "./src/zksyncBridge.js";
import { Okx } from './src/okx.js';
import { shuffleArray, randFloat, randInt, sleep, calculateBridgeAmount } from './src/helpers.js';
const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));

const privateKeys = fs.readFileSync('privateKeys.txt', 'utf8').toString().replace(/\r\n/g, '\n').split('\n').filter(n => n);
const proxies = fs.readFileSync('proxies.txt', 'utf8').toString().replace(/\r\n/g, '\n').split('\n').filter(n => n);

const okx = new Okx(config.okxAuth);
const provider = new JsonRpcProvider(config.zkSyncRPC);
const globalProxyAgent = createGlobalProxyAgent();


const clearEnvProxy = () => {
	globalProxyAgent.HTTP_PROXY = null;
	globalProxyAgent.HTTPS_PROXY = null;
};


class Wallet {
	constructor(name, privateKey, proxy) {
		this.name = name;
		this.privateKey = privateKey;
		this.proxy = proxy;
		this.zksyncInitWeiBalance = 0;
		this.signer = this.createSigner();
	};

	async setEnvProxy() {
		if (this.proxy) {
			globalProxyAgent.HTTP_PROXY = this.proxy;
			globalProxyAgent.HTTPS_PROXY = this.proxy
			await this.validateEnvProxy()
		}
	}

	async validateEnvProxy() {
        const options = {
            method: 'GET',
        };

        const response = await fetch('https://api.ipify.org', options);
		const respText = await response.text();
		
		const proxyHost = this.proxy.split('@')[1].split(':')[0]
		if (respText !== proxyHost) {
			throw Error(`ip by IP checker is ${respText}, but proxy host is ${proxyHost}`);
		}
	}

	createSigner() {
		const signer = new ethers.Wallet(this.privateKey, provider);
		return signer;
	}

	async getzkSyncWeiBalance() {
		return await provider.getBalance(this.signer.address);
	}

	async withdrawEthFromOkx(amountEth) {
		await okx.withdraw(this.signer.address, 'ETH', 'zkSync Era', amountEth);
	}

	async waitForBalanceIncrease() {
		const deadline = Date.now() + config.maxWithdrawalWaitSec * 1000;
		while (Date.now() < deadline) {
			const newBalance = await this.getzkSyncWeiBalance();
			if (newBalance > this.zksyncInitWeiBalance) {
				return;
			} else {
				await sleep(2);
			}
		}

		throw Error('waiting CEX deposit deadline reached');
	}

	async bridgeToEth(amountEth) {
		const hash = await bridgeEth(this.signer, amountEth);
		return hash;
	}
};


const main = async (wallets) => {
	for (const wallet of wallets) {
		clearEnvProxy();
		logger.debug('ENV proxy reset');

		const withdrawalEthAmount = randFloat(config.minWithdrawAmount, config.maxWithdrawAmount, config.minWithdrawDecimals, config.maxWithdrawDecimals);
		const bridgeEthAmount = calculateBridgeAmount(withdrawalEthAmount, config.minBridgePercent, config.maxBridgePercent, config.minBridgeDecimals, config.maxBridgeDecimals);
	
		try {
			logger.info(`${wallet.name} - OKX -> zkSync ${withdrawalEthAmount} ETH`);
			await wallet.withdrawEthFromOkx(withdrawalEthAmount);
		} catch (e) {
			logger.error(`${wallet.name} - failed to withdraw ETH from OKX, reason: ${e}`);
			await sleep(randInt(config.minDelayBetweenAccsSec, config.maxDelayBetweenAccsSec));
			continue;
		}

		try {
			await wallet.setEnvProxy();
			logger.debug(`${wallet.name} - ENV proxy set`);
		} catch (e) {
			logger.error(`${wallet.name} - failed to set ENV proxy, reason: ${e}`);
			if (config.skipIfFailedToSetProxy) {
				await sleep(randInt(config.minDelayBetweenAccsSec, config.maxDelayBetweenAccsSec));
				continue;
			}
		}
	
		wallet.zksyncInitWeiBalance = await wallet.getzkSyncWeiBalance();
	
		const delayBeforeBridge = randInt(config.minDelayBeforeBridgeSec, config.maxDelayBeforeBridgeSec);
		logger.info(`${wallet.name} - sleeping before bridging ${(delayBeforeBridge / 60).toFixed(2)} minutes...`);
		await sleep(delayBeforeBridge);
	
		try {
			logger.info(`${wallet.name} - waiting for balance increase`);
			await wallet.waitForBalanceIncrease();
		} catch (e) {
			logger.error(`${wallet.name} - failed to topup wallet, reason: ${e}`);
			await sleep(randInt(config.minDelayBetweenAccsSec, config.maxDelayBetweenAccsSec));
			continue;
		}
	
		try {
			logger.info(`${wallet.name} - zkSync -> mainnet ${bridgeEthAmount} ETH`);
			const hash = await wallet.bridgeToEth(bridgeEthAmount);
			logger.info(`${wallet.name} - tx hash: ${hash}`);
		} catch (e) {
			logger.error(`${wallet.name} - failed to bridge ETH, reason: ${e}`);
			await sleep(randInt(config.minDelayBetweenAccsSec, config.maxDelayBetweenAccsSec));
			continue;
		}
	
		const delayBeforeNext = randInt(config.minDelayBetweenAccsSec, config.maxDelayBetweenAccsSec);
		logger.info(`${wallet.name} - sleeping before next ${(delayBeforeNext / 60).toFixed(2)} minutes...`);
		await sleep(delayBeforeNext);
	};	
};


let wallets = [];
for (let i = 0; i < privateKeys.length; i++) {
	const [ name, privateKey ] = privateKeys[i].split(':');
	wallets.push(new Wallet(name, privateKey, proxies[i]));
};

if (config.shuffleWallets) {
	wallets = shuffleArray(wallets);
};


await main(wallets);
