import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-email-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-group">
      <label>To</label>
      <input class="input" [value]="getConfig('to', '')"
             (input)="onSet('to', $any($event.target).value)"
             placeholder="recipient&#64;example.com" />
    </div>
    <div class="form-group">
      <label>Subject</label>
      <input class="input" [value]="getConfig('subject', '')"
             (input)="onSet('subject', $any($event.target).value)"
             placeholder="Email subject" />
    </div>
    <div class="form-group">
      <label>Body (HTML)</label>
      <textarea class="input config-textarea" rows="5"
                [value]="getConfig('body', '')"
                (input)="onSet('body', $any($event.target).value)"
                placeholder="<h1>Hello</h1>"></textarea>
    </div>
  `
})
export class EmailConfigComponent {
  @Input() node: any;
  @Output() configChange = new EventEmitter<{ key: string; value: any }>();

  getConfig(key: string, defaultVal: any = ''): any {
    try {
      const cfg = JSON.parse(this.node?.configuration || '{}');
      return cfg[key] ?? defaultVal;
    } catch { return defaultVal; }
  }

  onSet(key: string, value: any) {
    this.configChange.emit({ key, value });
  }
}
