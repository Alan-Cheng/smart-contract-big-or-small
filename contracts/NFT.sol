pragma solidity ^0.8.20;

// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.20;

import "./NumberBattle.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NumberBattleNFT is NumberBattle, ERC721URIStorage {
    uint256 private _tokenIds;
    mapping(address => bool) public hasWon; // 記錄誰獲勝了但還沒領取 NFT
    mapping(address => bool) public hasMinted; // 記錄誰已經 mint 過 NFT
    string public tokenURIForAll; // 所有 NFT 都用這個 URI

    event NFTMinted(address indexed player, uint256 tokenId);

    constructor(string memory name_, string memory symbol_, string memory _tokenURI) 
        ERC721(name_, symbol_) 
        payable 
    {
        tokenURIForAll = _tokenURI;
    }

    // 覆寫 placeBet
    function placeBet() public payable override notPaused {
        uint256 before = winnings[msg.sender];

        super.placeBet();

        if (winnings[msg.sender] > before) {
            hasWon[msg.sender] = true; // 記錄獲勝者，但不自動 mint
        }
    }

    function _mintNFT(address player) internal {
        _tokenIds++;
        uint256 newId = _tokenIds;

        _mint(player, newId);
        _setTokenURI(newId, tokenURIForAll);

        emit NFTMinted(player, newId);
    }

    // 讓使用者主動選擇是否 mint NFT
    function claimNFT() external {
        require(hasWon[msg.sender], "You haven't won yet");
        require(!hasMinted[msg.sender], "You have already minted an NFT");
        
        _mintNFT(msg.sender);
        hasWon[msg.sender] = false; // 避免重複領取
        hasMinted[msg.sender] = true; // 記錄已經 mint 過
    }

    // 可讓 owner 更新 NFT 的圖片 URI
    function setTokenURI(string calldata newURI) external onlyOwner {
        tokenURIForAll = newURI;
    }

    // 覆寫 ERC721URIStorage 的必要函式
    function _burn(uint256 tokenId) internal override(ERC721) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}
