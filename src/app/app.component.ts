import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ConfirmModalComponent } from './components/shared/modals/confirm-modal/confirm-modal.component';
import { AlertModalComponent } from './components/shared/modals/alert-modal/alert-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ConfirmModalComponent, AlertModalComponent],
  template: `
    <router-outlet></router-outlet>
    <app-confirm-modal></app-confirm-modal>
    <app-alert-modal></app-alert-modal>
  `
})
export class AppComponent {
  title = 'ERP System';
}

