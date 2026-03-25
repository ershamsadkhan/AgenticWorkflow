import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-model-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-group">
      <label>Model Provider</label>
      <select class="input" [value]="getConfig('provider', 'openai')"
              (change)="onSet('provider', $any($event.target).value)">
        <option value="openai">OpenAI (GPT-4, GPT-3.5)</option>
        <option value="anthropic">Anthropic (Claude)</option>
        <option value="google">Google (Gemini)</option>
        <option value="azure">Azure OpenAI</option>
      </select>
    </div>
    <div class="form-group">
      <label>Model Name</label>
      <select class="input" [value]="getConfig('modelName', 'gpt-4o')"
              (change)="onSet('modelName', $any($event.target).value)">
        <option value="gpt-4o">GPT-4o (recommended)</option>
        <option value="gpt-4-turbo">GPT-4 Turbo</option>
        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        <option value="claude-3-opus">Claude 3 Opus</option>
        <option value="claude-3-sonnet">Claude 3 Sonnet</option>
      </select>
    </div>
    <div class="form-group">
      <label>Temperature</label>
      <input class="input" type="number" step="0.1" min="0" max="2"
             [value]="getConfig('temperature', 0.7)"
             (input)="onSet('temperature', +$any($event.target).value)" />
      <span class="form-hint">0 = deterministic, 1 = creative, higher = more random</span>
    </div>
    <div class="form-group">
      <label>Max Tokens</label>
      <input class="input" type="number" [value]="getConfig('maxTokens', 2000)"
             (input)="onSet('maxTokens', +$any($event.target).value)" />
    </div>
  `
})
export class ChatModelConfigComponent {
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
