import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

(async () => {
  try {
    const web3 = new Web3(web3Provider);

    const accounts = await web3.eth.getAccounts();
    const player = accounts[1];

    // 取得合約 ABI
    const artifactsPath = `browser/artifacts/NumberBattle.json`;
    const metadata = JSON.parse(await remix.call('fileManager', 'getFile', artifactsPath));

    // 已部署的合約地址
    const contractAddress = "0xd2a5bC10698FD955D1Fe6cb468a17809A08fd005"; // 改成你的合約地址
    const numberBattle: Contract = new web3.eth.Contract(metadata.abi, contractAddress);

    // 呼叫 withdraw
    const withdrawTx = await numberBattle.methods.withdraw().send({
      from: player,
      gas: 100000
    });
    console.log("Withdraw transaction hash:", withdrawTx.transactionHash);

    // 查詢玩家 winnings 與合約餘額
    const playerWinnings = await numberBattle.methods.winnings(player).call();
    const contractBalance = await numberBattle.methods.getBalance().call();

    console.log("Player winnings (MATIC):", web3.utils.fromWei(playerWinnings, "ether"));
    console.log("Contract balance (MATIC):", web3.utils.fromWei(contractBalance, "ether"));

  } catch (err) {
    console.error("Withdraw failed:", err);
  }
})();
