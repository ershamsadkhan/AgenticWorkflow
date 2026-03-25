import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-http-request-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-group">
      <label>Method</label>
      <select class="input" [value]="getConfig('method', 'GET')"
              (change)="onSet('method', $any($event.target).value)">
        <option>GET</option><option>POST</option><option>PUT</option>
        <option>PATCH</option><option>DELETE</option>
      </select>
    </div>
    <div class="form-group">
      <label>URL</label>
      <input class="input" [value]="getConfig('url', '')"
             (input)="onSet('url', $any($event.target).value)"
             placeholder="https://api.example.com/endpoint" />
      <span class="form-hint">Supports expressions: {{'{{' + '$json.id' + '}}'}}</span>
    </div>
    <div class="form-group">
      <label>Body (JSON)</label>
      <textarea class="input config-textarea" rows="4"
                [value]="getConfig('body', '')"
                (input)="onSet('body', $any($event.target).value)"
                placeholder='{"key": "value"}'></textarea>
    </div>
    <div class="form-group">
      <label>Auth Type</label>
      <select class="input" [value]="getConfig('authType', 'none')"
              (change)="onSet('authType', $any($event.target).value)">
        <option value="none">None</option>
        <option value="bearer">Bearer Token</option>
        <option value="basic">Basic Auth</option>
      </select>
    </div>
  `
})
export class HttpRequestConfigComponent {
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
