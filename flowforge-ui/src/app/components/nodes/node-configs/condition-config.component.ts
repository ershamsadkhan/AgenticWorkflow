import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-condition-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-group">
      <label>Combine Conditions</label>
      <select class="input" [value]="getConfig('combineWith', 'AND')"
              (change)="onSet('combineWith', $any($event.target).value)">
        <option value="AND">AND (all must pass)</option>
        <option value="OR">OR (any must pass)</option>
      </select>
    </div>
    <div class="form-group">
      <label>Conditions (JSON)</label>
      <textarea class="input config-textarea" rows="6"
                [value]="getConfig('conditions', '[]')"
                (input)="onSet('conditions', $any($event.target).value)"
                placeholder='[{"field":"status","operator":"equals","value":"active"}]'></textarea>
      <span class="form-hint">Operators: equals, notEquals, contains, greaterThan, lessThan, isEmpty, isNotEmpty</span>
    </div>
  `
})
export class ConditionConfigComponent {
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
