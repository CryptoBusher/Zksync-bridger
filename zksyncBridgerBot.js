import fs from "fs";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import { ethers, JsonRpcProvider, formatUnits, FetchRequest } from "ethers";
import { logger } from './src/logger/dev-logger.js';
import { bridgeEth } from "./src/zksyncBridge.js";
import { Okx } from './src/okx.js';
import { TelegramBot } from './src/telegram.js';
import { shuffleArray, randFloat, randInt, sleep, calculateBridgeAmount } from './src/helpers.js';
const config = JSON.parse(fs.readFileSync("./config.json", "utf8"));


const OKX = new Okx(config.okxAuth);
const tgBot = new TelegramBot(config.telegramData.botToken, config.telegramData.chatIds);
const MAINNET_PROVIDER = new JsonRpcProvider(config.mainnetRPC);


class Wallet {
	constructor(name, privateKey, proxy) {
		this.name = name;
		this.privateKey = privateKey;
		this.proxy = proxy;
		this.zksyncInitWeiBalance = 0;
		this.provider = this.generateZksyncProvider();
		this.signer = new ethers.Wallet(this.privateKey, this.provider);
	};

	generateZksyncProvider = () => {
		if (this.proxy) {
			const fetchRequest = new FetchRequest(config.zkSyncRPC);
			fetchRequest.getUrlFunc = FetchRequest.createGetUrlFunc({
				agent: new HttpsProxyAgent(this.proxy),
			});

			return new JsonRpcProvider(fetchRequest);
		} else {
			return new JsonRpcProvider(config.zkSyncRPC);
		}
	}

	async getzkSyncWeiBalance() {
		return await this.provider.getBalance(this.signer.address);
	}

	async withdrawEthFromOkx(amountEth) {
		await OKX.withdraw(this.signer.address, 'ETH', 'zkSync Era', amountEth);
	}

	async waitForBalanceIncrease() {
		const deadline = Date.now() + config.maxWithdrawalWaitSec * 1000;
		while (Date.now() < deadline) {
			const newBalance = await this.getzkSyncWeiBalance();
			if (newBalance > this.zksyncInitWeiBalance) {
				return true;
			} else {
				await sleep(randInt(1, 3));
			}
		}

		return false;
	}

	async bridgeToEth(amountEth) {
		return await bridgeEth(this.signer, amountEth);
	}
}


const waitForGas = async () => {
	let currentMaxGas = config.gasPrices.startMainnetGwei;

	const timestampShift = config.gasPrices.delayMinutes * 60 * 1000 // minutes to miliseconds
	let nextCurrentMaxGasIncrease = Date.now() + timestampShift;

	logger.info('Waiting for gas');
	while(true) {
		if ((Date.now() >= nextCurrentMaxGasIncrease) && (config.gasPrices.step !== 0) && (currentMaxGas < config.gasPrices.maxMainnetGwei)) {
			logger.info(`increasing max gas ${currentMaxGas} -> ${currentMaxGas + config.gasPrices.step} GWEI`);
			currentMaxGas = currentMaxGas + config.gasPrices.step;
			nextCurrentMaxGasIncrease = Date.now() + timestampShift;
		}
		
		const feeData = await MAINNET_PROVIDER.getFeeData();
		const gasPriceGwei = parseFloat(formatUnits(feeData.gasPrice.toString(), "gwei"));

		if (gasPriceGwei <= currentMaxGas) {
			logger.info('Gas ok, proceeding');
			return;
		} else {
			await sleep(randInt(30, 60));
		}
	}
};


