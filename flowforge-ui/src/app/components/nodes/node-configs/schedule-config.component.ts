import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-schedule-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-group">
      <label>Cron Expression</label>
      <input class="input" [value]="getConfig('cron', '0 * * * *')"
             (input)="onSet('cron', $any($event.target).value)"
             placeholder="0 * * * *" />
    </div>
    <div class="cron-examples">
      <span class="form-hint">Quick presets:</span>
      <div class="cron-btn-row">
        @for (ex of cronExamples; track ex.label) {
          <button class="cron-btn" (click)="onSet('cron', ex.cron)">{{ ex.label }}</button>
        }
      </div>
    </div>
  `
})
export class ScheduleConfigComponent {
  @Input() node: any;
  @Output() configChange = new EventEmitter<{ key: string; value: any }>();

  cronExamples = [
    { label: 'Every minute', cron: '* * * * *' },
    { label: 'Every hour', cron: '0 * * * *' },
    { label: 'Daily 9am', cron: '0 9 * * *' },
    { label: 'Weekly Mon', cron: '0 9 * * 1' },
  ];

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
