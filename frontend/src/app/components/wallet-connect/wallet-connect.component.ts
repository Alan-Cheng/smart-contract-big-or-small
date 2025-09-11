import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Web3Service } from '../../services/web3.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-wallet-connect',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wallet-connect">
      <div *ngIf="!web3Service.isConnected()" class="connect-section">
        <h3>連接錢包</h3>
        <p>請連接您的 MetaMask 錢包來開始遊戲</p>
        <button 
          class="connect-btn"
          (click)="connectWallet()"
          [disabled]="isConnecting()">
          {{ isConnecting() ? '連接中...' : '連接錢包' }}
        </button>
      </div>
      
      <div *ngIf="web3Service.isConnected()" class="wallet-info">
        <div class="wallet-details">
          <h3>錢包已連接</h3>
          <p><strong>地址:</strong> {{ formatAddress(web3Service.account()) }}</p>
          <p><strong>餘額:</strong> {{ web3Service.balance() }} MATIC</p>
          <p><strong>鏈:</strong> {{ chainName }} ({{ web3Service.chainId() }})</p>
        </div>
        
        <div class="wallet-actions">
          <button 
            class="switch-btn"
            (click)="switchToConfiguredChain()"
            [disabled]="isSwitching()">
            {{ isSwitching() ? '切換中...' : '切換到 ' + chainName }}
          </button>
          <button 
            class="disconnect-btn"
            (click)="disconnectWallet()">
            斷開連接
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wallet-connect {
      max-width: 500px;
      margin: 20px auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 10px;
      background: #f9f9f9;
    }
    
    .connect-section {
      text-align: center;
    }
    
    .connect-section h3 {
      color: #333;
      margin-bottom: 10px;
    }
    
    .connect-section p {
      color: #666;
      margin-bottom: 20px;
    }
    
    .connect-btn {
      background: #4CAF50;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      transition: background 0.3s;
    }
    
    .connect-btn:hover:not(:disabled) {
      background: #45a049;
    }
    
    .connect-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    .wallet-info {
      background: white;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }
    
    .wallet-details h3 {
      color: #4CAF50;
      margin-bottom: 15px;
    }
    
    .wallet-details p {
      margin: 8px 0;
      color: #333;
    }
    
    .wallet-actions {
      margin-top: 15px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    
    .switch-btn {
      background: #2196F3;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .switch-btn:hover:not(:disabled) {
      background: #1976D2;
    }
    
    .switch-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    .disconnect-btn {
      background: #f44336;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }
    
    .disconnect-btn:hover {
      background: #d32f2f;
    }
  `]
})
export class WalletConnectComponent {
  public isConnecting = signal(false);
  public isSwitching = signal(false);
  public chainName = environment.chain.name;

  constructor(public web3Service: Web3Service) {}

  async connectWallet(): Promise<void> {
    this.isConnecting.set(true);
    try {
      await this.web3Service.connectWallet();
    } finally {
      this.isConnecting.set(false);
    }
  }

  async disconnectWallet(): Promise<void> {
    await this.web3Service.disconnectWallet();
  }

  async switchToConfiguredChain(): Promise<void> {
    this.isSwitching.set(true);
    try {
      await this.web3Service.switchToConfiguredChain();
    } finally {
      this.isSwitching.set(false);
    }
  }

  formatAddress(address: string): string {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}
