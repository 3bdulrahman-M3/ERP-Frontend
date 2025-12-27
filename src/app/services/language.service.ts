import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';

export type Language = 'ar' | 'en';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguageSubject = new BehaviorSubject<Language>(this.getStoredLanguage());
  public currentLanguage$: Observable<Language> = this.currentLanguageSubject.asObservable();

  private translationsCache: { [key: string]: any } = {};
  private translationsLoaded$: { [key: string]: Observable<any> } = {};

  constructor(private http: HttpClient) {
    this.applyLanguage(this.getCurrentLanguage());
    // Preload translations
    this.loadTranslations('ar');
    this.loadTranslations('en');
  }

  getCurrentLanguage(): Language {
    return this.currentLanguageSubject.value;
  }

  setLanguage(lang: Language): void {
    localStorage.setItem('language', lang);
    this.currentLanguageSubject.next(lang);
    this.applyLanguage(lang);
  }

  toggleLanguage(): void {
    const newLang = this.getCurrentLanguage() === 'ar' ? 'en' : 'ar';
    this.setLanguage(newLang);
  }

  translate(key: string, params?: { [key: string]: any }): string {
    const lang = this.getCurrentLanguage();
    const translations = this.translationsCache[lang];
    
    if (!translations) {
      return key;
    }

    // Support nested keys like "common.save" or "menu.dashboard"
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    if (typeof value !== 'string') {
      return key;
    }

    // Replace parameters if provided
    if (params) {
      Object.keys(params).forEach(paramKey => {
        value = value.replace(`{{${paramKey}}}`, params[paramKey]);
      });
    }

    return value;
  }

  private loadTranslations(lang: Language): Observable<any> {
    if (this.translationsLoaded$[lang]) {
      return this.translationsLoaded$[lang];
    }

    const translations$ = this.http.get(`/assets/i18n/${lang}.json`).pipe(
      map(translations => {
        this.translationsCache[lang] = translations;
        return translations;
      }),
      catchError(error => {
        console.error(`Error loading ${lang} translations:`, error);
        return of({});
      }),
      shareReplay(1)
    );

    this.translationsLoaded$[lang] = translations$;
    return translations$;
  }

  private getStoredLanguage(): Language {
    const stored = localStorage.getItem('language') as Language;
    return stored && (stored === 'ar' || stored === 'en') ? stored : 'en';
  }

  private applyLanguage(lang: Language): void {
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    
    // Update body class for RTL/LTR styling
    document.body.classList.remove('rtl', 'ltr');
    document.body.classList.add(lang === 'ar' ? 'rtl' : 'ltr');
    
    // Load translations if not already loaded
    if (!this.translationsCache[lang]) {
      this.loadTranslations(lang).subscribe();
    }
  }

  isRTL(): boolean {
    return this.getCurrentLanguage() === 'ar';
  }

  // Helper method to get translations as observable
  getTranslations(lang?: Language): Observable<any> {
    const targetLang = lang || this.getCurrentLanguage();
    if (this.translationsCache[targetLang]) {
      return of(this.translationsCache[targetLang]);
    }
    return this.loadTranslations(targetLang);
  }
}

