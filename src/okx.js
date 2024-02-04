import ccxt from 'ccxt'


export class Okx {
    constructor(okxAuth) {
        this.okx = new ccxt.okx(okxAuth);
    }

	async getEthWithdrawFee(coin, chain) {
		const fees = await this.okx.fetchDepositWithdrawFee(coin);
		return fees.networks[chain].withdraw.fee;
	}

    async withdraw(address, coin, chain, amountEth) {
		// ARBONE, OPTIMISM, zkSync Era, Base, Linea, ETH
		const fee = await this.getEthWithdrawFee(coin, chain);
		const params = {
			'network': chain,
			'fee': fee,
			'pwd': '-'
		};

		const response = await this.okx.withdraw(coin, amountEth, address, undefined, params);
		if (response.info.wdId === undefined) {
			throw Error(`${JSON.stringify(response)}`);
		}
    }
}