const withdrawAndBridge = async (wallet) => {
	const withdrawalEthAmount = randFloat(config.minWithdrawAmount, config.maxWithdrawAmount, config.minWithdrawDecimals, config.maxWithdrawDecimals);
	const bridgeEthAmount = calculateBridgeAmount(withdrawalEthAmount, config.minBridgePercent, config.maxBridgePercent, config.minBridgeDecimals, config.maxBridgeDecimals);

	wallet.zksyncInitWeiBalance = await wallet.getzkSyncWeiBalance();

	if (config.gasPrices.waitForGasBeforeCexWithdraw) {
		await waitForGas();
	}

	logger.info(`${wallet.name} - OKX -> zkSync ${withdrawalEthAmount} ETH`);
	await wallet.withdrawEthFromOkx(withdrawalEthAmount);

	const delayBeforeBridge = randInt(config.minDelayBeforeBridgeSec, config.maxDelayBeforeBridgeSec);
	logger.info(`${wallet.name} - sleeping before bridging ${(delayBeforeBridge / 60).toFixed(2)} minutes...`);
	await sleep(delayBeforeBridge);

	logger.info(`${wallet.name} - waiting for balance increase...`);
	const isBalanceIncreased = await wallet.waitForBalanceIncrease();
	if (!isBalanceIncreased) {
		throw Error(`${wallet.name} - balance was not increased`);
	}

	await waitForGas();

	for (let i = 0; i < config.tryToBridgeTimes; i++) {
		try {
			logger.info(`${wallet.name} - zkSync -> mainnet ${bridgeEthAmount} ETH`);
			const hash = await wallet.bridgeToEth(bridgeEthAmount);
			logger.info(`${wallet.name} - tx hash: ${hash}`);
			return withdrawalEthAmount;
		} catch (e) {
			logger.error(`${wallet.name} - failed to bridge ETH, reason: ${e}`);
			await sleep(config.delayBeforeBridgeTriesSec);
			continue;
		}
	}

	throw Error(`${wallet.name} - failed to bridge`);
};


const updateTxtFiles = async(failedWallets, successWallets, remainingWallets) => {
	const failedWalletsContent = failedWallets.join('\n');
	const successWalletsContent = successWallets.join('\n');
	const remainingWalletsContent = remainingWallets.join('\n');

	fs.writeFileSync('failedWallets.txt', failedWalletsContent, 'utf8');
	fs.writeFileSync('successWallets.txt', successWalletsContent, 'utf8');
	fs.writeFileSync('remainingWallets.txt', remainingWalletsContent, 'utf8');
};


const main = async () => {
	let walletsData = fs.readFileSync('walletsData.txt', 'utf8').toString().replace(/\r\n/g, '\n').split('\n').filter(n => n);
	
	const failedWallets = [];
	const successWallets = [];
	const remainingWallets = [...walletsData];
	
	if (config.shuffleWallets) {
		walletsData = shuffleArray(walletsData);
	}

	for (const walletData of walletsData) {
		let telegramMessage = '';

		const [ name, privateKey, proxy ] = walletData.split('|');
		const wallet = new Wallet(name, privateKey, proxy);

		try {
			const withdrawalEthAmount = await withdrawAndBridge(wallet);
			telegramMessage += `\u{2705} Wallet: #${name}\n\nActivity: #withdraw_and_bridge\n`;
			successWallets.push(name + `|${withdrawalEthAmount}`);
		} catch (e) {
			logger.error(`${wallet.name} - failed to withdraw and bridge, reason: ${e.message}`);
			telegramMessage += `\u{274C} Wallet: #${name}\n\nActivity: #withdraw_and_bridge\n`;
			failedWallets.push(walletData);
		}

		const walletDataIndex = remainingWallets.indexOf(walletData);
		if (walletDataIndex !== -1) {
			remainingWallets.splice(walletDataIndex, 1);
		}

		updateTxtFiles(failedWallets, successWallets, remainingWallets);
		telegramMessage += `Remainign: ${remainingWallets.length}\nSuccess: ${successWallets.length}\nFailed: ${failedWallets.length}`
		await tgBot.notifyAll(telegramMessage);

		const delayBeforeNextSec = randInt(config.minDelayBetweenAccsSec, config.maxDelayBetweenAccsSec);
		logger.info(`Sleeping before next ${(delayBeforeNextSec / 60).toFixed(2)} minutes...`)
		await sleep(delayBeforeNextSec);
	}

	logger.info(`Finished work`);
};


await main();
