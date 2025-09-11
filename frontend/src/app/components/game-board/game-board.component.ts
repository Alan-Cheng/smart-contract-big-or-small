import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Web3Service } from '../../services/web3.service';
import { ContractService } from '../../services/contract.service';
import { GameResult } from '../../models/game.models';

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="game-board">
      <div class="game-header">
        <h1>🎲 Number Battle</h1>
        <p class="game-description">
          下注 MATIC，隨機生成 1-999 的數字，大於 500 即獲勝，獎金翻倍！
        </p>
      </div>

      <div class="game-stats">
        <div class="stat-card">
          <h3>合約餘額</h3>
          <p class="stat-value">{{ contractService.contractInfo().balance }} MATIC</p>
        </div>
        <div class="stat-card">
          <h3>您的獎金</h3>
          <p class="stat-value">{{ contractService.playerInfo().winnings }} MATIC</p>
        </div>
        <div class="stat-card">
          <h3>最大下注</h3>
          <p class="stat-value">{{ getMaxBet() }} MATIC</p>
        </div>
      </div>

      <div class="game-section">
        <div class="bet-section">
          <h3>下注區域</h3>
          <div class="bet-form">
            <div class="input-group">
              <label for="betAmount">下注金額 (MATIC):</label>
              <input 
                type="number" 
                id="betAmount"
                [(ngModel)]="betAmount"
                [max]="getMaxBet()"
                min="0.001"
                step="0.001"
                placeholder="輸入下注金額"
                >
            </div>
            
            <button 
              class="bet-btn"
              (click)="placeBet()"
              [disabled]="!canBet() || isBetting()">
              {{ isBetting() ? '下注中...' : '開始遊戲' }}
            </button>
          </div>
        </div>

        <div class="result-section" *ngIf="contractService.lastGameResult()">
          <h3>遊戲結果</h3>
          <div class="result-card" [class.win]="contractService.lastGameResult()?.win" [class.lose]="!contractService.lastGameResult()?.win">
            <div class="result-number">
              {{ contractService.lastGameResult()?.number }}
            </div>
            <div class="result-text">
              <h2>{{ contractService.lastGameResult()?.win ? '🎉 恭喜獲勝！' : '😔 很遺憾，下次再來！' }}</h2>
              <p>下注金額: {{ contractService.lastGameResult()?.betAmount }} MATIC</p>
              <p *ngIf="contractService.lastGameResult()?.win">
                獎金: {{ contractService.lastGameResult()?.reward }} MATIC
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="action-section">
        <button 
          class="withdraw-btn"
          (click)="withdraw()"
          [disabled]="!canWithdraw() || isWithdrawing()">
          {{ isWithdrawing() ? '提領中...' : '提領獎金' }}
        </button>
        
        <button 
          class="refresh-btn"
          (click)="refreshData()"
          [disabled]="isRefreshing()">
          {{ isRefreshing() ? '更新中...' : '更新資料' }}
        </button>
      </div>

      <div class="status-section" *ngIf="contractService.transactionStatus()">
        <div class="status-card" [class]="'status-' + contractService.transactionStatus()?.status">
          <h4>{{ getStatusTitle() }}</h4>
          <p>{{ contractService.transactionStatus()?.message }}</p>
          <p *ngIf="contractService.transactionStatus()?.hash" class="tx-hash">
            交易哈希: {{ contractService.transactionStatus()?.hash }}
          </p>
        </div>
      </div>

      <div class="contract-status" *ngIf="contractService.contractInfo().paused">
        <div class="paused-warning">
          ⚠️ 合約已暫停，無法進行遊戲
        </div>
      </div>
    </div>
  `,
  styles: [`
    .game-board {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .game-header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .game-header h1 {
      color: #333;
      font-size: 2.5em;
      margin-bottom: 10px;
    }
    
    .game-description {
      color: #666;
      font-size: 1.1em;
    }
    
    .game-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      text-align: center;
    }
    
    .stat-card h3 {
      color: #333;
      margin-bottom: 10px;
      font-size: 1.1em;
    }
    
    .stat-value {
      color: #4CAF50;
      font-size: 1.5em;
      font-weight: bold;
      margin: 0;
    }
    
    .game-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    
    .bet-section, .result-section {
      background: white;
      padding: 25px;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .bet-section h3, .result-section h3 {
      color: #333;
      margin-bottom: 20px;
      text-align: center;
    }
    
    .input-group {
      margin-bottom: 20px;
    }
    
    .input-group label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 500;
    }
    
    .input-group input {
      width: 100%;
      padding: 12px;
      border: 2px solid #ddd;
      border-radius: 5px;
      font-size: 16px;
      box-sizing: border-box;
    }
    
    .input-group input:focus {
      outline: none;
      border-color: #4CAF50;
    }
    
    .input-group input:disabled {
      background: #f5f5f5;
      cursor: not-allowed;
    }
    
    .bet-btn {
      width: 100%;
      background: #4CAF50;
      color: white;
      border: none;
      padding: 15px;
      border-radius: 5px;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.3s;
    }
    
    .bet-btn:hover:not(:disabled) {
      background: #45a049;
    }
    
    .bet-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    .result-card {
      text-align: center;
      padding: 20px;
      border-radius: 10px;
      border: 3px solid;
    }
    
    .result-card.win {
      background: #e8f5e8;
      border-color: #4CAF50;
    }
    
    .result-card.lose {
      background: #ffeaea;
      border-color: #f44336;
    }
    
    .result-number {
      font-size: 4em;
      font-weight: bold;
      margin-bottom: 15px;
    }
    
    .result-card.win .result-number {
      color: #4CAF50;
    }
    
    .result-card.lose .result-number {
      color: #f44336;
    }
    
    .result-text h2 {
      margin-bottom: 10px;
    }
    
    .result-text p {
      margin: 5px 0;
      color: #333;
    }
    
    .action-section {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-bottom: 20px;
    }
    
    .withdraw-btn, .refresh-btn {
      padding: 12px 24px;
      border: none;
      border-radius: 5px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.3s;
    }
    
    .withdraw-btn {
      background: #2196F3;
      color: white;
    }
    
    .withdraw-btn:hover:not(:disabled) {
      background: #1976D2;
    }
    
    .refresh-btn {
      background: #FF9800;
      color: white;
    }
    
    .refresh-btn:hover:not(:disabled) {
      background: #F57C00;
    }
    
    .withdraw-btn:disabled, .refresh-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    
    .status-section {
      margin-bottom: 20px;
    }
    
    .status-card {
      padding: 15px;
      border-radius: 5px;
      text-align: center;
    }
    
    .status-pending {
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      color: #856404;
    }
    
    .status-success {
      background: #d4edda;
      border: 1px solid #c3e6cb;
      color: #155724;
    }
    
    .status-error {
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
    }
    
    .tx-hash {
      font-family: monospace;
      font-size: 0.9em;
      word-break: break-all;
    }
    
    .contract-status {
      text-align: center;
    }
    
    .paused-warning {
      background: #f8d7da;
      color: #721c24;
      padding: 15px;
      border-radius: 5px;
      border: 1px solid #f5c6cb;
      font-weight: bold;
    }
    
    @media (max-width: 768px) {
      .game-section {
        grid-template-columns: 1fr;
      }
      
      .action-section {
        flex-direction: column;
      }
    }
  `]
})
export class GameBoardComponent implements OnInit, OnDestroy {
  public betAmount = signal<string>('');
  public isBetting = signal(false);
  public isWithdrawing = signal(false);
  public isRefreshing = signal(false);

  constructor(
    public web3Service: Web3Service,
    public contractService: ContractService
  ) {}

  ngOnInit(): void {
    this.refreshData();
  }

  ngOnDestroy(): void {
    // 清理資源
  }

  canBet(): boolean {
    return this.web3Service.isConnected() && 
           !this.contractService.contractInfo().paused &&
           parseFloat(this.betAmount()) > 0 &&
           parseFloat(this.betAmount()) <= parseFloat(this.getMaxBet());
  }

  canWithdraw(): boolean {
    return this.web3Service.isConnected() && 
           parseFloat(this.contractService.playerInfo().winnings) > 0;
  }

  getMaxBet(): string {
    return this.contractService.getMaxBet();
  }

  async placeBet(): Promise<void> {
    if (!this.canBet()) return;
    
    this.isBetting.set(true);
    try {
      const success = await this.contractService.placeBet(this.betAmount());
      if (success) {
        this.betAmount.set(''); // 清空下注金額
      }
    } finally {
      this.isBetting.set(false);
    }
  }

  async withdraw(): Promise<void> {
    if (!this.canWithdraw()) return;
    
    this.isWithdrawing.set(true);
    try {
      await this.contractService.withdraw();
    } finally {
      this.isWithdrawing.set(false);
    }
  }

  async refreshData(): Promise<void> {
    this.isRefreshing.set(true);
    try {
      await Promise.all([
        this.contractService.updateContractInfo(),
        this.contractService.updatePlayerInfo(),
        this.web3Service.updateBalance()
      ]);
    } finally {
      this.isRefreshing.set(false);
    }
  }

  getStatusTitle(): string {
    const status = this.contractService.transactionStatus()?.status;
    switch (status) {
      case 'pending': return '⏳ 交易處理中';
      case 'success': return '✅ 交易成功';
      case 'error': return '❌ 交易失敗';
      default: return '📋 交易狀態';
    }
  }
}
