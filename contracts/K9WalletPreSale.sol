//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

//K9WalletTokenPreSale presale contract
contract K9WalletTokenPreSale {
    uint256 public immutable maxPresalePercentage = 70; // leave at least 30% of tokens for Liquidity
    uint256 private _initialAvailable;
    
    uint256 public immutable minPerUser;
    uint256 public immutable maxPerUser;
    uint256 public immutable presaleEnd;

    uint256 constant failSafeTime = 1 weeks;
    address public owner;
    
    IERC20 private _k9WalletToken;
    uint256 private _rate;
    
    
    event TokensPurchased(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);
   
    constructor(
        address _owner,
        IERC20 _token
    ) {
        minPerUser = 0.05*1e18; // 0.05 ETH  minimum
        maxPerUser = 10*1e18;// 10 ETH max
        presaleEnd = 1625077281; // GMT June 30, 2021 6:21:21 PM
        owner = _owner;
        _k9WalletToken = _token;
        _rate = 7000000; // 7 million tokens per 1 ETH
    }

    bool presaleEnded;
    bool presaleFailed;
    bool presaleStarted;

    // list of user balances
    mapping(address => uint256) private balances;

    // join presale motherfackas - just send ETH to contract,
    // set GAS LIMIT > 70000!
    receive() external payable {
        require(presaleStarted, "Presale not started, chill out");
        require(!presaleEnded, "Presale ended");
        require(block.timestamp < presaleEnd, "Presale time's up");

        uint256 remaining = _k9WalletToken.balanceOf(address(this));


        
        uint256 amount = msg.value;
        require(amount >= minPerUser, "Min not met");
        require(amount <= maxPerUser, "Max sale reached");
        
        
        uint256 tokens = getTokenAmount(amount);
        
        emit TokensPurchased(msg.sender, msg.sender, amount, tokens);
        deliverTokens(msg.sender, tokens);
        
    }

    function start(uint256 _endDate) external {
        require(msg.sender == owner, "Only K9 Dev Can Start");
        _initialAvailable = _k9WalletToken.balanceOf(address(this));
        presaleStarted = true;
    }

    // check balance of address
    function balanceOf(address user) external view returns (uint256) {
        return balances[user];
    }

    // return balance of caller
    function balanceOf() external view returns (uint256) {
        return balances[msg.sender];
    }

    // total ETH on this contract
    function collected() public view returns (uint256) {
        return address(this).balance;
    }

    // withdraw ETH from contract
    // return false if nothing to do
    function withdraw() external returns (bool) {
        if (!presaleEnded) {
            // end and fail presale if failsafe time passed
            if (block.timestamp > presaleEnd + failSafeTime) {
                presaleEnded = true;
                presaleFailed = true;
                // don't return true, you can withdraw in this call
            }
        }
        // owner withdraw - presale succeed ?
        else if (msg.sender == owner && !presaleFailed) {
            send(owner, address(this).balance);
            return true;
        }

        // presale failed, withdraw to calling user
        if (presaleFailed) {
            uint256 amount = balances[msg.sender];
            balances[msg.sender] = 0;
            send(msg.sender, amount);
            return true;
        }

        // do nothing
        return false;
    }
    
    function getTokenAmount(uint256 weiAmount) internal view returns (uint256) {
        return SafeMath.mul(weiAmount, _rate);
    }
    
    function deliverTokens(address beneficiary, uint256 tokenAmount) internal {
        SafeERC20.safeTransfer(_k9WalletToken, beneficiary, tokenAmount);
    }

    //send ETH from contract to address or contract
    function send(address user, uint256 amount) private {
        bool success = false;
        (success, ) = address(user).call{value: amount}("");
        require(success, "ETH send failed");
    }

    // withdraw any ERC20 token send accidentally on this contract address to contract owner
    function withdrawAnyERC20(IERC20 token) external {
        uint256 amount = token.balanceOf(address(this));
        require(amount > 0, "No tokens to withdraw");
        token.transfer(owner, amount);
    }

    // change ownership in two steps to be sure about owner address
    address public newOwner;

    // only current owner can delegate new one
    function giveOwnership(address _newOwner) external {
        require(msg.sender == owner, "Only for Owner");
        newOwner = _newOwner;
    }

    // new owner need to accept ownership
    function acceptOwnership() external {
        require(msg.sender == newOwner, "Unable to accept Ownership");
        newOwner = address(0x0);
        owner = msg.sender;
    }
}