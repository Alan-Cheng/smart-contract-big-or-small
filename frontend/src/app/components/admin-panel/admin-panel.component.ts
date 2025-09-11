import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContractService } from '../../services/contract.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-panel">
      <h2>管理員面板</h2>
      <div class="info">
        <p><strong>Owner:</strong> {{ contractService.contractInfo().owner }}</p>
        <p><strong>合約餘額:</strong> {{ contractService.contractInfo().balance }} MATIC</p>
        <p><strong>狀態:</strong> {{ contractService.contractInfo().paused ? '暫停' : '運行中' }}</p>
      </div>

      <div class="actions">
        <div class="row">
          <label>存款金額 (MATIC)</label>
          <input type="number" [(ngModel)]="depositAmount" min="0" step="0.01">
          <button (click)="deposit()" [disabled]="isBusy()">存款</button>
        </div>
        <div class="row">
          <button (click)="pause()" [disabled]="isBusy()">暫停合約</button>
          <button (click)="resume()" [disabled]="isBusy()">恢復合約</button>
        </div>
        <div class="row">
          <button (click)="withdrawAll()" [disabled]="isBusy()">提取所有餘額</button>
        </div>
        <div class="row">
          <button (click)="refresh()">重新整理</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-panel { max-width: 800px; margin: 20px auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background: #fff; }
    h2 { margin-top: 0; }
    .info p { margin: 6px 0; }
    .actions { margin-top: 16px; display: grid; gap: 12px; }
    .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
    input { padding: 6px 10px; }
    button { padding: 8px 14px; }
  `]
})
export class AdminPanelComponent {
  public isBusy = signal(false);
  public depositAmount = '';

  constructor(public contractService: ContractService) {}

  async deposit(): Promise<void> {
    if (!this.depositAmount) return;
    this.isBusy.set(true);
    try { await this.contractService.deposit(this.depositAmount); } finally { this.isBusy.set(false); }
  }
  async pause(): Promise<void> { this.isBusy.set(true); try { await this.contractService.pauseContract(); } finally { this.isBusy.set(false); } }
  async resume(): Promise<void> { this.isBusy.set(true); try { await this.contractService.resumeContract(); } finally { this.isBusy.set(false); } }
  async withdrawAll(): Promise<void> { this.isBusy.set(true); try { await this.contractService.withdrawAll(); } finally { this.isBusy.set(false); } }
  async refresh(): Promise<void> { await this.contractService.updateContractInfo(); }
}
