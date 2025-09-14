// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NumberBattle is ReentrancyGuard {
    mapping(address => uint256) public winnings;
    address public owner;
    bool public paused = false; // 合約是否暫停

    event BetPlaced(address indexed player, uint256 amount, uint256 number);
    event GameResult(address indexed player, bool win, uint256 reward, uint256 number);
    event Deposit(address indexed sender, uint256 amount);
    event ContractPaused(address indexed owner);
    event ContractResumed(address indexed owner);
    event WithdrawAll(address indexed owner, uint256 amount);

    // 設定 owner
    constructor() payable {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier notPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    // 玩家下注
    function placeBet() public payable virtual nonReentrant notPaused {
        require(msg.value > 0, "Need to send MATIC to bet");
        // 限制下注金額不能超過合約餘額一半 (避免支付不出)
        require(msg.value * 2 <= address(this).balance, "Bet too large for prize pool");

        uint256 randomNumber = (uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender))
        ) % 999) + 1;

        bool win = (randomNumber > 500);
        uint256 reward = 0;

        if (win) {
            reward = msg.value * 2;
            winnings[msg.sender] += reward;
        }

        emit BetPlaced(msg.sender, msg.value, randomNumber);
        emit GameResult(msg.sender, win, reward, randomNumber);
    }

    // 玩家提領
    function withdraw() external nonReentrant {
        uint256 amount = winnings[msg.sender];
        require(amount > 0, "No winnings to withdraw");

        winnings[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    // 查詢合約餘額
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    // owner 存款到獎金池
    function deposit() external payable onlyOwner {
        require(msg.value > 0, "Must send MATIC to deposit");
        emit Deposit(msg.sender, msg.value);
    }

    // 暫停合約
    function pauseContract() external onlyOwner {
        paused = true;
        emit ContractPaused(owner);
    }

    // 重新啟動合約
    function resumeContract() external onlyOwner {
        paused = false;
        emit ContractResumed(owner);
    }

    // owner 提領所有餘額
    function withdrawAll() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner).transfer(balance);
        emit WithdrawAll(owner, balance);
    }
}