// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TokenTransfer is Ownable(msg.sender) {
    using SafeERC20 for IERC20;

    constructor() {}

    function transferBatchValue(
        address tokenAddress,
        address[] memory tos,
        uint256[] memory amounts
    ) public onlyOwner {
        require(tos.length == amounts.length, "length error");
        IERC20 token = IERC20(tokenAddress);
        for (uint256 i = 0; i < tos.length; i++) {
            token.safeTransferFrom(_msgSender(), tos[i], amounts[i]);
        }
    }

    function transferSingleValue(
        address tokenAddress,
        address[] memory tos,
        uint256 amount
    ) public onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        for (uint256 i = 0; i < tos.length; i++) {
            token.safeTransferFrom(_msgSender(), tos[i], amount);
        }
    }
}
