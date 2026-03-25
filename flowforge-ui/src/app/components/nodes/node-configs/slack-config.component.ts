import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-slack-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-group">
      <label>Channel</label>
      <input class="input" [value]="getConfig('channel', '#general')"
             (input)="onSet('channel', $any($event.target).value)"
             placeholder="#general or &#64;username" />
    </div>
    <div class="form-group">
      <label>Message</label>
      <textarea class="input config-textarea" rows="4"
                [value]="getConfig('text', '')"
                (input)="onSet('text', $any($event.target).value)"
                placeholder="Hello from FlowForge!"></textarea>
    </div>
  `
})
export class SlackConfigComponent {
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
