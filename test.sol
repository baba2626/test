pragma solidity ^0.8.0;

interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract CryptoLottery {
    address payable[] public players;
    uint256 public minimumBet;
    uint256 public winnerPercentage;
    address public owner;
    address public tokenAddress;
    uint256 public ticketPrice;
    uint256 public royaltyPercentage;
    uint256 public lastDrawTime;

    constructor(uint256 _winnerPercentage, uint256 _ticketPrice, uint256 _royaltyPercentage) {
        minimumBet = 4255551; // Set minimum bet to 4,255,551 units of Pepe Coin
        winnerPercentage = _winnerPercentage;
        owner = msg.sender;
        tokenAddress = 0x6982508145454Ce325dDbE47a25d4ec3d2311933; // Pepe Coin contract address
        ticketPrice = _ticketPrice;
        royaltyPercentage = _royaltyPercentage;
        lastDrawTime = block.timestamp;
    }

    function buyTicket(uint256 _numberOfTickets) public {
        require(_numberOfTickets > 0, "Number of tickets must be greater than zero.");
        IERC20 token = IERC20(tokenAddress);
        uint256 amount = ticketPrice * _numberOfTickets * 10**18; // Convert to Wei
        require(amount >= minimumBet, "Ticket price is too low.");
        require(amount % ticketPrice == 0, "Amount must be a multiple of ticket price.");
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed.");
        for (uint256 i = 0; i < _numberOfTickets; i++) {
            players.push(payable(msg.sender));
        }
    }

    function generateRandomNumber() private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty, players.length)));
    }

    function distributePrize() public {
        require(msg.sender == owner, "Only the owner can distribute the prize.");
        require(players.length > 1, "There are not enough players to draw a winner.");
        require(block.timestamp >= lastDrawTime + 1 hours, "It's not time to draw yet.");
        uint256 winnerIndex = generateRandomNumber() % players.length;
        uint256 winnerAmount = IERC20(tokenAddress).balanceOf(address(this)) * winnerPercentage / 100;
        uint256 royaltyAmount = winnerAmount * royaltyPercentage / 100;
        require(IERC20(tokenAddress).transfer(owner, royaltyAmount), "Royalty transfer failed.");
        require(IERC20(tokenAddress).transfer(players[winnerIndex], winnerAmount - royaltyAmount), "Winner transfer failed.");
        delete players;
        lastDrawTime = block.timestamp;
    }

    function getPlayers() public view returns (address payable[] memory) {
        return players;
    }
}
