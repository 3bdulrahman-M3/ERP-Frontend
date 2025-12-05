import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, Message, Conversation } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { ModalService } from '../../services/modal.service';
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
  selectedFile: File | null = null;
  isLoading = false;
  currentUserRole: string = '';
  currentUserId: number = 0;
  unreadCount = 0;
  isMinimized = true; // Widget closed by default
  window = window; // For template access
  private shouldScrollToBottom = true; // Track if we should auto-scroll
  private previousMessageCount = 0; // Track previous message count
  
  private refreshSubscription?: Subscription;
  private messagesRefreshSubscription?: Subscription;

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private modalService: ModalService
  ) {}

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserRole = user.role;
      this.currentUserId = user.id;
    }
    
    // Only load conversation when widget is opened
    if (!this.isMinimized) {
      this.loadConversation();
    }
    
    // Refresh messages every 2 seconds (only when widget is open)
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
    // Only scroll if user is at bottom or just sent a message
    if (!this.isMinimized && this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false; // Reset after scrolling
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

  isNearBottom(): boolean {
    try {
      if (!this.messagesContainer) return true;
      const element = this.messagesContainer.nativeElement;
      const threshold = 100; // 100px from bottom
      const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < threshold;
      return isNearBottom;
    } catch (err) {
      return true; // Default to true if we can't check
    }
  }

  onScroll() {
    // Update shouldScrollToBottom based on scroll position
    this.shouldScrollToBottom = this.isNearBottom();
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

    // Check if user is near bottom before loading
    const wasNearBottom = this.isNearBottom();
    const previousScrollTop = this.messagesContainer?.nativeElement?.scrollTop || 0;
    const previousScrollHeight = this.messagesContainer?.nativeElement?.scrollHeight || 0;

    this.chatService.getMessages(this.conversation.id, 1, 50).subscribe({
      next: (response: any) => {
        if (response.success) {
          const newMessageCount = response.data.messages.length;
          const hasNewMessages = newMessageCount > this.previousMessageCount;
          this.previousMessageCount = newMessageCount;
          
          this.messages = response.data.messages;
          
          // Use setTimeout to ensure DOM is updated before scrolling
          setTimeout(() => {
            if (wasNearBottom) {
              // User was at bottom, scroll to show new messages
              this.scrollToBottom();
            } else {
              // User is reading old messages, maintain scroll position
              const currentScrollHeight = this.messagesContainer?.nativeElement?.scrollHeight || 0;
              const scrollDiff = currentScrollHeight - previousScrollHeight;
              this.messagesContainer.nativeElement.scrollTop = previousScrollTop + scrollDiff;
            }
          }, 0);
        }
      },
      error: (error: any) => {
        console.error('Error loading messages:', error);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        this.modalService.showAlert({
          title: 'Warning',
          message: 'File size is too large. Maximum size is 10MB'
        }).subscribe();
        return;
      }
      this.selectedFile = file;
      // Clear the input
      event.target.value = '';
    }
  }

  removeSelectedFile() {
    this.selectedFile = null;
  }

  sendMessage() {
    if ((!this.newMessage.trim() && !this.selectedFile) || !this.conversation) return;

    this.isLoading = true;
    this.shouldScrollToBottom = true; // Always scroll when sending a message
    this.chatService.sendMessage(
      this.conversation.id, 
      this.newMessage.trim() || '', 
      this.selectedFile || undefined
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.newMessage = '';
          this.selectedFile = null;
          this.loadMessages();
          this.loadUnreadCount();
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error sending message:', error);
        this.modalService.showAlert({
          title: 'Error',
          message: error.error?.message || 'An error occurred while sending the message'
        }).subscribe();
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
    
    if (minutes < 1) return 'Now';
    if (minutes < 60) return `${minutes} min ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Format date and time for messages (like WhatsApp)
  formatMessageDateTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    
    // Check if same day
    const isToday = date.getDate() === now.getDate() &&
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear();
    
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    if (isToday) {
      // Show only time if same day
      return timeStr;
    } else {
      // Show date and time if different day
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = date.getDate() === yesterday.getDate() &&
                         date.getMonth() === yesterday.getMonth() &&
                         date.getFullYear() === yesterday.getFullYear();
      
      if (isYesterday) {
        return `Yesterday ${timeStr}`;
      } else {
        const dateStr = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
        return `${dateStr} ${timeStr}`;
      }
    }
  }

  toggleMinimize() {
    this.isMinimized = !this.isMinimized;
    // Load conversation and messages when opening the widget
    if (!this.isMinimized && !this.conversation) {
      this.shouldScrollToBottom = true; // Scroll to bottom when opening
      this.loadConversation();
    }
    if (!this.isMinimized && this.conversation) {
      this.shouldScrollToBottom = true; // Scroll to bottom when opening
      this.loadMessages();
    }
  }
}

