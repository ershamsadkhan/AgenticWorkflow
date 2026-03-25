import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sql-query-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-group">
      <label>Operation</label>
      <select class="input" [value]="getConfig('operation', 'select')"
              (change)="onSet('operation', $any($event.target).value)">
        <option value="select">SELECT</option>
        <option value="insert">INSERT</option>
        <option value="update">UPDATE</option>
        <option value="delete">DELETE</option>
        <option value="execute">Execute Procedure</option>
      </select>
    </div>
    <div class="form-group">
      <label>SQL Query</label>
      <textarea class="input config-textarea" rows="6"
                [value]="getConfig('query', '')"
                (input)="onSet('query', $any($event.target).value)"
                placeholder="SELECT * FROM Users WHERE Id = '{{'{{' + '$json.userId' + '}}'}}'"
      ></textarea>
      <span class="form-hint">Expressions supported in queries</span>
    </div>
  `
})
export class SqlQueryConfigComponent {
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
