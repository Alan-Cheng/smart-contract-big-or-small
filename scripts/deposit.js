import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

(async () => {
  try {
    const web3 = new Web3(web3Provider);
    const accounts = await web3.eth.getAccounts();
    const owner = accounts[0]; // 假設合約用第一個帳號部署，使用第一個帳號存錢進去(Owner)

    // 3️⃣ 取得 ABI
    const artifactsPath = `browser/artifacts/NumberBattle.json`;
    const metadata = JSON.parse(await remix.call('fileManager', 'getFile', artifactsPath));

    // 4️⃣ 創建合約實例 (假設 contractOptions.address 已部署)
    const contractAddress = "0xd2a5bC10698FD955D1Fe6cb468a17809A08fd005"; // 這裡填部署好的合約地址，隨著你部屬的環境更改
    const numberBattle: Contract = new web3.eth.Contract(metadata.abi, contractAddress);

    // 5️⃣ 存錢進獎金池
    const depositAmount = web3.utils.toWei("50", "ether"); // 存 1 MATIC
    const depositTx = await numberBattle.methods.deposit().send({
      from: owner,
      value: depositAmount,
      gas: 100000
    });

    console.log("Deposit transaction hash:", depositTx.transactionHash);

    // 6️⃣ 查詢合約餘額
    const balance = await numberBattle.methods.getBalance().call();
    console.log("Contract balance (MATIC):", web3.utils.fromWei(balance, "ether"));

  } catch (err) {
    console.error("Deposit failed:", err);
  }
})();

