import { Injectable, signal } from '@angular/core';
import { ethers } from 'ethers';
import { Web3Service } from './web3.service';
import { GameResult, ContractInfo, PlayerInfo, TransactionStatus, NFTInfo, NFTMintResult } from '../models/game.models';
import { environment } from '../../environments/environment';

const CONTRACT_ABI = [
  "function placeBet() external payable",
  "function withdraw() external",
  "function getBalance() external view returns (uint256)",
  "function deposit() external payable",
  "function pauseContract() external",
  "function resumeContract() external",
  "function withdrawAll() external",
  "function winnings(address) external view returns (uint256)",
  "function paused() external view returns (bool)",
  "function owner() external view returns (address)",
  // NFT 相關函式
  "function claimNFT() external",
  "function hasWon(address) external view returns (bool)",
  "function hasMinted(address) external view returns (bool)",
  "function balanceOf(address) external view returns (uint256)",
  "function tokenURI(uint256) external view returns (string)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function totalSupply() external view returns (uint256)",
  "function setTokenURI(string calldata newURI) external",
  "event BetPlaced(address indexed player, uint256 amount, uint256 number)",
  "event GameResult(address indexed player, bool win, uint256 reward, uint256 number)",
  "event Deposit(address indexed sender, uint256 amount)",
  "event ContractPaused(address indexed owner)",
  "event ContractResumed(address indexed owner)",
  "event WithdrawAll(address indexed owner, uint256 amount)",
  "event NFTMinted(address indexed player, uint256 tokenId)"
];

@Injectable({ providedIn: 'root' })
export class ContractService {
  private contract: (ethers.Contract & Record<string, any>) | null = null;

  private readonly CONTRACT_ADDRESS = environment.contracts.numberBattleAddress;

  public contractInfo = signal<ContractInfo>({ balance: '0', paused: false, owner: '' });
  public playerInfo = signal<PlayerInfo>({ address: '', winnings: '0', isOwner: false });
  public lastGameResult = signal<GameResult | null>(null);
  public transactionStatus = signal<TransactionStatus | null>(null);
  public nftInfo = signal<NFTInfo>({ hasWon: false, hasMinted: false, balance: 0, tokenURI: '' });

  constructor(private web3Service: Web3Service) {
    this.initializeContract();
  }

  private initializeContract(): void {
    const provider = this.web3Service.getProvider();
    if (!provider) { this.contract = null; return; }
    if (!this.CONTRACT_ADDRESS || this.CONTRACT_ADDRESS.length === 0) {
      this.contract = null;
      console.warn('尚未設定合約地址，請於 environment 檔案填入 contracts.numberBattleAddress');
      return;
    }
    this.contract = new ethers.Contract(
      this.CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider
    ) as unknown as ethers.Contract & Record<string, any>;
  }

  private ensureContract(): boolean {
    if (!this.contract) this.initializeContract();
    return !!this.contract;
  }

  private getWriteContract(): any | null {
    const signer = this.web3Service.getSigner();
    if (!signer) return null;
    if (!this.CONTRACT_ADDRESS) return null;
    // 直接用 signer 建立寫入合約，避免因 connect(BaseContract) 失去方法
    return new ethers.Contract(
      this.CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    ) as unknown as any;
  }

  async updateContractInfo(): Promise<void> {
    if (!this.ensureContract()) return;
    try {
      const [balance, paused, owner] = await Promise.all([
        this.contract!["getBalance"](),
        this.contract!["paused"](),
        this.contract!["owner"]()
      ]);
      this.contractInfo.set({ balance: parseFloat(ethers.formatEther(balance)).toFixed(2), paused, owner });
    } catch (error) {
      console.error('更新合約資訊失敗:', error);
    }
  }

  async updatePlayerInfo(): Promise<void> {
    if (!this.ensureContract() || !this.web3Service.account()) return;
    try {
      const winnings = await this.contract!["winnings"](this.web3Service.account());
      const isOwner = this.contractInfo().owner === this.web3Service.account();
      this.playerInfo.set({ address: this.web3Service.account(), winnings: parseFloat(ethers.formatEther(winnings)).toFixed(2), isOwner });
      
      // 同時更新 NFT 資訊
      await this.updateNFTInfo();
    } catch (error) {
      console.error('更新玩家資訊失敗:', error);
    }
  }

