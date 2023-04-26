// Connect to Metamask
const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
const contractABI = [ /* Your contract ABI here */ ];
const contractAddress = "0xYourContractAddress";
const cryptoLottery = new web3.eth.Contract(contractABI, contractAddress);

async function init() {
    try {
        const accounts = await web3.eth.getAccounts();
        const defaultAccount = accounts[0];
        web3.eth.defaultAccount = defaultAccount;

        await displayPlayersList();
        handleBuyTicketForm();

        await updateTimer();
        setInterval(updateTimer, 1000);

        await displayDrawHistory();
        await updatePrizePool();
        setInterval(updatePrizePool, 1000);
    } catch (error) {
        console.error('Error initializing the app:', error);
    }
}

async function displayPlayersList() {
    const playersList = document.getElementById("playersList");
    const players = await cryptoLottery.methods.getPlayers().call();
    players.forEach(player => {
        const listItem = document.createElement("li");
        listItem.textContent = player;
        playersList.appendChild(listItem);
    });
}

function handleBuyTicketForm() {
    const buyTicketForm = document.getElementById("buyTicketForm");
    buyTicketForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const numberOfTickets = event.target.numberOfTickets.value;
        await cryptoLottery.methods.buyTicket(numberOfTickets).send({ from: web3.eth.defaultAccount });
        location.reload(); // Reload the page to update the list of players
    });
}

async function updateTimer() {
    const lastDrawTime = await cryptoLottery.methods.lastDrawTime().call();
    const currentTime = Math.floor(Date.now() / 1000);
    const timeRemaining = Math.max(0, parseInt(lastDrawTime) + 3600 - currentTime);

    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;

    document.getElementById("timer").textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

async function displayDrawHistory() {
    const drawHistoryTable = document.getElementById("drawHistoryTable");
    const tbody = drawHistoryTable.querySelector("tbody");
    const [timestamps, winners, prizes] = await cryptoLottery.methods.getDrawHistory().call();

    for (let i = 0; i < timestamps.length; i++) {
        const row = tbody.insertRow();

        const winnerCell = row.insertCell(0);
        winnerCell.textContent = winners[i];

        const prizeCell = row.insertCell(1);
        prizeCell.textContent = web3.utils.fromWei(prizes[i], "ether") + " Pepe Coin";
    }
}

async function updatePrizePool() {
    const winnerPercentage = await cryptoLottery.methods.winnerPercentage().call();
    const tokenAddress = await cryptoLottery.methods.tokenAddress().call();
    const tokenContract = new web3.eth.Contract(tokenContractABI, tokenAddress); // Use the token contract ABI
    const tokenBalance = await tokenContract.methods.balanceOf(contractAddress).call();
    const prizePool = web3.utils.fromWei(tokenBalance, "ether") * winnerPercentage / 100;
    document.getElementById("currentPrizePool").textContent = prizePool.toFixed(2) + " Pepe Coin";
}

document.addEventListener("DOMContentLoaded", init);
