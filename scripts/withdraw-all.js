import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

(async () => {
  try {
    const web3 = new Web3(web3Provider);
    const accounts = await web3.eth.getAccounts();
    const owner = accounts[0]; // 假設合約用第一個帳號部署，使用第一個帳號提款

    // 3️⃣ 取得 ABI
    const artifactsPath = `browser/artifacts/NumberBattle.json`;
    const metadata = JSON.parse(await remix.call('fileManager', 'getFile', artifactsPath));

    // 4️⃣ 創建合約實例
    const contractAddress = "0xd2a5bC10698FD955D1Fe6cb468a17809A08fd005"; // 填部署好的地址
    const numberBattle: Contract = new web3.eth.Contract(metadata.abi, contractAddress);

    // 5️⃣ 把獎金池的錢全部取出來
    const withdrawTx = await numberBattle.methods.withdrawAll().send({
      from: owner,
      gas: 100000
    });
    console.log("Withdraw transaction hash:", withdrawTx.transactionHash);

    // 6️⃣ 查詢合約餘額
    const contractBalance = await numberBattle.methods.getBalance().call();
    console.log("Contract balance (MATIC):", web3.utils.fromWei(contractBalance, "ether"));

  } catch (err) {
    console.error("Withdraw failed:", err);
  }
})();
