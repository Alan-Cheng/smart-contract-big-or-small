import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WalletConnectComponent } from '../wallet-connect/wallet-connect.component';
import { GameBoardComponent } from '../game-board/game-board.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, WalletConnectComponent, GameBoardComponent],
  template: `
    <div class="container">
      <app-wallet-connect></app-wallet-connect>
      <app-game-board></app-game-board>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
      display: flex;
      gap: 20px;
      flex-direction: column;
    }
  `]
})
export class HomeComponent {}
