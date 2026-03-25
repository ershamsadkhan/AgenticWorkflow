import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-text-summarizer-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-group">
      <label>Text Field</label>
      <input class="input" [value]="getConfig('textField', 'text')"
             (input)="onSet('textField', $any($event.target).value)"
             placeholder="text" />
      <span class="form-hint">Field from input items containing text to summarize</span>
    </div>
    <div class="form-group">
      <label>Style</label>
      <select class="input" [value]="getConfig('style', 'concise')"
              (change)="onSet('style', $any($event.target).value)">
        <option value="concise">Concise</option>
        <option value="detailed">Detailed</option>
        <option value="bullet">Bullet points</option>
      </select>
    </div>
    <div class="form-group">
      <label>Max Words</label>
      <input class="input" type="number" [value]="getConfig('maxLength', 200)"
             (input)="onSet('maxLength', +$any($event.target).value)" />
    </div>
  `
})
export class TextSummarizerConfigComponent {
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