  async placeBet(betAmount: string): Promise<boolean> {
    if (!this.CONTRACT_ADDRESS) { this.transactionStatus.set({ hash: '', status: 'error', message: '尚未設定合約地址' }); return false; }
    if (!this.web3Service.isConnected()) { this.transactionStatus.set({ hash: '', status: 'error', message: '請先連接錢包' }); return false; }
    if (!this.ensureContract() || !this.web3Service.getSigner()) { this.transactionStatus.set({ hash: '', status: 'error', message: '無法取得簽署者或合約' }); return false; }
    // 前置檢查：合約地址是否為合約、是否暫停、下注是否 <= 最大值
    try {
      const provider = this.web3Service.getProvider();
      if (provider) {
        const code = await provider.getCode(this.CONTRACT_ADDRESS);
        if (!code || code === '0x') {
          this.transactionStatus.set({ hash: '', status: 'error', message: '合約地址無效（非合約）' });
          return false;
        }
      }
      const info = this.contractInfo();
      if (info.paused) {
        this.transactionStatus.set({ hash: '', status: 'error', message: '合約已暫停' });
        return false;
      }
      const maxBet = parseFloat(this.getMaxBet());
      const bet = parseFloat(String(betAmount));
      if (!(bet > 0)) {
        this.transactionStatus.set({ hash: '', status: 'error', message: '請輸入大於 0 的金額' });
        return false;
      }
      if (bet > maxBet) {
        this.transactionStatus.set({ hash: '', status: 'error', message: `下注過大，最大可下注 ${maxBet} MATIC` });
        return false;
      }
    } catch {}
    try {
      this.transactionStatus.set({ hash: '', status: 'pending', message: '正在處理下注...' });
      const write = this.getWriteContract(); if (!write) throw new Error('No signer');
      const tx = await write['placeBet']({ value: ethers.parseEther(String(betAmount)) });
      this.transactionStatus.set({ hash: tx.hash, status: 'pending', message: '等待交易確認...' });
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        this.transactionStatus.set({ hash: tx.hash, status: 'success', message: '下注成功！' });
        await this.updateContractInfo();
        await this.updatePlayerInfo();
        await this.web3Service.updateBalance();
        await this.listenForGameResult(tx.hash, betAmount);
        return true;
      } else { throw new Error('交易失敗'); }
    } catch (error: any) {
      console.error('下注失敗:', error);
      this.transactionStatus.set({ hash: '', status: 'error', message: error?.message || '下注失敗' });
      return false;
    }
  }

  async withdraw(): Promise<boolean> {
    if (!this.web3Service.isConnected()) { this.transactionStatus.set({ hash: '', status: 'error', message: '請先連接錢包' }); return false; }
    if (!this.ensureContract() || !this.web3Service.getSigner()) { this.transactionStatus.set({ hash: '', status: 'error', message: '無法取得簽署者或合約' }); return false; }
    try {
      this.transactionStatus.set({ hash: '', status: 'pending', message: '正在處理提領...' });
      const write = this.getWriteContract(); if (!write) throw new Error('No signer');
      const tx = await write['withdraw']();
      this.transactionStatus.set({ hash: tx.hash, status: 'pending', message: '等待交易確認...' });
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        this.transactionStatus.set({ hash: tx.hash, status: 'success', message: '提領成功！' });
        await this.updatePlayerInfo();
        await this.web3Service.updateBalance();
        return true;
      } else { throw new Error('交易失敗'); }
    } catch (error: any) {
      console.error('提領失敗:', error);
      this.transactionStatus.set({ hash: '', status: 'error', message: error?.message || '提領失敗' });
      return false;
    }
  }

  async deposit(amount: string): Promise<boolean> {
    if (!this.web3Service.isConnected()) { this.transactionStatus.set({ hash: '', status: 'error', message: '請先連接錢包' }); return false; }
    if (!this.ensureContract() || !this.web3Service.getSigner()) { this.transactionStatus.set({ hash: '', status: 'error', message: '無法取得簽署者或合約' }); return false; }
    try {
      this.transactionStatus.set({ hash: '', status: 'pending', message: '正在存款到獎金池...' });
      const write = this.getWriteContract(); if (!write) throw new Error('No signer');
      const tx = await write['deposit']({ value: ethers.parseEther(String(amount)) });
      this.transactionStatus.set({ hash: tx.hash, status: 'pending', message: '等待交易確認...' });
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        this.transactionStatus.set({ hash: tx.hash, status: 'success', message: '存款成功！' });
        await this.updateContractInfo();
        await this.web3Service.updateBalance();
        return true;
      } else { throw new Error('交易失敗'); }
    } catch (error: any) {
      console.error('存款失敗:', error);
      this.transactionStatus.set({ hash: '', status: 'error', message: error?.message || '存款失敗' });
      return false;
    }
  }

  async pauseContract(): Promise<boolean> {
    if (!this.ensureContract() || !this.web3Service.getSigner()) return false;
    try {
      const write = this.getWriteContract(); if (!write) throw new Error('No signer');
      const tx = await write['pauseContract']();
      await tx.wait();
      await this.updateContractInfo();
      return true;
    } catch (error) {
      console.error('暫停合約失敗:', error);
      return false;
    }
  }

  async resumeContract(): Promise<boolean> {
    if (!this.ensureContract() || !this.web3Service.getSigner()) return false;
    try {
      const write = this.getWriteContract(); if (!write) throw new Error('No signer');
      const tx = await write['resumeContract']();
      await tx.wait();
      await this.updateContractInfo();
      return true;
    } catch (error) {
      console.error('恢復合約失敗:', error);
      return false;
    }
  }

  async withdrawAll(): Promise<boolean> {
    if (!this.ensureContract() || !this.web3Service.getSigner()) return false;
    try {
      this.transactionStatus.set({ hash: '', status: 'pending', message: '正在提取所有餘額...' });
      const write = this.getWriteContract(); if (!write) throw new Error('No signer');
      const tx = await write['withdrawAll']();
      this.transactionStatus.set({ hash: tx.hash, status: 'pending', message: '等待交易確認...' });
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        this.transactionStatus.set({ hash: tx.hash, status: 'success', message: '提取成功！' });
        await this.updateContractInfo();
        await this.web3Service.updateBalance();
        return true;
      } else { throw new Error('交易失敗'); }
    } catch (error: any) {
      console.error('提取所有餘額失敗:', error);
      this.transactionStatus.set({ hash: '', status: 'error', message: error?.message || '提取失敗' });
      return false;
    }
  }

  private async listenForGameResult(txHash: string, betAmount: string): Promise<void> {
    if (!this.contract) return;
    try {
      // 方法1: 直接從交易收據中獲取事件
      const provider = this.web3Service.getProvider();
      if (provider) {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt && receipt.logs) {
          // 解析事件日誌
          for (const log of receipt.logs) {
            try {
              const parsedLog = this.contract.interface.parseLog({
                topics: log.topics,
                data: log.data
              });
              if (parsedLog && parsedLog.name === 'GameResult') {
                const player = parsedLog.args['player'];
                const win = Boolean(parsedLog.args['win']);
                const reward = parseFloat(ethers.formatEther(parsedLog.args['reward'])).toFixed(2);
                const number = Number(parsedLog.args['number']);
                const gameResult: GameResult = { player, win, reward, number, betAmount };
                this.lastGameResult.set(gameResult);
                return;
              }
            } catch (parseError) {
              // 忽略解析錯誤，繼續處理下一個日誌
            }
          }
        }
      }

      // 方法2: 如果方法1失敗，使用 queryFilter 作為備用
      const filter = this.contract.filters['GameResult'](this.web3Service.account());
      const events = await this.contract.queryFilter(filter);
      const latestEvent = events.find(e => e.transactionHash === txHash);
      if (latestEvent) {
        const anyEvent: any = latestEvent as any;
        const player = anyEvent.args?.player ?? this.web3Service.account();
        const win = Boolean(anyEvent.args?.win);
        const reward = anyEvent.args?.reward ? parseFloat(ethers.formatEther(anyEvent.args.reward)).toFixed(2) : '0.00';
        const numberVal = anyEvent.args?.number;
        const number = typeof numberVal === 'bigint' ? Number(numberVal) : Number(numberVal ?? 0);
        const gameResult: GameResult = { player, win, reward, number, betAmount };
        this.lastGameResult.set(gameResult);
      }
    } catch (error) {
      console.error('監聽遊戲結果失敗:', error);
    }
  }

  getMaxBet(): string {
    const balance = parseFloat(this.contractInfo().balance);
    return (balance / 2).toString();
  }

  // NFT 相關方法
  async updateNFTInfo(): Promise<void> {
    if (!this.ensureContract() || !this.web3Service.account()) return;
    try {
      console.log('正在更新 NFT 資訊...', this.web3Service.account());
      
      // 先檢查合約是否有這些函式
      const hasWon = await this.contract!["hasWon"](this.web3Service.account()).catch((e: any) => {
        console.error('hasWon 函式調用失敗:', e);
        return false;
      });
      
      const hasMinted = await this.contract!["hasMinted"](this.web3Service.account()).catch((e: any) => {
        console.error('hasMinted 函式調用失敗:', e);
        return false;
      });
      
      const balance = await this.contract!["balanceOf"](this.web3Service.account()).catch((e: any) => {
        console.error('balanceOf 函式調用失敗:', e);
        return 0;
      });
      
      const tokenURI = await this.contract!["tokenURI"](1).catch((e: any) => {
        console.error('tokenURI 函式調用失敗:', e);
        return '';
      });
      
      console.log('NFT 資訊:', { hasWon, hasMinted, balance: Number(balance), tokenURI });
      
      this.nftInfo.set({ 
        hasWon, 
        hasMinted, 
        balance: Number(balance), 
        tokenURI: tokenURI || '' 
      });
    } catch (error) {
      console.error('更新 NFT 資訊失敗:', error);
    }
  }

  async claimNFT(): Promise<boolean> {
    if (!this.web3Service.isConnected()) { 
      this.transactionStatus.set({ hash: '', status: 'error', message: '請先連接錢包' }); 
      return false; 
    }
    if (!this.ensureContract() || !this.web3Service.getSigner()) { 
      this.transactionStatus.set({ hash: '', status: 'error', message: '無法取得簽署者或合約' }); 
      return false; 
    }
    
    try {
      this.transactionStatus.set({ hash: '', status: 'pending', message: '正在鑄造 NFT...' });
      const write = this.getWriteContract(); 
      if (!write) throw new Error('No signer');
      
      const tx = await write['claimNFT']();
      this.transactionStatus.set({ hash: tx.hash, status: 'pending', message: '等待交易確認...' });
      
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        this.transactionStatus.set({ hash: tx.hash, status: 'success', message: 'NFT 鑄造成功！' });
        await this.updateNFTInfo();
        await this.listenForNFTMint(tx.hash);
        return true;
      } else { 
        throw new Error('交易失敗'); 
      }
    } catch (error: any) {
      console.error('鑄造 NFT 失敗:', error);
      this.transactionStatus.set({ hash: '', status: 'error', message: error?.message || '鑄造 NFT 失敗' });
      return false;
    }
  }

  canClaimNFT(): boolean {
    const nftInfo = this.nftInfo();
    return this.web3Service.isConnected() && nftInfo.hasWon && !nftInfo.hasMinted;
  }

  private async listenForNFTMint(txHash: string): Promise<void> {
    if (!this.contract) return;
    try {
      const provider = this.web3Service.getProvider();
      if (provider) {
        const receipt = await provider.getTransactionReceipt(txHash);
        if (receipt && receipt.logs) {
          for (const log of receipt.logs) {
            try {
              const parsedLog = this.contract.interface.parseLog({
                topics: log.topics,
                data: log.data
              });
              if (parsedLog && parsedLog.name === 'NFTMinted') {
                const player = parsedLog.args['player'];
                const tokenId = Number(parsedLog.args['tokenId']);
                console.log(`NFT 鑄造成功: 玩家 ${player}, Token ID: ${tokenId}`);
                return;
              }
            } catch (parseError) {
              // 忽略解析錯誤
            }
          }
        }
      }
    } catch (error) {
      console.error('監聽 NFT 鑄造事件失敗:', error);
    }
  }

  async setTokenURI(newURI: string): Promise<boolean> {
    if (!this.web3Service.isConnected()) { 
      this.transactionStatus.set({ hash: '', status: 'error', message: '請先連接錢包' }); 
      return false; 
    }
    if (!this.ensureContract() || !this.web3Service.getSigner()) { 
      this.transactionStatus.set({ hash: '', status: 'error', message: '無法取得簽署者或合約' }); 
      return false; 
    }
    
    try {
      this.transactionStatus.set({ hash: '', status: 'pending', message: '正在更新 NFT URI...' });
      const write = this.getWriteContract(); 
      if (!write) throw new Error('No signer');
      
      const tx = await write['setTokenURI'](newURI);
      this.transactionStatus.set({ hash: tx.hash, status: 'pending', message: '等待交易確認...' });
      
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        this.transactionStatus.set({ hash: tx.hash, status: 'success', message: 'NFT URI 更新成功！' });
        await this.updateNFTInfo();
        return true;
      } else { 
        throw new Error('交易失敗'); 
      }
    } catch (error: any) {
      console.error('更新 NFT URI 失敗:', error);
      this.transactionStatus.set({ hash: '', status: 'error', message: error?.message || '更新 NFT URI 失敗' });
      return false;
    }
  }
}


