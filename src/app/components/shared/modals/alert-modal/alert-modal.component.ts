import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService, AlertModalData } from '../../../../services/modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-alert-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-modal.component.html',
  styleUrl: './alert-modal.component.css'
})
export class AlertModalComponent implements OnInit, OnDestroy {
  show = false;
  data: AlertModalData = {
    title: '',
    message: '',
    buttonText: 'حسناً'
  };
  private subscription?: Subscription;

  constructor(private modalService: ModalService) {}

  ngOnInit() {
    this.subscription = this.modalService.getAlertData().subscribe(data => {
      this.data = {
        title: data.title,
        message: data.message,
        buttonText: data.buttonText || 'حسناً'
      };
      this.show = true;
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  close() {
    this.modalService.alertResponse();
    this.show = false;
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close();
    }
  }
}

