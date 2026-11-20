import { Injectable, signal } from '@angular/core';

export type ToastType = 'error' | 'success';

export interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly messages = signal<ToastMessage[]>([]);
  private counter = 0;

  show(text: string, type: ToastType = 'error'): void {
    this.counter += 1;
    const id = this.counter;
    this.messages.update((list) => [...list, { id, text, type }]);
    setTimeout(() => this.dismiss(id), 4000);
  }

  dismiss(id: number): void {
    this.messages.update((list) => list.filter((m) => m.id !== id));
  }
}
