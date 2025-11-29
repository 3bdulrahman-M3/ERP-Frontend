import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderRole: 'admin' | 'student';
  content: string | null;
  attachmentUrl?: string | null;
  attachmentType?: 'image' | 'file' | null;
  attachmentName?: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: number;
    name: string;
    email: string;
    profileImage?: string;
  };
}

export interface Conversation {
  id: number;
  studentId: number;
  adminId?: number | null;
  lastMessageAt?: string | null;
  lastMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: number;
    name: string;
    profileImage?: string;
    user?: {
      id: number;
      name: string;
      email: string;
      profileImage?: string;
    };
  };
  admin?: {
    id: number;
    name: string;
    email: string;
    profileImage?: string;
  };
}

export interface MessagesResponse {
  success: boolean;
  message: string;
  data: {
    messages: Message[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface ConversationResponse {
  success: boolean;
  message: string;
  data: Conversation;
}

export interface ConversationsResponse {
  success: boolean;
  message: string;
  data: Conversation[];
}

export interface UnreadCountResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
  };
}

export interface SendMessageRequest {
  conversationId: number;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = `${environment.apiUrl}/api/chat`;

  constructor(private http: HttpClient) {}

  getOrCreateConversation(studentId?: number): Observable<ConversationResponse> {
    return this.http.post<ConversationResponse>(`${this.apiUrl}/conversations`, { studentId });
  }

  getAllConversations(): Observable<ConversationsResponse> {
    return this.http.get<ConversationsResponse>(`${this.apiUrl}/conversations`);
  }

  getConversationById(id: number): Observable<ConversationResponse> {
    return this.http.get<ConversationResponse>(`${this.apiUrl}/conversations/${id}`);
  }

  getMessages(conversationId: number, page: number = 1, limit: number = 50): Observable<MessagesResponse> {
    return this.http.get<MessagesResponse>(`${this.apiUrl}/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
  }

  sendMessage(conversationId: number, content: string, file?: File): Observable<{ success: boolean; data: Message }> {
    const formData = new FormData();
    formData.append('conversationId', conversationId.toString());
    if (content && content.trim()) {
      formData.append('content', content.trim());
    }
    if (file) {
      formData.append('attachment', file);
    }
    
    return this.http.post<{ success: boolean; data: Message }>(`${this.apiUrl}/messages`, formData);
  }

  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count`);
  }
}

