import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sub-workflow-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-group">
      <label>Sub-Workflow ID</label>
      <input class="input" [value]="getConfig('workflowId', '')"
             (input)="onSet('workflowId', $any($event.target).value)"
             placeholder="workflow-uuid" />
      <span class="form-hint">Paste the ID of the workflow to execute</span>
    </div>
  `
})
export class SubWorkflowConfigComponent {
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
