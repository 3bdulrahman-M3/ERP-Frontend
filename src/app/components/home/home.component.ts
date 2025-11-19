import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  welcomeMessage = 'مرحباً بك في نظام إدارة موارد المؤسسات';
  
  features = [
    {
      title: 'إدارة الموظفين',
      description: 'إدارة شاملة لبيانات الموظفين والحضور والانصراف',
      icon: '👥'
    },
    {
      title: 'إدارة المخزون',
      description: 'تتبع المخزون والمنتجات والمبيعات',
      icon: '📦'
    },
    {
      title: 'التقارير',
      description: 'تقارير مفصلة وإحصائيات شاملة',
      icon: '📊'
    },
    {
      title: 'المالية',
      description: 'إدارة الحسابات والمدفوعات',
      icon: '💰'
    }
  ];
}

