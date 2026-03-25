import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delay-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-group">
      <label>Delay (milliseconds)</label>
      <input class="input" type="number" min="0" max="30000"
             [value]="getConfig('delayMs', 1000)"
             (input)="onSet('delayMs', +$any($event.target).value)"
             placeholder="1000" />
      <span class="form-hint">Maximum 30 seconds (30000ms)</span>
    </div>
  `
})
export class DelayConfigComponent {
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
