export const randFloat = (min, max, minDec, maxDec) => {
	const randomBase = Math.random() * (max - min) + min;
	const decAmount = randInt(minDec, maxDec);
	return Math.floor(randomBase * (10 ** decAmount)) / (10 ** decAmount);
};

export const randInt = (min, max) => {
	return Math.floor(Math.random() * (max - min) + min);
};

export const sleep = (sec) => {
	return new Promise(resolve => setTimeout(resolve, sec * 1000));
};


export const shuffleArray = (array) => {
	return array.sort(() => Math.random() - 0.5);
};

export const calculateBridgeAmount = (withdrawAmount, minPercent, maxPercent, minDecimals, maxDecimals) => {
	const percent = randInt(minPercent, maxPercent);
	const decimals = randInt(minDecimals, maxDecimals);
	return Math.floor((withdrawAmount * percent / 100) * (10 ** decimals)) / (10 ** decimals);
};