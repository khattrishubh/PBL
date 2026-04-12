// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BlockDrive {
    mapping(string => address) public fileOwner;
    mapping(string => mapping(address => bool)) public accessList;

    event FileRegistered(string cid, address owner);
    event FileShared(string cid, address owner, address sharedWith);

    function registerFile(string memory cid) public {
        require(fileOwner[cid] == address(0), "File already registered");
        fileOwner[cid] = msg.sender;
        emit FileRegistered(cid, msg.sender);
    }

    function shareFile(string memory cid, address userAddress) public {
        require(fileOwner[cid] == msg.sender, "Only owner can share");
        accessList[cid][userAddress] = true;
        emit FileShared(cid, msg.sender, userAddress);
    }

    function hasAccess(string memory cid, address userAddress) public view returns (bool) {
        if (fileOwner[cid] == userAddress) return true;
        if (accessList[cid][userAddress]) return true;
        // If file has no owner on chain yet, maybe fallback true, or false?
        // Let's return false by default, but if someone has a cid not registered, it'll fail. That's intended.
        return false;
    }
}
