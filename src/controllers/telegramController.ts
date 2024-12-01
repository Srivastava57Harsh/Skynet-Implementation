import { Telegraf } from "telegraf";
import axios from "axios";
import moment from "moment";

const bot = new Telegraf(process.env.TELEGRAPH_API_KEY || "");
const GROUP_CHAT_ID = process.env.GROUP_CHAT_ID || "";
let messageHistory: any[] = [];


async function fetchTrendingTokens() {
	try {
		const response = await axios.get(
			"https://api.coingecko.com/api/v3/search/trending"
		);

		return response.data.coins.map((coin: any) => coin.item.name);
	} catch (error) {
		console.error("Error fetching trending tokens:", error);
		return [];
	}
}

async function fetchTrendingTokensFromCoinPaprika() {
	try {
		const response = await axios.get("https://api.coinpaprika.com/v1/coins");

		return response.data.slice(0, 10).map((coin: any) => coin.name);
	} catch (error) {
		console.error("Error fetching trending tokens:", error);
		return [];
	}
}

async function fetchTrendingTokensFromCMC() {
	const apiKey = process.env.COINMARKETCAP_API_KEY || "";
	try {
		const response = await axios.get(
			"https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
			{
				headers: {
					"X-CMC_PRO_API_KEY": apiKey,
				},
				params: {
					limit: 10,
					convert: "USD",
				},
			}
		);

		return response.data.data.map((coin: any) => coin.name);
	} catch (error) {
		console.error("Error fetching trending tokens from CoinMarketCap:", error);
		return [];
	}
}

async function fetchTrendingTokensFromCryptorank() {
	try {
		const response = await axios.get("https://api.cryptorank.io/v1/currencies");
		console.log("Trending Tokens:", response.data.data);
		return response.data.data.slice(0, 10).map((coin: any) => coin.name);
	} catch (error) {
		console.error("Error fetching trending tokens from Cryptorank:", error);
		return [];
	}
}

async function fetchHypedTokens() {
	try {
		const response = await axios.get(
			"https://api.coingecko.com/api/v3/coins/markets",
			{
				params: {
					vs_currency: "usd",
					order: "market_cap_desc",
					per_page: 5,
				},
			}
		);
		return response.data.map(
			(coin: any) => `${coin.name} (${coin.symbol.toUpperCase()})`
		);
	} catch (error) {
		console.error("Error fetching tokens:", error);
		return ["Fallback Token 1", "Fallback Token 2"];
	}
}

async function fetchAndVerifyTrendingTokens() {
	try {
		const trendingTokensCoinGecko = (
			await fetchTrendingTokens().catch(() => [])
		)?.slice(0, 5);
		const trendingTokensCoinPaprika = (
			await fetchTrendingTokensFromCoinPaprika().catch(() => [])
		)?.slice(0, 5);
		const trendingTokensCMC = (
			await fetchTrendingTokensFromCMC().catch(() => [])
		)?.slice(0, 5);
		const trendingTokensCryptorank = (
			await fetchTrendingTokensFromCryptorank().catch(() => [])
		)?.slice(0, 5);

		const allTrendingTokens = [
			...trendingTokensCoinGecko,
			...trendingTokensCoinPaprika,
			...trendingTokensCMC,
			...trendingTokensCryptorank,
		];

		console.log("All Trending Tokens:", allTrendingTokens);

		return allTrendingTokens;
	} catch (error) {
		console.error("Error during fetching trending tokens:", error);
		return [];
	}
}

async function postHypedTokens() {
	const lastPostedTokens = await fetchAndVerifyTrendingTokens();

	if (lastPostedTokens.length === 0) {
		console.error("No tokens fetched, skipping post.");
		return;
	}

	const message = `🚀 Trending Tokens:\n\n${lastPostedTokens.join("\n")}`;
	try {
		await bot.telegram.sendMessage(GROUP_CHAT_ID, message);
		console.log("Posted hyped tokens to the group!");
	} catch (error) {
		console.error("Error posting tokens to the group:", error);
	}
}

function analyzeSentiment(messages: any) {
	let buyCount = 0;
	let sellCount = 0;

	messages.forEach((msg: any) => {
		const text = msg.text.toLowerCase();
		if (text.includes("buy")) buyCount++;
		if (text.includes("sell")) sellCount++;
	});

	if (buyCount > sellCount) return "Verdict: Buy 📈";
	if (sellCount > buyCount) return "Verdict: Sell 📉";
	return "Verdict: Hold 🤝";
}
async function monitorChat() {
	const startTime = moment();
	console.log("Monitoring group chat for 15 seconds...");

	// Wait for 15 seconds
	await new Promise((resolve) => setTimeout(resolve, 15000));

	const recentMessages = messageHistory.filter((msg) =>
		moment.unix(msg.date).isAfter(startTime)
	);

	console.log("Messages received in the last 15 seconds:", recentMessages);

	const verdict = analyzeSentiment(recentMessages);

	try {
		await bot.telegram.sendMessage(GROUP_CHAT_ID, verdict);
		console.log("Sentiment analysis complete. Verdict posted!");
	} catch (error) {
		console.error("Error posting verdict:", error);
	}
}

async function startTokenPosting() {
	console.log("Starting token posting every 15 seconds...");
	setInterval(async () => {
		console.log("Posting tokens and monitoring chat...");
		await postHypedTokens();
		await monitorChat();
	}, 15000);
}

bot.on("message", (ctx: any) => {
	const chatId = ctx.chat.id.toString();
	if (chatId === GROUP_CHAT_ID) {
		messageHistory.push(ctx.message);
		console.log(`Message received: ${ctx.message.text}`);
	} else {
		console.log(`Message received from another chat (ID: ${chatId})`);
	}
});
async function startBot() {
	try {
		console.log("Attempting to launch the bot...");
		bot.launch();

		console.log("Bot is running...");

		startTokenPosting();
	} catch (error) {
		console.error("Error launching the bot:", error);
	}
}



  export { startBot };

// async function startBot() {
