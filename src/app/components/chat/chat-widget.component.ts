import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, Message, Conversation } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-widget.component.html',
  styleUrl: './chat-widget.component.css'
})
export class ChatWidgetComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  conversation: Conversation | null = null;
  messages: Message[] = [];
  newMessage = '';
  isLoading = false;
  currentUserRole: string = '';
  currentUserId: number = 0;
  unreadCount = 0;
  isMinimized = false; // Widget opens by default
  
  private refreshSubscription?: Subscription;
  private messagesRefreshSubscription?: Subscription;

  constructor(
    private chatService: ChatService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserRole = user.role;
      this.currentUserId = user.id;
    }
    
    this.loadConversation();
    
    // Refresh messages every 2 seconds
    this.messagesRefreshSubscription = interval(2000).subscribe(() => {
      if (this.conversation && !this.isMinimized) {
        this.loadMessages();
      }
    });
    
    // Refresh unread count every 5 seconds
    this.refreshSubscription = interval(5000).subscribe(() => {
      this.loadUnreadCount();
    });
  }

  ngAfterViewChecked() {
    if (!this.isMinimized) {
      this.scrollToBottom();
    }
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
    if (this.messagesRefreshSubscription) {
      this.messagesRefreshSubscription.unsubscribe();
    }
  }

  scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = 
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  loadConversation() {
    this.chatService.getOrCreateConversation().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.conversation = response.data;
          this.loadMessages();
        }
      },
      error: (error: any) => {
        console.error('Error loading conversation:', error);
      }
    });
  }

  loadMessages() {
    if (!this.conversation) return;

    this.chatService.getMessages(this.conversation.id, 1, 50).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.messages = response.data.messages;
        }
      },
      error: (error: any) => {
        console.error('Error loading messages:', error);
      }
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.conversation) return;

    this.isLoading = true;
    this.chatService.sendMessage(this.conversation.id, this.newMessage.trim()).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.newMessage = '';
          this.loadMessages();
          this.loadUnreadCount();
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error sending message:', error);
        this.isLoading = false;
      }
    });
  }

  loadUnreadCount() {
    this.chatService.getUnreadCount().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.unreadCount = response.data.count;
        }
      },
      error: (error: any) => {
        console.error('Error loading unread count:', error);
      }
    });
  }

  isMyMessage(message: Message): boolean {
    return message.senderId === this.currentUserId;
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `منذ ${days} يوم`;
    
    return date.toLocaleDateString('ar-EG', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
  }
}

