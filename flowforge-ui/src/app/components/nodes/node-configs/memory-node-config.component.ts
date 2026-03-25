import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-memory-node-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-group">
      <label>Memory Type</label>
      <select class="input" [value]="getConfig('memoryType', 'redis')"
              (change)="onSet('memoryType', $any($event.target).value)">
        <option value="redis">Redis (Key-Value Cache)</option>
        <option value="vectordb">Vector DB (Semantic Search)</option>
        <option value="longterm">Long-term Memory (SQL)</option>
        <option value="shortterm">Short-term Memory (Session)</option>
        <option value="custom">Custom</option>
      </select>
    </div>
    <div class="form-group">
      <label>Connection String / Config</label>
      <input class="input" [value]="getConfig('connectionString', '')"
             (input)="onSet('connectionString', $any($event.target).value)"
             placeholder="redis://localhost:6379 or connection details" />
    </div>
    <div class="form-group">
      <label>Memory Key Prefix</label>
      <input class="input" [value]="getConfig('keyPrefix', 'agent_')"
             (input)="onSet('keyPrefix', $any($event.target).value)"
             placeholder="agent_" />
      <span class="form-hint">Prefix for memory keys to avoid conflicts</span>
    </div>
    <div class="form-group">
      <label>TTL (seconds)</label>
      <input class="input" type="number" [value]="getConfig('ttl', 3600)"
             (input)="onSet('ttl', +$any($event.target).value)"
             placeholder="3600" />
      <span class="form-hint">Time to live for memory entries (0 = no expiry)</span>
    </div>
  `
})
export class MemoryNodeConfigComponent {
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
