import { ethers, parseEther } from "ethers";
import fs from "fs";


export const bridgeEth = async (signer, amountEth) => {
	const bridgeContractAddress = '0x000000000000000000000000000000000000800A'; 
	const bridgeAbi = JSON.parse(fs.readFileSync("./src/bridgeAbi.json", "utf8"));
	const bridgeContract = new ethers.Contract(bridgeContractAddress, bridgeAbi, signer);

	const amountWei = parseEther(amountEth.toString());

	const txParameters = {
		from: signer.address,
		value: amountWei,
	};

	const tx = await bridgeContract.withdraw(signer.address, txParameters);
	const receipt = await tx.wait();
	return receipt.hash;
};