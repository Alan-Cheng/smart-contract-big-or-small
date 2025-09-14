import { Injectable, signal } from '@angular/core';
import { ethers } from 'ethers';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  
  // 使用 signals 來管理狀態
  public isConnected = signal(false);
  public account = signal<string>('');
  public chainId = signal<string>('');
  public balance = signal<string>('0');

  constructor() {
    this.checkConnection();
  }

  async connectWallet(): Promise<boolean> {
    try {
      if (typeof window.ethereum !== 'undefined') {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        
        // 請求連接錢包
        await this.provider.send('eth_requestAccounts', []);
        
        this.signer = await this.provider.getSigner();
        const address = await this.signer.getAddress();
        const network = await this.provider.getNetwork();
        
        this.account.set(address);
        this.chainId.set(network.chainId.toString());
        this.isConnected.set(true);
        
        // 獲取餘額
        await this.updateBalance();
        
        return true;
      } else {
        throw new Error('MetaMask 未安裝');
      }
    } catch (error) {
      console.error('連接錢包失敗:', error);
      return false;
    }
  }

  async disconnectWallet(): Promise<void> {
    this.provider = null;
    this.signer = null;
    this.isConnected.set(false);
    this.account.set('');
    this.chainId.set('');
    this.balance.set('0');
  }

  async checkConnection(): Promise<void> {
    if (typeof window.ethereum !== 'undefined') {
      try {
        this.provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await this.provider.listAccounts();
        
        if (accounts.length > 0) {
          this.signer = await this.provider.getSigner();
          const address = await this.signer.getAddress();
          const network = await this.provider.getNetwork();
          
          this.account.set(address);
          this.chainId.set(network.chainId.toString());
          this.isConnected.set(true);
          
          await this.updateBalance();
        }
      } catch (error) {
        console.error('檢查連接狀態失敗:', error);
      }
    }
  }

  async updateBalance(): Promise<void> {
    if (this.provider && this.account()) {
      try {
        const balance = await this.provider.getBalance(this.account());
        this.balance.set(parseFloat(ethers.formatEther(balance)).toFixed(2));
      } catch (error) {
        console.error('更新餘額失敗:', error);
      }
    }
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider;
  }

  getSigner(): ethers.JsonRpcSigner | null {
    return this.signer;
  }

  async switchToConfiguredChain(): Promise<boolean> {
    if (!this.provider) return false;
    try {
      await this.provider.send('wallet_switchEthereumChain', [
        { chainId: environment.chain.chainIdHex }
      ]);
      return true;
    } catch (error: any) {
      if (error.code === 4902) {
        try {
          await this.provider.send('wallet_addEthereumChain', [{
            chainId: environment.chain.chainIdHex,
            chainName: environment.chain.name,
            nativeCurrency: {
              name: 'MATIC',
              symbol: 'MATIC',
              decimals: 18
            },
            rpcUrls: environment.chain.rpcUrls,
            blockExplorerUrls: environment.chain.blockExplorerUrls
          }]);
          return true;
        } catch (addError) {
          console.error('添加鏈失敗:', addError);
          return false;
        }
      }
      console.error('切換鏈失敗:', error);
      return false;
    }
  }
}

// 擴展 Window 介面以支援 ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
