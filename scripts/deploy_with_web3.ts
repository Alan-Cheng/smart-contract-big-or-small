import { ethers } from "ethers";

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// 下 0.01 MATIC 注
const tx = await numberBattle.connect(signer).placeBet({
  value: ethers.parseEther("0.01") // 或 ethers.utils.parseEther("0.01")，取決於 ethers 版本
});

await tx.wait();
