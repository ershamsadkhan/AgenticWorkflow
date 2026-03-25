import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ai-agent-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-group">
      <label>System Instructions</label>
      <textarea class="input config-textarea" rows="3"
                [value]="getConfig('systemPrompt', 'You are an intelligent AI agent with access to models, memory, and tools.')"
                (input)="onSet('systemPrompt', $any($event.target).value)"></textarea>
    </div>
    <div class="form-group">
      <label>Task/Objective</label>
      <textarea class="input config-textarea" rows="3"
                [value]="getConfig('task', '')"
                (input)="onSet('task', $any($event.target).value)"
                placeholder="Define the agent's task or objective..."></textarea>
    </div>
    <div class="form-group">
      <label>Max Iterations</label>
      <input class="input" type="number" [value]="getConfig('maxIterations', 10)"
             (input)="onSet('maxIterations', +$any($event.target).value)" />
      <span class="form-hint">Maximum number of tool calls before stopping</span>
    </div>
    <div class="info-box" style="border-left: 3px solid #06b6d4;">
      <span class="form-hint"><strong style="color: #06b6d4;">📥 Input Connections</strong></span><br>
      <span class="form-hint" style="font-size: 11px;">
        🔵 <strong>Data:</strong> Input from triggers or previous nodes<br>
        🔵 <strong>Model:</strong> Connect 1 Chat Model node<br>
        🟣 <strong>Memory:</strong> Connect 1 Memory node (Redis, Vector DB)<br>
        🟠 <strong>Tools:</strong> Connect multiple Tool nodes
      </span>
    </div>
  `
})
export class AiAgentConfigComponent {
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
