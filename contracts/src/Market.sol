// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./YesToken.sol";
import "./NoToken.sol";

contract Market {
    address public usdcToken;
    address public factory;

    YesToken public yesToken;
    NoToken public noToken;

    string public question;
    bool public resolved;
    bool public outcome;

    uint256 public endTime;
    uint256 public disputeEndTime;
    uint256 public constant DISPUTE_WINDOW = 1 hours;

    event SharesPurchased(address indexed buyer, bool indexed buyYes, uint256 amount);
    event SharesSold(address indexed seller, bool indexed soldYes, uint256 amount);
    event MarketResolved(bool outcome);
    event SharesRedeemed(address indexed redeemer, uint256 amount);

    constructor(string memory _question, address _usdcToken, uint256 _endTime) {
        question = _question;
        usdcToken = _usdcToken;
        factory = msg.sender;
        endTime = _endTime;

        yesToken = new YesToken();
        noToken = new NoToken();
    }

    function buy(uint256 amount, bool buyYes) external {
        _buy(amount, buyYes, msg.sender);
    }

    function buyFor(uint256 amount, bool buyYes, address recipient) external {
        require(recipient != address(0), "Invalid recipient");
        _buy(amount, buyYes, recipient);
    }

    function _buy(uint256 amount, bool buyYes, address recipient) internal {
        require(!resolved, "Market is resolved");
        require(block.timestamp < endTime, "Market has ended");

        IERC20(usdcToken).transferFrom(msg.sender, address(this), amount);

        // Mint equal YES and NO shares
        yesToken.mint(address(this), amount);
        noToken.mint(address(this), amount);

        // Transfer chosen side to recipient, keep other side in contract
        if (buyYes) {
            yesToken.transfer(recipient, amount);
        } else {
            noToken.transfer(recipient, amount);
        }

        emit SharesPurchased(recipient, buyYes, amount);
    }

    function sell(uint256 amount, bool sellYes) external {
        require(!resolved, "Market is resolved");

        if (sellYes) {
            // User returns YES tokens; contract must hold enough NO tokens to burn a pair
            require(noToken.balanceOf(address(this)) >= amount, "Insufficient opposite tokens");
            yesToken.transferFrom(msg.sender, address(this), amount);
            // Burn the matched pair from the contract's holdings
            yesToken.burn(amount);
            noToken.burn(amount);
        } else {
            require(yesToken.balanceOf(address(this)) >= amount, "Insufficient opposite tokens");
            noToken.transferFrom(msg.sender, address(this), amount);
            noToken.burn(amount);
            yesToken.burn(amount);
        }

        // Return USDC to the seller
        IERC20(usdcToken).transfer(msg.sender, amount);

        emit SharesSold(msg.sender, sellYes, amount);
    }

    function resolve(bool _outcome) external {
        require(msg.sender == factory, "Only factory can resolve");
        require(!resolved, "Market already resolved");
        require(block.timestamp >= endTime, "Market has not ended");

        resolved = true;
        outcome = _outcome;
        disputeEndTime = block.timestamp + DISPUTE_WINDOW;

        emit MarketResolved(_outcome);
    }

    function redeem() external {
        require(resolved, "Market not resolved");
        require(block.timestamp >= disputeEndTime, "Dispute window active");

        if (outcome) {
            uint256 yesBalance = yesToken.balanceOf(msg.sender);
            require(yesBalance > 0, "No YES shares to redeem");
            yesToken.burnFrom(msg.sender, yesBalance);
            IERC20(usdcToken).transfer(msg.sender, yesBalance);
            emit SharesRedeemed(msg.sender, yesBalance);
        } else {
            uint256 noBalance = noToken.balanceOf(msg.sender);
            require(noBalance > 0, "No NO shares to redeem");
            noToken.burnFrom(msg.sender, noBalance);
            IERC20(usdcToken).transfer(msg.sender, noBalance);
            emit SharesRedeemed(msg.sender, noBalance);
        }
    }
}
