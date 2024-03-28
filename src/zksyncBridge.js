// https://portal.txsync.io/bridge/

import { ethers, parseEther } from "ethers";
import { logger } from "./logger/dev-logger.js";
import fs from "fs";


export const bridgeEth = async (signer, amountEth) => {
	const bridgeContractAddress = '0x000000000000000000000000000000000000800A'; 
	const bridgeAbi = JSON.parse(fs.readFileSync("./src/bridgeAbi.json", "utf8"));
	const bridgeContract = new ethers.Contract(bridgeContractAddress, bridgeAbi, signer);

	const amountWei = parseEther(amountEth.toString());

	const txParameters = {
		from: signer.address,
		value: amountWei,
		type: 0
	};
	
	const tx = await bridgeContract.withdraw(signer.address, txParameters);
	logger.debug(`tx: ${JSON.stringify(tx)}`);
	const receipt = await tx.wait();
	logger.debug(`receipt: ${JSON.stringify(receipt)}`);
	return receipt.hash;
};
