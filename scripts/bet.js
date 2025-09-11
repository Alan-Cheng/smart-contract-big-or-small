import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

(async () => {
  try {
    const web3 = new Web3(web3Provider); // Remix VM 提供的全域 web3Provider
    const accounts = await web3.eth.getAccounts();
    const player = accounts[1]; // 假設使用第二個帳號下注

    // 1️⃣ 取得 ABI
    const artifactsPath = `browser/artifacts/NumberBattle.json`;
    const metadata = JSON.parse(await remix.call('fileManager', 'getFile', artifactsPath));

    // 2️⃣ 創建合約實例
    const contractAddress = "0xd2a5bC10698FD955D1Fe6cb468a17809A08fd005"; // 部署好的合約地址
    const numberBattle: Contract = new web3.eth.Contract(metadata.abi, contractAddress);

    // 3️⃣ 下注
    const betAmount = web3.utils.toWei("7", "ether"); // 下注 7 MATIC
    const tx = await numberBattle.methods.placeBet().send({
      from: player,
      value: betAmount,
      gas: 200000
    });

    console.log("Bet transaction hash:", tx.transactionHash);

    // 4️⃣ 查詢玩家贏得的金額
    const winnings = await numberBattle.methods.winnings(player).call();
    console.log("Player winnings (MATIC):", web3.utils.fromWei(winnings, "ether"));

    // 5️⃣ 查詢合約餘額
    const balance = await numberBattle.methods.getBalance().call();
    console.log("Contract balance (MATIC):", web3.utils.fromWei(balance, "ether"));

  } catch (err) {
    console.error("Bet failed:", err);
  }
})();
