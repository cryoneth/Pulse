// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Market.sol";

contract MarketFactory {
    address public owner;
    address public usdcToken;
    address[] public markets;

    event MarketCreated(address indexed marketAddress, string question, uint256 endTime);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address _usdcToken) {
        owner = msg.sender;
        usdcToken = _usdcToken;
    }

    function createMarket(string memory question, uint256 endTime) external onlyOwner {
        require(endTime > block.timestamp, "End time must be in future");

        Market newMarket = new Market(question, usdcToken, endTime);
        markets.push(address(newMarket));

        emit MarketCreated(address(newMarket), question, endTime);
    }

    function resolveMarket(address marketAddress, bool outcome) external onlyOwner {
        Market(marketAddress).resolve(outcome);
    }

    function getMarkets() external view returns (address[] memory) {
        return markets;
    }

    function getMarketCount() external view returns (uint256) {
        return markets.length;
    }
}
