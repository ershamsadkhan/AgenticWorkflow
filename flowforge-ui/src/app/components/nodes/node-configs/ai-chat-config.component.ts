import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ai-chat-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-group">
      <label>Model</label>
      <select class="input" [value]="getConfig('model', 'gpt-4o-mini')"
              (change)="onSet('model', $any($event.target).value)">
        <option value="gpt-4o-mini">GPT-4o Mini (fast)</option>
        <option value="gpt-4o">GPT-4o</option>
        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
      </select>
    </div>
    <div class="form-group">
      <label>System Prompt</label>
      <textarea class="input config-textarea" rows="3"
                [value]="getConfig('systemPrompt', 'You are a helpful assistant.')"
                (input)="onSet('systemPrompt', $any($event.target).value)"></textarea>
    </div>
    <div class="form-group">
      <label>User Prompt</label>
      <textarea class="input config-textarea" rows="3"
                [value]="getConfig('prompt', '')"
                (input)="onSet('prompt', $any($event.target).value)"
                placeholder="{{'{{' + '$json.text' + '}}'}}"></textarea>
      <span class="form-hint">Leave empty to use input item's text field</span>
    </div>
    <div class="form-group">
      <label>Max Tokens</label>
      <input class="input" type="number"
             [value]="getConfig('maxTokens', 1000)"
             (input)="onSet('maxTokens', +$any($event.target).value)" />
    </div>
  `
})
export class AiChatConfigComponent {
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
