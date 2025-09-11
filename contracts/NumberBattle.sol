// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NumberBattle is ReentrancyGuard {
    mapping(address => uint256) public winnings;

    event BetPlaced(address indexed player, uint256 amount, uint256 number);
    event GameResult(address indexed player, bool win, uint256 reward, uint256 number);

    // 建構子可接收初始資金
    constructor() payable {}

    function placeBet() external payable nonReentrant {
        require(msg.value > 0, "Need to send MATIC to bet");

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

    function withdraw() external nonReentrant {
        uint256 amount = winnings[msg.sender];
        require(amount > 0, "No winnings to withdraw");

        winnings[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
