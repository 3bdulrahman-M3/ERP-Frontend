import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ConfirmModalData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export interface AlertModalData {
  title: string;
  message: string;
  buttonText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private confirmSubject = new Subject<ConfirmModalData>();
  private alertSubject = new Subject<AlertModalData>();
  private confirmResponseSubject = new Subject<boolean>();
  private alertResponseSubject = new Subject<void>();

  // Confirm Modal
  showConfirm(data: ConfirmModalData): Observable<boolean> {
    this.confirmSubject.next(data);
    return this.confirmResponseSubject.asObservable();
  }

  getConfirmData(): Observable<ConfirmModalData> {
    return this.confirmSubject.asObservable();
  }

  confirmResponse(confirmed: boolean) {
    this.confirmResponseSubject.next(confirmed);
  }

  // Alert Modal
  showAlert(data: AlertModalData): Observable<void> {
    this.alertSubject.next(data);
    return this.alertResponseSubject.asObservable();
  }

  getAlertData(): Observable<AlertModalData> {
    return this.alertSubject.asObservable();
  }

  alertResponse() {
    this.alertResponseSubject.next();
  }
}

