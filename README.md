# 🎲 NumberBattle - 智能合約比大小遊戲

部署於 Polygon 區塊鏈測試網的智能合約遊戲，玩家可以透過錢包(如MetaMask)連接測試網下注進行比大小遊戲，從 1 ~ 999 隨機產生一個數字，若大於 500 即玩家獲勝，另外獲勝可鑄造 NFT。

👉👉👉[🎲NumberBattle](https://numberbattle.alan-cheng.com/)
## Polygon Amoy TestNet

1. 安裝錢包後，進入 [Polygon TestNet Amoy](https://amoy.polygonscan.com/) 點擊下方👉   <img src="https://amoy.polygonscan.com/images/svg/brands/metamask.svg" alt="metamask_icon" style="width:20px; height:20px;"> Add Polygon Amoy Network，即可加入測試網路

2. 可至 [Polygon Faucet](https://faucet.polygon.technology/) 領取測試網Token共0.1枚用於遊戲。（測試網代幣沒有價值，若0.1枚不滿足可在連結填寫表單，Polygon團隊會給你100枚

3. 填寫表單申請代幣處理時間不定，發放時會透過 Mail 聯絡您

## 智能合約結構

### NumberBattle.sol

- 實作下注與提款等基本功能，使用 OpenZeppelin ReentrancyGuard 防止重入攻擊

- modifier 修飾符來控制合約中的方法權限，合約擁有者(Owner)可使用後台注入資金、合約提款、終止、恢復等功能

- 透過 event 將紀錄寫入區塊鏈並持久化保存合約資料，如玩家累積報酬與遊戲中的提款紀錄等 

### NFT.sol

- 使用 ERC721 標準建立非同質化代幣(Non-Fungible Token)

- 繼承並覆寫NumberBattle.sol 之 placeBet() 下注方法，在獲勝時可選擇是否鑄造 NFT

- NFT 圖檔上傳至 IPFS 去中心化儲存，合約擁有者可變更圖片內容


## DEMO
### 比大小頁面連接錢包
- 若瀏覽器有安裝錢包，點擊連結錢包會出現是否同意連線的確認彈窗
> ![連接錢包](https://github.com/Alan-Cheng/smart-contract-big-or-small/blob/main/demo/UI.png?raw=true)

### 下注
- 參考最大下注金額，選擇適當金額下注
- ⚠️ **提醒：** 交易失敗可能是Estimate Gas Fee太低，MetaMask會自動估計合適的Gas Fee，但交易若失敗可選則提高費用。
> ![遊戲介面](https://github.com/Alan-Cheng/smart-contract-big-or-small/blob/main/demo/CONNECT_WALLET.png?raw=true)

### 失敗畫面
- 下注失敗資金進入獎金池，可繼續下注
> ![失敗](https://github.com/Alan-Cheng/smart-contract-big-or-small/blob/main/demo/LOSE.png?raw=true)

### 獲勝畫面
- 獲勝可選擇繼續下注或是提領累積的獎金，另外還可以鑄造獨家NFT :D
> ![獲勝](https://github.com/Alan-Cheng/smart-contract-big-or-small/blob/main/demo/WIN.png?raw=true)

### NFT 鑄造
- 鑄造 NFT 後可進入錢包確認是否取得可愛黑貓 NFT，恭喜。
> ![NFT 鑄造](https://github.com/Alan-Cheng/smart-contract-big-or-small/blob/main/demo/NFT_MINT.png?raw=true)


**聲明**: 本專案無使用任何有價貨幣或加密貨幣，僅供智能合約撰寫練習