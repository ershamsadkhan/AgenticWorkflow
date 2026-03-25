import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tool-node-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-group">
      <label>Tool Name</label>
      <input class="input" [value]="getConfig('toolName', '')"
             (input)="onSet('toolName', $any($event.target).value)"
             placeholder="e.g., web_search, calculate, send_email" />
    </div>
    <div class="form-group">
      <label>Tool Description</label>
      <textarea class="input config-textarea" rows="2"
                [value]="getConfig('description', '')"
                (input)="onSet('description', $any($event.target).value)"
                placeholder="What does this tool do?"></textarea>
    </div>
    <div class="form-group">
      <label>Input Parameters (JSON)</label>
      <textarea class="input config-textarea" rows="3"
                [value]="getConfig('parameters', '{}')"
                (input)="onSet('parameters', $any($event.target).value)"
                placeholder='{"query": "string", "limit": "number"}'></textarea>
    </div>
    <div class="form-group">
      <label>Function/Handler ID</label>
      <input class="input" [value]="getConfig('handlerId', '')"
             (input)="onSet('handlerId', $any($event.target).value)"
             placeholder="Reference to handler (Code node, HTTP endpoint, etc)" />
    </div>
  `
})
export class ToolNodeConfigComponent {
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
