import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpRequestConfigComponent } from './http-request-config.component';
import { EmailConfigComponent } from './email-config.component';
import { DelayConfigComponent } from './delay-config.component';
import { ConditionConfigComponent } from './condition-config.component';
import { AiChatConfigComponent } from './ai-chat-config.component';
import { AiAgentConfigComponent } from './ai-agent-config.component';
import { ChatModelConfigComponent } from './chat-model-config.component';
import { ToolNodeConfigComponent } from './tool-node-config.component';
import { MemoryNodeConfigComponent } from './memory-node-config.component';
import { TextSummarizerConfigComponent } from './text-summarizer-config.component';
import { ScheduleConfigComponent } from './schedule-config.component';
import { ChatMessageConfigComponent } from './chat-message-config.component';
import { SqlQueryConfigComponent } from './sql-query-config.component';
import { SlackConfigComponent } from './slack-config.component';
import { SubWorkflowConfigComponent } from './sub-workflow-config.component';
import { DefaultConfigComponent } from './default-config.component';

@Component({
  selector: 'app-node-config-host',
  standalone: true,
  imports: [
    CommonModule,
    HttpRequestConfigComponent,
    EmailConfigComponent,
    DelayConfigComponent,
    ConditionConfigComponent,
    AiChatConfigComponent,
    AiAgentConfigComponent,
    ChatModelConfigComponent,
    ToolNodeConfigComponent,
    MemoryNodeConfigComponent,
    TextSummarizerConfigComponent,
    ScheduleConfigComponent,
    ChatMessageConfigComponent,
    SqlQueryConfigComponent,
    SlackConfigComponent,
    SubWorkflowConfigComponent,
    DefaultConfigComponent,
  ],
  template: `
    @switch (node?.type) {
      @case ('HttpRequest') {
        <app-http-request-config [node]="node" (configChange)="configChange.emit($event)" />
      }
      @case ('Email') {
        <app-email-config [node]="node" (configChange)="configChange.emit($event)" />
      }
      @case ('Delay') {
        <app-delay-config [node]="node" (configChange)="configChange.emit($event)" />
      }
      @case ('Condition') {
        <app-condition-config [node]="node" (configChange)="configChange.emit($event)" />
      }
      @case ('AiChat') {
        <app-ai-chat-config [node]="node" (configChange)="configChange.emit($event)" />
      }
      @case ('AiAgent') {
        <app-ai-agent-config [node]="node" (configChange)="configChange.emit($event)" />
      }
      @case ('ChatModel') {
        <app-chat-model-config [node]="node" (configChange)="configChange.emit($event)" />
      }
      @case ('ToolNode') {
        <app-tool-node-config [node]="node" (configChange)="configChange.emit($event)" />
      }
      @case ('MemoryNode') {
        <app-memory-node-config [node]="node" (configChange)="configChange.emit($event)" />
      }
      @case ('TextSummarizer') {
        <app-text-summarizer-config [node]="node" (configChange)="configChange.emit($event)" />
      }
      @case ('Schedule') {
        <app-schedule-config [node]="node" (configChange)="configChange.emit($event)" />
      }
      @case ('ChatMessage') {
        <app-chat-message-config />
      }
      @case ('SqlQuery') {
        <app-sql-query-config [node]="node" (configChange)="configChange.emit($event)" />
      }
      @case ('Slack') {
        <app-slack-config [node]="node" (configChange)="configChange.emit($event)" />
      }
      @case ('SubWorkflow') {
        <app-sub-workflow-config [node]="node" (configChange)="configChange.emit($event)" />
      }
      @default {
        <app-default-config [node]="node" (rawChange)="rawConfigChange.emit($event)" />
      }
    }
  `
})
export class NodeConfigHostComponent {
  @Input() node: any;
  @Output() configChange = new EventEmitter<{ key: string; value: any }>();
  @Output() rawConfigChange = new EventEmitter<string>();
}
