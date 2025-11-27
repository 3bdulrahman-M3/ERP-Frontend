import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService, Message, Conversation } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { LayoutComponent } from '../shared/layout/layout.component';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, LayoutComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  messages: Message[] = [];
  newMessage = '';
  isLoading = false;
  currentUserRole: string = '';
  currentUserId: number = 0;
  unreadCount = 0;
  
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
    
    this.loadConversations();
    this.loadUnreadCount();
    
    // Refresh conversations every 5 seconds
    this.refreshSubscription = interval(5000).subscribe(() => {
      this.loadConversations();
      this.loadUnreadCount();
    });
    
    // Refresh messages every 2 seconds if conversation is selected
    this.messagesRefreshSubscription = interval(2000).subscribe(() => {
      if (this.selectedConversation) {
        this.loadMessages();
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
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

  loadConversations() {
    this.chatService.getAllConversations().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.conversations = response.data;
          
          // If no conversation selected and there are conversations, select the first one
          if (!this.selectedConversation && this.conversations.length > 0) {
            this.selectConversation(this.conversations[0]);
          }
          
          // Update selected conversation if it exists
          if (this.selectedConversation) {
            const updated = this.conversations.find((c: Conversation) => c.id === this.selectedConversation!.id);
            if (updated) {
              this.selectedConversation = updated;
            }
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading conversations:', error);
      }
    });
  }

  loadMessages() {
    if (!this.selectedConversation) return;

    this.chatService.getMessages(this.selectedConversation.id, 1, 100).subscribe({
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

  selectConversation(conversation: Conversation) {
    this.selectedConversation = conversation;
    this.messages = [];
    this.loadMessages();
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation) return;

    this.isLoading = true;
    this.chatService.sendMessage(this.selectedConversation.id, this.newMessage.trim()).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.newMessage = '';
          this.loadMessages();
          this.loadConversations();
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

  getConversationName(conversation: Conversation): string {
    if (this.currentUserRole === 'admin') {
      return conversation.student?.user?.name || conversation.student?.name || 'طالب';
    } else {
      return conversation.admin?.name || 'إدارة';
    }
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

  getSenderImage(message: Message): string | null {
    if (message.sender?.profileImage) {
      return message.sender.profileImage;
    }
    return null;
  }

  getSenderInitial(message: Message): string {
    const name = message.sender?.name || '';
    if (name) {
      return name.charAt(0).toUpperCase();
    }
    return '?';
  }

  getConversationImage(conversation: Conversation): string | null {
    if (this.currentUserRole === 'admin') {
      // For admin: show student's profile image (from student table or user table)
      return conversation.student?.profileImage || conversation.student?.user?.profileImage || null;
    } else {
      // For student: show admin's profile image
      return conversation.admin?.profileImage || null;
    }
  }

  getConversationInitial(conversation: Conversation): string {
    if (this.currentUserRole === 'admin') {
      const name = conversation.student?.user?.name || conversation.student?.name || '';
      if (name) {
        return name.charAt(0).toUpperCase();
      }
    } else {
      const name = conversation.admin?.name || '';
      if (name) {
        return name.charAt(0).toUpperCase();
      }
    }
    return '?';
  }
}

