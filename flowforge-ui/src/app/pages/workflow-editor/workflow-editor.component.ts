import { Component, inject, signal, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { WorkflowNode, NodeConnection, NodeType, NODE_DEFINITIONS, NodeDefinition, WorkflowExecution } from '../../models/workflow.model';
import { Subscription } from 'rxjs';

interface CanvasNode extends WorkflowNode {
  def: NodeDefinition;
  selected?: boolean;
  execStatus?: 'success' | 'failed' | 'running' | 'pending';
}

@Component({
  selector: 'app-workflow-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="editor-layout">
      <!-- Toolbar -->
      <div class="editor-toolbar">
        <div class="toolbar-left">
          <button class="btn btn-ghost btn-sm" (click)="router.navigate(['/workflows'])">← Back</button>
          <div class="toolbar-divider"></div>
          <input class="workflow-name-input" [(ngModel)]="workflowName" placeholder="Untitled Workflow" />
          @if (workflowId()) {
            <span class="version-badge">v{{ workflowVersion }}</span>
          }
        </div>
        <div class="toolbar-center">
          <div class="zoom-controls">
            <button class="btn-icon" (click)="zoomOut()">−</button>
            <span class="zoom-level">{{ Math.round(zoom() * 100) }}%</span>
            <button class="btn-icon" (click)="zoomIn()">+</button>
            <button class="btn-icon" (click)="fitToScreen()" title="Fit to screen">⊡</button>
          </div>
        </div>
        <div class="toolbar-right">
          @if (executionStatus()) {
            <div class="exec-status" [class]="'exec-' + executionStatus()">
              @if (executionStatus() === 'Running') { <span class="spinner"></span> }
              {{ executionStatus() }}
            </div>
          }
          <select class="input status-select" [(ngModel)]="workflowStatus">
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button class="btn btn-ghost btn-sm" (click)="exportWorkflow()" title="Export JSON">⬇ Export</button>
          <label class="btn btn-ghost btn-sm" title="Import JSON">
            ⬆ Import
            <input type="file" accept=".json" (change)="importWorkflow($event)" style="display:none" />
          </label>
          <button class="btn btn-secondary btn-sm" (click)="executeWorkflow()" [disabled]="nodes().length === 0 || executionStatus() === 'Running'">
            @if (executionStatus() === 'Running') { <span class="spinner-sm"></span> } @else { ▶ }
            Execute
          </button>
          <button class="btn btn-primary btn-sm" (click)="saveWorkflow()">💾 Save</button>
        </div>
      </div>

      <div class="editor-body">
        <!-- Node Palette -->
        <div class="node-palette" [class.collapsed]="paletteCollapsed()">
          <div class="palette-header">
            @if (!paletteCollapsed()) {
              <span class="palette-title">Nodes</span>
              <input class="input palette-search" placeholder="Search..." [(ngModel)]="nodeSearch" />
            }
            <button class="btn-icon" (click)="togglePalette()">{{ paletteCollapsed() ? '▶' : '◀' }}</button>
          </div>
          @if (!paletteCollapsed()) {
            @for (category of getCategories(); track category) {
              <div class="palette-section">
                <div class="palette-section-title">{{ category }}</div>
                @for (def of getNodesByCategory(category); track def.type) {
                  <div class="palette-node" draggable="true"
                       (dragstart)="onDragStart($event, def)" (click)="addNodeToCenter(def)">
                    <div class="palette-node-icon" [style.background]="def.color">{{ def.icon }}</div>
                    <div class="palette-node-info">
                      <span class="palette-node-name">{{ def.name }}</span>
                      <span class="palette-node-desc">{{ def.description }}</span>
                    </div>
                  </div>
                }
              </div>
            }
          }
        </div>

        <!-- Canvas -->
        <div class="canvas-container" #canvasContainer
             (mousedown)="onCanvasMouseDown($event)"
             (mousemove)="onCanvasMouseMove($event)"
             (mouseup)="onCanvasMouseUp()"
             (wheel)="onWheel($event)"
             (dragover)="onDragOver($event)"
             (drop)="onDrop($event)">
          <svg class="canvas-svg" [attr.viewBox]="getViewBox()">
            <defs>
              <pattern id="grid" [attr.width]="20 / zoom()" [attr.height]="20 / zoom()" patternUnits="userSpaceOnUse">
                <circle [attr.cx]="1 / zoom()" [attr.cy]="1 / zoom()" [attr.r]="0.5 / zoom()" fill="var(--border-primary)" opacity="0.5"/>
              </pattern>
              <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="var(--border-secondary)" />
              </marker>
            </defs>
            <rect width="10000" height="10000" x="-5000" y="-5000" fill="url(#grid)" />

            <!-- Connections -->
            @for (conn of connections(); track conn.id) {
              <g class="connection-group">
                <path [attr.d]="getConnectionPath(conn)" 
                      class="connection-line"
                      [style.stroke]="getConnectionColor(conn)"
                      marker-end="url(#arrowhead)" />
                <path [attr.d]="getConnectionPath(conn)" class="connection-line-hover"
                      (click)="deleteConnection(conn)" />
                @if (conn.label) {
                  <text class="conn-label">{{ conn.label }}</text>
                }
              </g>
            }
            @if (tempConnection()) {
              <path [attr.d]="tempConnection()" class="connection-line temp" />
            }

            <!-- Nodes -->
            @for (node of nodes(); track node.id) {
              <g [attr.transform]="'translate(' + node.positionX + ',' + node.positionY + ')'"
                 class="canvas-node" [class.selected]="node.selected"
                 [class.disabled]="node.isDisabled"
                 (mousedown)="onNodeMouseDown($event, node)">
                <!-- Node shadow + body -->
                <rect width="200" [attr.height]="node.type === 'AiAgent' ? 120 : (node.def.inputs > 1 ? 68 + (node.def.inputs - 1) * 14 : 68)" rx="12" class="node-shadow" />
                <rect width="200" [attr.height]="node.type === 'AiAgent' ? 120 : (node.def.inputs > 1 ? 68 + (node.def.inputs - 1) * 14 : 68)" rx="12" class="node-body"
                      [style.stroke]="node.selected ? 'var(--accent-primary)' : node.execStatus === 'success' ? '#22c55e' : node.execStatus === 'failed' ? '#ef4444' : node.execStatus === 'running' ? '#3b82f6' : 'var(--border-primary)'"
                      [style.stroke-width]="node.execStatus ? '2.5' : '1.5'" />
                <!-- Color bar -->
                <rect width="4" [attr.height]="node.type === 'AiAgent' ? 120 : (node.def.inputs > 1 ? 68 + (node.def.inputs - 1) * 14 : 68)" rx="2" [attr.fill]="node.def.color" />
                <!-- Icon bg -->
                <rect x="12" y="14" width="36" height="36" rx="8" [attr.fill]="node.def.color" opacity="0.15" />
                <text x="30" y="38" text-anchor="middle" class="node-icon-text" [attr.fill]="node.def.color">{{ node.def.icon }}</text>
                <!-- Text -->
                <text x="58" y="28" class="node-name">{{ truncate(node.name, 18) }}</text>
                <text x="58" y="45" class="node-type">{{ node.def.name }}</text>
                <!-- Exec badge -->
                @if (node.execStatus) {
                  <circle cx="188" cy="12" r="8"
                          [attr.fill]="node.execStatus === 'success' ? '#22c55e' : node.execStatus === 'failed' ? '#ef4444' : '#3b82f6'" />
                  <text x="188" y="16" text-anchor="middle" font-size="9" fill="white">
                    {{ node.execStatus === 'success' ? '✓' : node.execStatus === 'failed' ? '✕' : '⟳' }}
                  </text>
                }
                <!-- Input handle(s) -->
                @if (node.def.inputs === 1) {
                  <circle cx="0" cy="34" r="6" class="handle input-handle"
                          (mouseup)="onHandleMouseUp(node, 'input')" />
                  <circle cx="0" cy="34" r="3" class="handle-inner" />
                } @else if (node.def.inputs > 1 && node.type !== 'AiAgent') {
                  @for (i of range(node.def.inputs); track i) {
                    <!-- Regular nodes: standard input handles -->
                    <g class="input-group">
                      <circle cx="0" [attr.cy]="14 + i * 14" r="5" class="handle input-handle"
                              (mouseup)="onHandleMouseUp(node, 'input' + i)" />
                      <circle cx="0" [attr.cy]="14 + i * 14" r="2.5" class="handle-inner" />
                    </g>
                  }
                }
                <!-- Output handle(s) -->
                @if (node.def.outputs === 1) {
                  <circle cx="200" cy="34" r="6" class="handle output-handle"
                          (mousedown)="onHandleMouseDown($event, node, 'output')" />
                  <circle cx="200" cy="34" r="3" class="handle-inner-out" />
                } @else if (node.def.outputs === 2) {
                  <circle cx="200" cy="22" r="5" class="handle output-handle"
                          (mousedown)="onHandleMouseDown($event, node, 'true')" />
                  <text x="212" y="26" class="handle-label">T</text>
                  <circle cx="200" cy="46" r="5" class="handle output-handle"
                          (mousedown)="onHandleMouseDown($event, node, 'false')" />
                  <text x="212" y="50" class="handle-label">F</text>
                } @else if (node.def.outputs > 2) {
                  @for (i of range(node.def.outputs); track i) {
                    <circle [attr.cx]="200" [attr.cy]="14 + i * 14" r="4" class="handle output-handle"
                            (mousedown)="onHandleMouseDown($event, node, 'output' + i)" />
                  }
                }
                
                <!-- AI Agent bottom input connectors -->
                @if (node.type === 'AiAgent') {
                  <g class="agent-inputs">
                    <!-- Chat Model connector -->
                    <g class="agent-input-group">
                      <circle cx="38" cy="100" r="4" class="handle input-handle"
                              [style.stroke]="'#06b6d4'"
                              [style.fill]="'#06b6d440'"
                              (mouseup)="onHandleMouseUp(node, 'input0')" />
                      <circle cx="38" cy="100" r="1.5" class="handle-inner" [style.fill]="'#06b6d4'" />
                      <!-- Label -->
                      <text x="38" y="113" text-anchor="middle" font-size="11" font-weight="600" fill="#06b6d4" class="label-text">Chat Model</text>
                      <!-- Plus button -->
                      <circle cx="38" cy="125" r="5" class="add-btn" fill="#06b6d420" stroke="#06b6d4" stroke-width="1" />
                      <text x="38" y="129" text-anchor="middle" font-size="10" font-weight="700" fill="#06b6d4" class="plus-text">+</text>
                    </g>

                    <!-- Memory connector -->
                    <g class="agent-input-group">
                      <circle cx="100" cy="100" r="4" class="handle input-handle"
                              [style.stroke]="'#8b5cf6'"
                              [style.fill]="'#8b5cf640'"
                              (mouseup)="onHandleMouseUp(node, 'input1')" />
                      <circle cx="100" cy="100" r="1.5" class="handle-inner" [style.fill]="'#8b5cf6'" />
                      <!-- Label -->
                      <text x="100" y="113" text-anchor="middle" font-size="11" font-weight="600" fill="#8b5cf6" class="label-text">Memory</text>
                      <!-- Plus button -->
                      <circle cx="100" cy="125" r="5" class="add-btn" fill="#8b5cf640" stroke="#8b5cf6" stroke-width="1" />
                      <text x="100" y="129" text-anchor="middle" font-size="10" font-weight="700" fill="#8b5cf6" class="plus-text">+</text>
                    </g>

                    <!-- Tool connector -->
                    <g class="agent-input-group">
                      <circle cx="162" cy="100" r="4" class="handle input-handle"
                              [style.stroke]="'#f97316'"
                              [style.fill]="'#f9731640'"
                              (mouseup)="onHandleMouseUp(node, 'input2')" />
                      <circle cx="162" cy="100" r="1.5" class="handle-inner" [style.fill]="'#f97316'" />
                      <!-- Label -->
                      <text x="162" y="113" text-anchor="middle" font-size="11" font-weight="600" fill="#f97316" class="label-text">Tool</text>
                      <!-- Plus button -->
                      <circle cx="162" cy="125" r="5" class="add-btn" fill="#f9731640" stroke="#f97316" stroke-width="1" />
                      <text x="162" y="129" text-anchor="middle" font-size="10" font-weight="700" fill="#f97316" class="plus-text">+</text>
                    </g>
                  </g>
                }
              </g>
            }
          </svg>

          @if (nodes().length === 0) {
            <div class="canvas-empty">
              <div class="empty-icon">⬡</div>
              <h3>Start building your workflow</h3>
              <p>Drag nodes from the palette or click to add them to the canvas</p>
            </div>
          }
        </div>

        <!-- Properties Panel -->
        @if (selectedNode(); as sn) {
          <div class="properties-panel">
            <div class="panel-header">
              <div class="panel-title-row">
                <div class="panel-icon" [style.background]="sn.def.color">{{ sn.def.icon }}</div>
                <div>
                  <h3>{{ sn.def.name }}</h3>
                  <span class="panel-subtitle">{{ sn.def.description }}</span>
                </div>
              </div>
              <button class="btn-icon" (click)="deselectAll()">✕</button>
            </div>

            <div class="panel-body">
              <div class="form-group">
                <label>Name</label>
                <input class="input" [value]="sn.name" (input)="updateNodeProp('name', $event)" />
              </div>
              <div class="form-group">
                <label>Label</label>
                <input class="input" [value]="sn.label || ''" (input)="updateNodeProp('label', $event)" placeholder="Optional display label" />
              </div>

              <!-- Node-specific config -->
              <div class="config-section">
                <div class="config-section-title">Configuration</div>
                @switch (sn.type) {
                  @case ('HttpRequest') {
                    <div class="form-group">
                      <label>Method</label>
                      <select class="input" [value]="getConfig(sn, 'method', 'GET')"
                              (change)="setConfig(sn, 'method', $any($event.target).value)">
                        <option>GET</option><option>POST</option><option>PUT</option>
                        <option>PATCH</option><option>DELETE</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>URL</label>
                      <input class="input" [value]="getConfig(sn, 'url', '')"
                             (input)="setConfig(sn, 'url', $any($event.target).value)"
                             placeholder="https://api.example.com/endpoint" />
                      <span class="form-hint">Supports expressions: {{ '{{' }}$json.id{{ '}}' }}</span>
                    </div>
                    <div class="form-group">
                      <label>Body (JSON)</label>
                      <textarea class="input config-textarea" rows="4"
                                [value]="getConfig(sn, 'body', '')"
                                (input)="setConfig(sn, 'body', $any($event.target).value)"
                                placeholder='{"key": "value"}'></textarea>
                    </div>
                    <div class="form-group">
                      <label>Auth Type</label>
                      <select class="input" [value]="getConfig(sn, 'authType', 'none')"
                              (change)="setConfig(sn, 'authType', $any($event.target).value)">
                        <option value="none">None</option>
                        <option value="bearer">Bearer Token</option>
                        <option value="basic">Basic Auth</option>
                      </select>
                    </div>
                  }
                  @case ('Email') {
                    <div class="form-group">
                      <label>To</label>
                      <input class="input" [value]="getConfig(sn, 'to', '')"
                             (input)="setConfig(sn, 'to', $any($event.target).value)"
                             placeholder="recipient@example.com" />
                    </div>
                    <div class="form-group">
                      <label>Subject</label>
                      <input class="input" [value]="getConfig(sn, 'subject', '')"
                             (input)="setConfig(sn, 'subject', $any($event.target).value)"
                             placeholder="Email subject" />
                    </div>
                    <div class="form-group">
                      <label>Body (HTML)</label>
                      <textarea class="input config-textarea" rows="5"
                                [value]="getConfig(sn, 'body', '')"
                                (input)="setConfig(sn, 'body', $any($event.target).value)"
                                placeholder="<h1>Hello</h1>"></textarea>
                    </div>
                  }
                  @case ('Delay') {
                    <div class="form-group">
                      <label>Delay (milliseconds)</label>
                      <input class="input" type="number" min="0" max="30000"
                             [value]="getConfig(sn, 'delayMs', 1000)"
                             (input)="setConfig(sn, 'delayMs', +$any($event.target).value)"
                             placeholder="1000" />
                      <span class="form-hint">Maximum 30 seconds (30000ms)</span>
                    </div>
                  }
                  @case ('Condition') {
                    <div class="form-group">
                      <label>Combine Conditions</label>
                      <select class="input" [value]="getConfig(sn, 'combineWith', 'AND')"
                              (change)="setConfig(sn, 'combineWith', $any($event.target).value)">
                        <option value="AND">AND (all must pass)</option>
                        <option value="OR">OR (any must pass)</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Conditions (JSON)</label>
                      <textarea class="input config-textarea" rows="6"
                                [value]="getConfig(sn, 'conditions', '[]')"
                                (input)="setConfig(sn, 'conditions', $any($event.target).value)"
                                placeholder='[{"field":"status","operator":"equals","value":"active"}]'></textarea>
                      <span class="form-hint">Operators: equals, notEquals, contains, greaterThan, lessThan, isEmpty, isNotEmpty</span>
                    </div>
                  }
                  @case ('AiChat') {
                    <div class="form-group">
                      <label>Model</label>
                      <select class="input" [value]="getConfig(sn, 'model', 'gpt-4o-mini')"
                              (change)="setConfig(sn, 'model', $any($event.target).value)">
                        <option value="gpt-4o-mini">GPT-4o Mini (fast)</option>
                        <option value="gpt-4o">GPT-4o</option>
                        <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>System Prompt</label>
                      <textarea class="input config-textarea" rows="3"
                                [value]="getConfig(sn, 'systemPrompt', 'You are a helpful assistant.')"
                                (input)="setConfig(sn, 'systemPrompt', $any($event.target).value)"></textarea>
                    </div>
                    <div class="form-group">
                      <label>User Prompt</label>
                      <textarea class="input config-textarea" rows="3"
                                [value]="getConfig(sn, 'prompt', '')"
                                (input)="setConfig(sn, 'prompt', $any($event.target).value)"
                                placeholder="{{ '{{' }}$json.text{{ '}}' }}"></textarea>
                      <span class="form-hint">Leave empty to use input item's text field</span>
                    </div>
                    <div class="form-group">
                      <label>Max Tokens</label>
                      <input class="input" type="number"
                             [value]="getConfig(sn, 'maxTokens', 1000)"
                             (input)="setConfig(sn, 'maxTokens', +$any($event.target).value)" />
                    </div>
                  }
                  @case ('AiAgent') {
                    <div class="form-group">
                      <label>System Instructions</label>
                      <textarea class="input config-textarea" rows="3"
                                [value]="getConfig(sn, 'systemPrompt', 'You are an intelligent AI agent with access to models, memory, and tools.')"
                                (input)="setConfig(sn, 'systemPrompt', $any($event.target).value)"></textarea>
                    </div>
                    <div class="form-group">
                      <label>Task/Objective</label>
                      <textarea class="input config-textarea" rows="3"
                                [value]="getConfig(sn, 'task', '')"
                                (input)="setConfig(sn, 'task', $any($event.target).value)"
                                placeholder="Define the agent's task or objective..."></textarea>
                    </div>
                    <div class="form-group">
                      <label>Max Iterations</label>
                      <input class="input" type="number" [value]="getConfig(sn, 'maxIterations', 10)"
                             (input)="setConfig(sn, 'maxIterations', +$any($event.target).value)" />
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
                  }
                  @case ('ChatModel') {
                    <div class="form-group">
                      <label>Model Provider</label>
                      <select class="input" [value]="getConfig(sn, 'provider', 'openai')"
                              (change)="setConfig(sn, 'provider', $any($event.target).value)">
                        <option value="openai">OpenAI (GPT-4, GPT-3.5)</option>
                        <option value="anthropic">Anthropic (Claude)</option>
                        <option value="google">Google (Gemini)</option>
                        <option value="azure">Azure OpenAI</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Model Name</label>
                      <select class="input" [value]="getConfig(sn, 'modelName', 'gpt-4o')"
                              (change)="setConfig(sn, 'modelName', $any($event.target).value)">
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
                             [value]="getConfig(sn, 'temperature', 0.7)"
                             (input)="setConfig(sn, 'temperature', +$any($event.target).value)" />
                      <span class="form-hint">0 = deterministic, 1 = creative, higher = more random</span>
                    </div>
                    <div class="form-group">
                      <label>Max Tokens</label>
                      <input class="input" type="number" [value]="getConfig(sn, 'maxTokens', 2000)"
                             (input)="setConfig(sn, 'maxTokens', +$any($event.target).value)" />
                    </div>
                  }
                  @case ('ToolNode') {
                    <div class="form-group">
                      <label>Tool Name</label>
                      <input class="input" [value]="getConfig(sn, 'toolName', '')"
                             (input)="setConfig(sn, 'toolName', $any($event.target).value)"
                             placeholder="e.g., web_search, calculate, send_email" />
                    </div>
                    <div class="form-group">
                      <label>Tool Description</label>
                      <textarea class="input config-textarea" rows="2"
                                [value]="getConfig(sn, 'description', '')"
                                (input)="setConfig(sn, 'description', $any($event.target).value)"
                                placeholder="What does this tool do?"></textarea>
                    </div>
                    <div class="form-group">
                      <label>Input Parameters (JSON)</label>
                      <textarea class="input config-textarea" rows="3"
                                [value]="getConfig(sn, 'parameters', '{}')"
                                (input)="setConfig(sn, 'parameters', $any($event.target).value)"
                                placeholder='{"query": "string", "limit": "number"}'></textarea>
                    </div>
                    <div class="form-group">
                      <label>Function/Handler ID</label>
                      <input class="input" [value]="getConfig(sn, 'handlerId', '')"
                             (input)="setConfig(sn, 'handlerId', $any($event.target).value)"
                             placeholder="Reference to handler (Code node, HTTP endpoint, etc)" />
                    </div>
                  }
                  @case ('MemoryNode') {
                    <div class="form-group">
                      <label>Memory Type</label>
                      <select class="input" [value]="getConfig(sn, 'memoryType', 'redis')"
                              (change)="setConfig(sn, 'memoryType', $any($event.target).value)">
                        <option value="redis">Redis (Key-Value Cache)</option>
                        <option value="vectordb">Vector DB (Semantic Search)</option>
                        <option value="longterm">Long-term Memory (SQL)</option>
                        <option value="shortterm">Short-term Memory (Session)</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Connection String / Config</label>
                      <input class="input" [value]="getConfig(sn, 'connectionString', '')"
                             (input)="setConfig(sn, 'connectionString', $any($event.target).value)"
                             placeholder="redis://localhost:6379 or connection details" />
                    </div>
                    <div class="form-group">
                      <label>Memory Key Prefix</label>
                      <input class="input" [value]="getConfig(sn, 'keyPrefix', 'agent_')"
                             (input)="setConfig(sn, 'keyPrefix', $any($event.target).value)"
                             placeholder="agent_" />
                      <span class="form-hint">Prefix for memory keys to avoid conflicts</span>
                    </div>
                    <div class="form-group">
                      <label>TTL (seconds)</label>
                      <input class="input" type="number" [value]="getConfig(sn, 'ttl', 3600)"
                             (input)="setConfig(sn, 'ttl', +$any($event.target).value)"
                             placeholder="3600" />
                      <span class="form-hint">Time to live for memory entries (0 = no expiry)</span>
                    </div>
                  }
                  @case ('TextSummarizer') {
                    <div class="form-group">
                      <label>Text Field</label>
                      <input class="input" [value]="getConfig(sn, 'textField', 'text')"
                             (input)="setConfig(sn, 'textField', $any($event.target).value)"
                             placeholder="text" />
                      <span class="form-hint">Field from input items containing text to summarize</span>
                    </div>
                    <div class="form-group">
                      <label>Style</label>
                      <select class="input" [value]="getConfig(sn, 'style', 'concise')"
                              (change)="setConfig(sn, 'style', $any($event.target).value)">
                        <option value="concise">Concise</option>
                        <option value="detailed">Detailed</option>
                        <option value="bullet">Bullet points</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Max Words</label>
                      <input class="input" type="number" [value]="getConfig(sn, 'maxLength', 200)"
                             (input)="setConfig(sn, 'maxLength', +$any($event.target).value)" />
                    </div>
                  }
                  @case ('Schedule') {
                    <div class="form-group">
                      <label>Cron Expression</label>
                      <input class="input" [value]="getConfig(sn, 'cron', '0 * * * *')"
                             (input)="setConfig(sn, 'cron', $any($event.target).value)"
                             placeholder="0 * * * *" />
                    </div>
                    <div class="cron-examples">
                      <span class="form-hint">Quick presets:</span>
                      <div class="cron-btn-row">
                        @for (ex of cronExamples; track ex.label) {
                          <button class="cron-btn" (click)="setConfig(sn, 'cron', ex.cron)">{{ ex.label }}</button>
                        }
                      </div>
                    </div>
                  }
                  @case ('ChatMessage') {
                    <div class="form-group">
                      <div class="info-box">
                        <span class="form-hint">This trigger receives messages from the chat input window at the bottom. Output will contain: message, timestamp, and sender fields.</span>
                      </div>
                    </div>
                  }
                  @case ('SqlQuery') {
                    <div class="form-group">
                      <label>Operation</label>
                      <select class="input" [value]="getConfig(sn, 'operation', 'select')"
                              (change)="setConfig(sn, 'operation', $any($event.target).value)">
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
                                [value]="getConfig(sn, 'query', '')"
                                (input)="setConfig(sn, 'query', $any($event.target).value)"
                                placeholder="SELECT * FROM Users WHERE Id = '{{ '{{' }}$json.userId{{ '}}' }}'"></textarea>
                      <span class="form-hint">Expressions supported in queries</span>
                    </div>
                  }
                  @case ('Slack') {
                    <div class="form-group">
                      <label>Channel</label>
                      <input class="input" [value]="getConfig(sn, 'channel', '#general')"
                             (input)="setConfig(sn, 'channel', $any($event.target).value)"
                             placeholder="#general or @username" />
                    </div>
                    <div class="form-group">
                      <label>Message</label>
                      <textarea class="input config-textarea" rows="4"
                                [value]="getConfig(sn, 'text', '')"
                                (input)="setConfig(sn, 'text', $any($event.target).value)"
                                placeholder="Hello from FlowForge!"></textarea>
                    </div>
                  }
                  @case ('SubWorkflow') {
                    <div class="form-group">
                      <label>Sub-Workflow ID</label>
                      <input class="input" [value]="getConfig(sn, 'workflowId', '')"
                             (input)="setConfig(sn, 'workflowId', $any($event.target).value)"
                             placeholder="workflow-uuid" />
                      <span class="form-hint">Paste the ID of the workflow to execute</span>
                    </div>
                  }
                  @default {
                    <div class="form-group">
                      <label>Raw JSON Config</label>
                      <textarea class="input config-textarea" [value]="sn.configuration || ''"
                                (input)="updateNodeProp('configuration', $event)"
                                placeholder='{ "key": "value" }' rows="8"></textarea>
                    </div>
                  }
                }
              </div>

              <div class="form-group">
                <label>Notes</label>
                <textarea class="input" [value]="sn.notes || ''" (input)="updateNodeProp('notes', $event)"
                          placeholder="Add notes..." rows="2"></textarea>
              </div>

              <div class="toggle-row">
                <label class="toggle-label">
                  <input type="checkbox" [checked]="sn.isDisabled" (change)="toggleNodeDisabled()" />
                  <span>Disabled</span>
                </label>
              </div>

              <button class="btn btn-danger btn-sm full-width" (click)="deleteSelectedNode()">Delete Node</button>
            </div>
          </div>
        }
      </div>

      <!-- Bottom Panel (Chat and Logs Side by Side) -->
      <div class="bottom-panel-container">
        <!-- Chat Panel -->
        @if (hasChatMessageTrigger()) {
          <div class="bottom-panel-section chat-section">
            <div class="panel-section-header">
              <h3>💬 Chat Input</h3>
            </div>
            <div class="chat-messages">
              @for (msg of chatMessages(); track $index) {
                <div class="chat-message" [class.user]="msg.sender === 'user'">
                  <div class="message-sender">{{ msg.sender === 'user' ? 'You' : 'System' }}</div>
                  <div class="message-content">{{ msg.message }}</div>
                  <div class="message-time">{{ msg.timestamp | date:'short' }}</div>
                </div>
              }
            </div>
            <div class="chat-input-area">
              <input class="chat-input" 
                     [(ngModel)]="chatInputValue" 
                     (keyup.enter)="sendChatMessage()"
                     placeholder="Type your message..." />
              <button class="btn btn-primary btn-sm" (click)="sendChatMessage()" [disabled]="!chatInputValue.trim()">
                ▶ Send
              </button>
            </div>
          </div>
        }

        <!-- Logs Panel -->
        <div class="bottom-panel-section logs-section" [class.full-width]="!hasChatMessageTrigger()">
          <div class="panel-section-header">
            <h3>📋 Logs</h3>
          </div>
          @if (selectedNodeExecution(); as log) {
            <div class="logs-container">
              <div class="log-section">
                <div class="log-title">Node: {{ log.nodeName }}</div>
                <div class="log-status" [class]="'status-' + log.status.toLowerCase()">
                  ● {{ log.status }}
                </div>
              </div>

              @if (log.inputData) {
                <div class="log-section">
                  <div class="log-subtitle">📥 Input Data</div>
                  <div class="log-content">
                    <pre>{{ log.inputData }}</pre>
                  </div>
                </div>
              }

              @if (log.outputData) {
                <div class="log-section">
                  <div class="log-subtitle">📤 Output Data</div>
                  <div class="log-content">
                    <pre>{{ log.outputData }}</pre>
                  </div>
                </div>
              }

              @if (log.errorMessage) {
                <div class="log-section error">
                  <div class="log-subtitle">⚠ Error</div>
                  <div class="log-content error-text">{{ log.errorMessage }}</div>
                </div>
              }

              @if (!log.inputData && !log.outputData && !log.errorMessage) {
                <div class="log-empty">No data available for this execution</div>
              }
            </div>
          } @else {
            <div class="log-empty">
              <div class="log-empty-icon">📋</div>
              <p>Click on a node after execution to view its logs</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .editor-layout { display: flex; flex-direction: column; height: calc(100vh - var(--header-height)); margin: -28px; }

    .editor-toolbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 16px; background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-primary); height: 52px; flex-shrink: 0; gap: 8px;
    }
    .toolbar-left, .toolbar-center, .toolbar-right { display: flex; align-items: center; gap: 8px; }
    .toolbar-divider { width: 1px; height: 24px; background: var(--border-primary); margin: 0 4px; }

    .workflow-name-input {
      background: transparent; border: 1px solid transparent; border-radius: var(--radius-sm);
      padding: 4px 8px; color: var(--text-primary); font-family: inherit; font-size: 15px; font-weight: 700;
      outline: none; min-width: 200px;
      &:hover { border-color: var(--border-primary); }
      &:focus { border-color: var(--accent-primary); background: var(--bg-input); }
    }
    .version-badge { font-size: 11px; color: var(--text-tertiary); background: var(--bg-tertiary); padding: 2px 8px; border-radius: 12px; }

    .zoom-controls { display: flex; align-items: center; gap: 4px; background: var(--bg-tertiary); border-radius: var(--radius-md); padding: 2px 4px; }
    .zoom-level { font-size: 12px; font-weight: 600; min-width: 40px; text-align: center; color: var(--text-secondary); }

    .exec-status {
      display: flex; align-items: center; gap: 6px; padding: 4px 12px;
      border-radius: 20px; font-size: 12px; font-weight: 600;
      &.exec-Running { background: rgba(59,130,246,.15); color: #3b82f6; }
      &.exec-Success { background: rgba(34,197,94,.15); color: #22c55e; }
      &.exec-Failed { background: rgba(239,68,68,.15); color: #ef4444; }
    }
    .spinner { width: 12px; height: 12px; border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
    .spinner-sm { width: 10px; height: 10px; border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .status-select { width: 120px; font-size: 12px; padding: 4px 8px; height: 32px; }

    .editor-body { display: flex; flex: 1; overflow: hidden; position: relative; }

    .node-palette {
      width: 260px; background: var(--bg-secondary); border-right: 1px solid var(--border-primary);
      overflow-y: auto; flex-shrink: 0; transition: width var(--transition-slow);
      &.collapsed { width: 48px; }
    }
    .palette-header { display: flex; align-items: center; gap: 8px; padding: 12px; border-bottom: 1px solid var(--border-primary); flex-wrap: wrap; }
    .palette-title { font-weight: 700; font-size: 14px; flex: 1; }
    .palette-search { width: 100%; font-size: 12px; padding: 6px 10px; }
    .palette-section { padding: 8px; }
    .palette-section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-tertiary); padding: 8px 8px 4px; }
    .palette-node { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: var(--radius-md); cursor: grab; transition: all var(--transition-fast); &:hover { background: var(--bg-hover); } }
    .palette-node-icon { width: 32px; height: 32px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 14px; color: white; flex-shrink: 0; }
    .palette-node-name { display: block; font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .palette-node-desc { display: block; font-size: 11px; color: var(--text-tertiary); }

    .canvas-container { flex: 1; position: relative; overflow: hidden; background: var(--bg-primary); cursor: grab; &:active { cursor: grabbing; } }
    .canvas-svg { width: 100%; height: 100%; }

    .canvas-node { cursor: pointer; }
    .node-shadow { fill: rgba(0,0,0,.06); transform: translate(2px, 3px); }
    .node-body { fill: var(--bg-card); transition: stroke 0.15s ease; }
    .canvas-node:hover .node-body { stroke: var(--border-secondary) !important; }
    .canvas-node.selected .node-body { filter: drop-shadow(0 0 8px rgba(99,102,241,.2)); }
    .canvas-node.disabled { opacity: 0.5; }

    .node-icon-text { font-size: 16px; dominant-baseline: central; text-anchor: middle; }
    .node-name { fill: var(--text-primary); font-size: 13px; font-weight: 600; font-family: 'Inter', sans-serif; }
    .node-type { fill: var(--text-tertiary); font-size: 10px; font-family: 'Inter', sans-serif; }

    .handle { fill: var(--bg-card); stroke: var(--border-secondary); stroke-width: 1.5; cursor: crosshair; transition: all 0.15s; &:hover { stroke: var(--accent-primary); fill: var(--accent-primary-light); } }
    .handle-inner { fill: var(--border-secondary); pointer-events: none; }
    .handle-inner-out { fill: var(--accent-primary); pointer-events: none; }
    .handle-label { fill: var(--text-tertiary); font-size: 9px; font-weight: 700; font-family: 'Inter', sans-serif; }
    .agent-inputs { pointer-events: auto; }
    .agent-input-group { cursor: pointer; }
    .agent-input-group .handle { cursor: crosshair; }
    .agent-input-group .add-btn { cursor: pointer; transition: all 0.15s; &:hover { fill: rgba(59,130,246,.2); } }
    .plus-text { pointer-events: none; font-family: 'Inter', sans-serif; }
    .label-text { font-family: 'Inter', sans-serif; }

    .connection-line { fill: none; stroke: var(--border-secondary); stroke-width: 2; }
    .connection-line-hover { fill: none; stroke: transparent; stroke-width: 12; cursor: pointer; }
    .connection-line-hover:hover { stroke: rgba(239,68,68,.3); }
    .connection-line.temp { stroke: var(--accent-primary); stroke-dasharray: 6 4; stroke-width: 2; opacity: 0.7; }

    .canvas-empty { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: var(--text-tertiary); pointer-events: none; }
    .empty-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.3; }
    .canvas-empty h3 { font-size: 18px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; }
    .canvas-empty p { font-size: 14px; }

    .properties-panel { width: 320px; background: var(--bg-secondary); border-left: 1px solid var(--border-primary); overflow-y: auto; flex-shrink: 0; }
    .panel-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 16px; border-bottom: 1px solid var(--border-primary); }
    .panel-title-row { display: flex; align-items: center; gap: 12px; }
    .panel-icon { width: 36px; height: 36px; border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: center; font-size: 16px; color: white; flex-shrink: 0; }
    .panel-header h3 { font-size: 14px; font-weight: 700; }
    .panel-subtitle { font-size: 11px; color: var(--text-tertiary); }
    .panel-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .config-section { border: 1px solid var(--border-primary); border-radius: var(--radius-md); padding: 12px; }
    .config-section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--text-tertiary); margin-bottom: 10px; }
    .config-textarea { font-family: 'Cascadia Code', 'Fira Code', monospace; font-size: 12px; resize: vertical; }
    .form-hint { display: block; font-size: 11px; color: var(--text-tertiary); margin-top: 3px; }
    .toggle-row { display: flex; }
    .toggle-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; input { accent-color: var(--accent-primary); width: 16px; height: 16px; } }
    .full-width { width: 100%; justify-content: center; }

    .cron-btn-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .cron-btn { padding: 3px 10px; font-size: 11px; border: 1px solid var(--border-primary); border-radius: 12px; background: transparent; cursor: pointer; color: var(--text-secondary); transition: all .15s; &:hover { background: var(--bg-hover); color: var(--text-primary); } }

    .bottom-panel-container { display: flex; flex-direction: row; flex-wrap: nowrap; width: 100%; height: 280px; background: var(--bg-secondary); border-top: 1px solid var(--border-primary); flex-shrink: 0; gap: 0; }
    .bottom-panel-section { flex: 1 1 50%; min-width: 0; display: flex; flex-direction: column; border-right: 1px solid var(--border-primary); overflow: hidden; }
    .bottom-panel-section:last-child { border-right: none; }
    .bottom-panel-section.full-width { flex: 1; }
    .panel-section-header { padding: 8px 12px; background: var(--bg-tertiary); border-bottom: 1px solid var(--border-primary); font-weight: 500; }
    .panel-section-header h3 { margin: 0; font-size: 13px; color: var(--text-primary); }

    .chat-messages { flex: 1; overflow-y: auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 8px; }
    .chat-section { background: var(--bg-secondary); }
    .logs-section { background: var(--bg-secondary); }
    .chat-message { display: flex; flex-direction: column; padding: 8px 12px; border-radius: var(--radius-md); background: var(--bg-tertiary); }
    .chat-message.user { align-self: flex-end; background: var(--accent-primary); color: white; max-width: 70%; }
    .chat-message.user .message-sender { color: rgba(255,255,255,0.8); }
    .chat-message.user .message-content { color: white; }
    .chat-message.user .message-time { color: rgba(255,255,255,0.6); }
    .message-sender { font-size: 10px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; margin-bottom: 2px; }
    .message-content { font-size: 12px; color: var(--text-primary); line-height: 1.4; }
    .message-time { font-size: 9px; color: var(--text-tertiary); margin-top: 2px; }
    .chat-input-area { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--border-primary); background: var(--bg-secondary); flex-shrink: 0; }
    .chat-input { flex: 1; padding: 8px 12px; border: 1px solid var(--border-primary); border-radius: var(--radius-md); background: var(--bg-input); color: var(--text-primary); font-size: 12px; outline: none; &:focus { border-color: var(--accent-primary); } }

    .logs-container { flex: 1; overflow-y: auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 12px; }
    .log-section { display: flex; flex-direction: column; gap: 4px; }
    .log-section.error { border-left: 3px solid #ef4444; padding-left: 12px; }
    .log-title { font-size: 13px; font-weight: 700; color: var(--text-primary); }
    .log-subtitle { font-size: 11px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
    .log-status { font-size: 11px; font-weight: 600; padding: 4px 8px; border-radius: 4px; width: fit-content; &.status-success { background: rgba(34,197,94,.15); color: #22c55e; } &.status-failed { background: rgba(239,68,68,.15); color: #ef4444; } &.status-pending { background: rgba(107,114,128,.15); color: #6b7280; } &.status-running { background: rgba(59,130,246,.15); color: #3b82f6; } }
    .log-content { background: var(--bg-tertiary); border: 1px solid var(--border-primary); border-radius: var(--radius-md); padding: 10px 12px; max-height: 120px; overflow-y: auto; }
    .log-content pre { margin: 0; font-family: 'Cascadia Code', 'Fira Code', monospace; font-size: 11px; color: var(--text-primary); line-height: 1.4; white-space: pre-wrap; word-wrap: break-word; }
    .log-content.error-text { color: #ef4444; }
    .log-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; color: var(--text-tertiary); }
    .log-empty-icon { font-size: 40px; margin-bottom: 8px; opacity: 0.5; }
    .log-empty p { font-size: 12px; margin: 0; }
    .info-box { padding: 8px 12px; background: var(--bg-tertiary); border-left: 3px solid var(--accent-primary); border-radius: var(--radius-sm); }
  `]
})
export class WorkflowEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLDivElement>;

  api = inject(ApiService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  Math = Math;

  workflowId = signal<string | null>(null);
  workflowName = 'Untitled Workflow';
  workflowDescription = '';
  workflowStatus = 'Draft';
  workflowVersion = 1;

  nodes = signal<CanvasNode[]>([]);
  connections = signal<NodeConnection[]>([]);
  selectedNode = signal<CanvasNode | null>(null);
  executionStatus = signal<string | null>(null);

  zoom = signal(1);
  panX = signal(0);
  panY = signal(0);
  paletteCollapsed = signal(false);
  nodeSearch = '';

  tempConnection = signal<string | null>(null);
  dragNode: CanvasNode | null = null;
  dragOffsetX = 0;
  dragOffsetY = 0;
  isPanning = false;
  panStartX = 0;
  panStartY = 0;
  connectingFrom: { node: CanvasNode; handle: string } | null = null;
  dragNodeDef: NodeDefinition | null = null;

  // Chat panel properties
  chatMessages = signal<Array<{ sender: string; message: string; timestamp: Date }>>([]);
  chatInputValue = '';
  chatPanelOpen = signal(true);

  // Logs panel properties
  selectedNodeExecution = signal<any>(null);
  lastExecution = signal<any>(null);

  private pollSub?: Subscription;

  cronExamples = [
    { label: 'Every minute', cron: '* * * * *' },
    { label: 'Every hour', cron: '0 * * * *' },
    { label: 'Daily 9am', cron: '0 9 * * *' },
    { label: 'Weekly Mon', cron: '0 9 * * 1' },
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.workflowId.set(id);
      this.api.getWorkflow(id).subscribe(w => {
        this.workflowName = w.name;
        this.workflowDescription = w.description || '';
        this.workflowStatus = w.status;
        this.workflowVersion = w.version;
        this.nodes.set(w.nodes.map(n => ({
          ...n,
          def: NODE_DEFINITIONS.find(d => d.type === n.type) || NODE_DEFINITIONS[0]
        })));
        this.connections.set(w.connections);
      });
    }
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  // ---- Config helpers ----
  getConfig(node: CanvasNode, key: string, defaultVal: any = ''): any {
    try {
      const cfg = JSON.parse(node.configuration || '{}');
      return cfg[key] ?? defaultVal;
    } catch { return defaultVal; }
  }

  setConfig(node: CanvasNode, key: string, value: any) {
    try {
      const cfg = JSON.parse(node.configuration || '{}');
      cfg[key] = value;
      node.configuration = JSON.stringify(cfg);
      this.nodes.update(ns => ns.map(n => n.id === node.id ? { ...node } : n));
      this.selectedNode.set({ ...node });
    } catch {}
  }

  range(n: number) { return Array.from({ length: n }, (_, i) => i); }
  truncate(s: string, n: number) { return s.length > n ? s.slice(0, n) + '…' : s; }
  
  getInputLabel(index: number): string {
    const labels = ['Data', 'Model', 'Memory', 'Tools'];
    return labels[index] || `Input ${index}`;
  }

  getInputColor(index: number): string {
    const colors: { [key: number]: string } = {
      0: '#06b6d4', // Data - cyan
      1: '#3b82f6', // Model - blue
      2: '#8b5cf6', // Memory - purple
      3: '#f97316'  // Tools - orange
    };
    return colors[index] || '#6b7280';
  }

  getConnectionColor(conn: NodeConnection): string {
    // Extract input index from targetHandle (e.g., "input0" -> 0, "input1" -> 1)
    const match = conn.targetHandle?.match(/input(\d+)/);
    const inputIndex = match ? parseInt(match[1]) : 0;
    return this.getInputColor(inputIndex);
  }

  // ---- Palette ----
  getCategories(): string[] {
    const cats = [...new Set(NODE_DEFINITIONS.map(d => d.category))];
    if (!this.nodeSearch) return cats;
    const term = this.nodeSearch.toLowerCase();
    return cats.filter(c => NODE_DEFINITIONS.some(d => d.category === c && (d.name.toLowerCase().includes(term) || d.description.toLowerCase().includes(term))));
  }

  getNodesByCategory(category: string): NodeDefinition[] {
    let defs = NODE_DEFINITIONS.filter(d => d.category === category);
    if (this.nodeSearch) {
      const term = this.nodeSearch.toLowerCase();
      defs = defs.filter(d => d.name.toLowerCase().includes(term) || d.description.toLowerCase().includes(term));
    }
    return defs;
  }

  // ---- Canvas ----
  getViewBox(): string {
    const z = this.zoom();
    const container = this.canvasContainer?.nativeElement;
    const w = (container?.clientWidth || 1200) / z;
    const h = (container?.clientHeight || 800) / z;
    return `${-this.panX() / z} ${-this.panY() / z} ${w} ${h}`;
  }

  addNodeToCenter(def: NodeDefinition) {
    const container = this.canvasContainer?.nativeElement;
    const cx = ((container?.clientWidth || 800) / 2 - this.panX()) / this.zoom();
    const cy = ((container?.clientHeight || 500) / 2 - this.panY()) / this.zoom();
    this.addNode(def, cx - 100, cy - 34);
  }

  addNode(def: NodeDefinition, x: number, y: number) {
    const node: CanvasNode = {
      id: crypto.randomUUID(),
      name: def.name,
      type: def.type,
      positionX: Math.round(x / 20) * 20,
      positionY: Math.round(y / 20) * 20,
      isDisabled: false,
      executionOrder: this.nodes().length,
      def,
      configuration: '{}'
    };
    this.nodes.update(ns => [...ns, node]);
    this.selectNode(node);
  }

  selectNode(node: CanvasNode) {
    this.nodes.update(ns => ns.map(n => ({ ...n, selected: n.id === node.id })));
    this.selectedNode.set(this.nodes().find(n => n.id === node.id) || null);
    
    // Show logs if execution data exists
    if (this.lastExecution()) {
      const nodeExecution = this.lastExecution().nodeExecutions?.find((ne: any) => ne.nodeId === node.id);
      if (nodeExecution) {
        this.selectedNodeExecution.set({
          nodeName: node.name,
          status: nodeExecution.status,
          inputData: nodeExecution.inputData ? this.formatJson(nodeExecution.inputData) : null,
          outputData: nodeExecution.outputData ? this.formatJson(nodeExecution.outputData) : null,
          errorMessage: nodeExecution.errorMessage
        });
      }
    }
  }

  deselectAll() {
    this.nodes.update(ns => ns.map(n => ({ ...n, selected: false })));
    this.selectedNode.set(null);
  }

  deleteSelectedNode() {
    const node = this.selectedNode();
    if (!node) return;
    this.nodes.update(ns => ns.filter(n => n.id !== node.id));
    this.connections.update(cs => cs.filter(c => c.sourceNodeId !== node.id && c.targetNodeId !== node.id));
    this.selectedNode.set(null);
  }

  deleteConnection(conn: NodeConnection) {
    this.connections.update(cs => cs.filter(c => c.id !== conn.id));
  }

  onDragStart(event: DragEvent, def: NodeDefinition) {
    this.dragNodeDef = def;
    event.dataTransfer?.setData('text/plain', def.type);
  }

  onDragOver(event: DragEvent) { event.preventDefault(); }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (!this.dragNodeDef) return;
    const rect = this.canvasContainer.nativeElement.getBoundingClientRect();
    const x = (event.clientX - rect.left - this.panX()) / this.zoom();
    const y = (event.clientY - rect.top - this.panY()) / this.zoom();
    this.addNode(this.dragNodeDef, x - 100, y - 34);
    this.dragNodeDef = null;
  }

  onNodeMouseDown(event: MouseEvent, node: CanvasNode) {
    event.stopPropagation();
    if (this.connectingFrom) return;
    this.selectNode(node);
    this.dragNode = node;
    this.dragOffsetX = (event.clientX - this.panX()) / this.zoom() - node.positionX;
    this.dragOffsetY = (event.clientY - this.panY()) / this.zoom() - node.positionY;
  }

  onCanvasMouseDown(event: MouseEvent) {
    if (this.connectingFrom) return;
    this.deselectAll();
    this.isPanning = true;
    this.panStartX = event.clientX - this.panX();
    this.panStartY = event.clientY - this.panY();
  }

  onCanvasMouseMove(event: MouseEvent) {
    if (this.dragNode) {
      const x = (event.clientX - this.panX()) / this.zoom() - this.dragOffsetX;
      const y = (event.clientY - this.panY()) / this.zoom() - this.dragOffsetY;
      this.nodes.update(ns => ns.map(n =>
        n.id === this.dragNode!.id
          ? { ...n, positionX: Math.round(x / 20) * 20, positionY: Math.round(y / 20) * 20 }
          : n
      ));
      const updated = this.nodes().find(n => n.id === this.dragNode!.id);
      if (updated) this.selectedNode.set(updated);
    } else if (this.isPanning) {
      this.panX.set(event.clientX - this.panStartX);
      this.panY.set(event.clientY - this.panStartY);
    } else if (this.connectingFrom) {
      const rect = this.canvasContainer.nativeElement.getBoundingClientRect();
      const mx = (event.clientX - rect.left - this.panX()) / this.zoom();
      const my = (event.clientY - rect.top - this.panY()) / this.zoom();
      const fn = this.connectingFrom.node;
      this.tempConnection.set(this.bezierPath(fn.positionX + 200, fn.positionY + 34, mx, my));
    }
  }

  onCanvasMouseUp() {
    this.dragNode = null;
    this.isPanning = false;
    if (this.connectingFrom) {
      this.connectingFrom = null;
      this.tempConnection.set(null);
    }
  }

  onHandleMouseDown(event: MouseEvent, node: CanvasNode, handle: string) {
    event.stopPropagation();
    this.connectingFrom = { node, handle };
  }

  onHandleMouseUp(node: CanvasNode, handle: string) {
    if (this.connectingFrom && this.connectingFrom.node.id !== node.id) {
      const conn: NodeConnection = {
        id: crypto.randomUUID(),
        sourceNodeId: this.connectingFrom.node.id,
        targetNodeId: node.id,
        sourceHandle: this.connectingFrom.handle,
        targetHandle: handle
      };
      if (!this.connections().some(c => c.sourceNodeId === conn.sourceNodeId && c.targetNodeId === conn.targetNodeId && c.sourceHandle === conn.sourceHandle)) {
        this.connections.update(cs => [...cs, conn]);
      }
    }
    this.connectingFrom = null;
    this.tempConnection.set(null);
  }

  onWheel(event: WheelEvent) {
    event.preventDefault();
    this.zoom.update(z => Math.max(0.2, Math.min(2.5, z + (event.deltaY > 0 ? -0.05 : 0.05))));
  }
  zoomIn() { this.zoom.update(z => Math.min(2.5, z + 0.1)); }
  zoomOut() { this.zoom.update(z => Math.max(0.2, z - 0.1)); }
  fitToScreen() { this.zoom.set(1); this.panX.set(0); this.panY.set(0); }

  getConnectionPath(conn: NodeConnection): string {
    const source = this.nodes().find(n => n.id === conn.sourceNodeId);
    const target = this.nodes().find(n => n.id === conn.targetNodeId);
    if (!source || !target) return '';

    // Get target handle position
    let targetX = target.positionX;
    let targetY = target.positionY + 34;

    // For AI Agent nodes with bottom inputs, calculate the position
    if (target.type === 'AiAgent') {
      const match = conn.targetHandle?.match(/input(\d+)/);
      const inputIndex = match ? parseInt(match[1]) : 0;
      const positions = [38, 100, 162]; // x positions for Chat Model, Memory, Tool
      targetX = target.positionX + (positions[inputIndex] || 38);
      targetY = target.positionY + 100;
    }

    return this.bezierPath(source.positionX + 200, source.positionY + 34, targetX, targetY);
  }

  private bezierPath(sx: number, sy: number, tx: number, ty: number): string {
    const dx = Math.abs(tx - sx) * 0.5;
    return `M${sx},${sy} C${sx + dx},${sy} ${tx - dx},${ty} ${tx},${ty}`;
  }

  saveWorkflow() {
    const data = {
      name: this.workflowName,
      description: this.workflowDescription,
      status: this.workflowStatus,
      triggerType: this.nodes().some(n => n.type === 'Webhook') ? 'Webhook'
                 : this.nodes().some(n => n.type === 'Schedule') ? 'Schedule' : 'Manual',
      cronExpression: this.getCronExpression(),
      nodes: this.nodes().map(n => ({
        id: n.id, name: n.name, label: n.label, type: n.type,
        positionX: n.positionX, positionY: n.positionY,
        configuration: n.configuration, isDisabled: n.isDisabled,
        notes: n.notes, executionOrder: n.executionOrder, credentialId: n.credentialId
      })),
      connections: this.connections().map(c => ({
        id: c.id, sourceNodeId: c.sourceNodeId, targetNodeId: c.targetNodeId,
        sourceHandle: c.sourceHandle || 'output', targetHandle: c.targetHandle || 'input',
        label: c.label, condition: c.condition
      }))
    };

    if (this.workflowId()) {
      this.api.updateWorkflow(this.workflowId()!, data).subscribe();
    } else {
      this.api.createWorkflow(data).subscribe((result: any) => {
        this.workflowId.set(result.id);
        this.router.navigate(['/editor', result.id], { replaceUrl: true });
      });
    }
  }

  getCronExpression(): string | null {
    const scheduleNode = this.nodes().find(n => n.type === 'Schedule');
    if (scheduleNode) {
      try {
        return JSON.parse(scheduleNode.configuration || '{}')['cron'] || null;
      } catch { return null; }
    }
    return null;
  }

  executeWorkflow() {
    if (!this.workflowId()) { this.saveWorkflow(); return; }
    this.executionStatus.set('Running');
    this.nodes.update(ns => ns.map(n => ({ ...n, execStatus: undefined })));

    this.api.runWorkflow(this.workflowId()!).subscribe({
      next: (ex: WorkflowExecution) => {
        this.executionStatus.set(ex.status);
        this.lastExecution.set(ex);
        if (ex.nodeExecutions) {
          this.nodes.update(ns => ns.map(n => {
            const ne = ex.nodeExecutions?.find(ne => ne.nodeId === n.id);
            return ne ? { ...n, execStatus: ne.status.toLowerCase() as any } : n;
          }));
        }
        setTimeout(() => this.executionStatus.set(null), 5000);
      },
      error: () => {
        this.executionStatus.set('Failed');
        setTimeout(() => this.executionStatus.set(null), 5000);
      }
    });
  }

  exportWorkflow() {
    const data = {
      name: this.workflowName,
      description: this.workflowDescription,
      nodes: this.nodes().map(({ def: _def, selected: _sel, execStatus: _exec, ...n }) => n),
      connections: this.connections()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.workflowName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importWorkflow(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.name) this.workflowName = data.name;
        if (data.description) this.workflowDescription = data.description;
        if (data.nodes) {
          this.nodes.set(data.nodes.map((n: any) => ({
            ...n,
            def: NODE_DEFINITIONS.find(d => d.type === n.type) || NODE_DEFINITIONS[0]
          })));
        }
        if (data.connections) this.connections.set(data.connections);
      } catch {
        alert('Invalid workflow JSON file');
      }
    };
    reader.readAsText(file);
  }

  togglePalette() { this.paletteCollapsed.set(!this.paletteCollapsed()); }

  updateNodeProp(prop: string, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    const node = this.selectedNode();
    if (!node) return;
    (node as any)[prop] = value;
    this.nodes.update(ns => ns.map(n => n.id === node.id ? { ...node } : n));
  }

  toggleNodeDisabled() {
    const node = this.selectedNode();
    if (!node) return;
    node.isDisabled = !node.isDisabled;
    this.nodes.update(ns => ns.map(n => n.id === node.id ? { ...node } : n));
    this.selectedNode.set({ ...node });
  }

  // Chat panel methods
  hasChatMessageTrigger(): boolean {
    return this.nodes().some(n => n.type === 'ChatMessage');
  }

  toggleChatPanel() {
    this.chatPanelOpen.set(!this.chatPanelOpen());
  }

  sendChatMessage() {
    if (!this.chatInputValue.trim()) return;

    // Add user message to chat
    const userMessage = {
      sender: 'user',
      message: this.chatInputValue,
      timestamp: new Date()
    };
    this.chatMessages.update(msgs => [...msgs, userMessage]);

    // Find ChatMessage trigger node
    const chatTriggerNode = this.nodes().find(n => n.type === 'ChatMessage');
    if (chatTriggerNode) {
      // Create message data to pass through workflow
      const messageData = {
        message: this.chatInputValue,
        timestamp: new Date().toISOString(),
        sender: 'user'
      };

      // Execute workflow with chat message as trigger data
      if (this.workflowId()) {
        this.api.runWorkflow(this.workflowId()!, messageData).subscribe({
          next: (result: any) => {
            // Add system response message
            const systemMessage = {
              sender: 'system',
              message: result.resultData ? JSON.stringify(result.resultData) : 'Workflow executed successfully',
              timestamp: new Date()
            };
            this.chatMessages.update(msgs => [...msgs, systemMessage]);
          },
          error: (err) => {
            const errorMessage = {
              sender: 'system',
              message: `Error: ${err.error?.message || 'Workflow execution failed'}`,
              timestamp: new Date()
            };
            this.chatMessages.update(msgs => [...msgs, errorMessage]);
          }
        });
      }
    }

    // Clear input
    this.chatInputValue = '';
  }

  // Helper method to format JSON data for display
  formatJson(jsonStr: string | null): string | null {
    if (!jsonStr) return null;
    try {
      // Try to parse as JSON and pretty print
      const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      return JSON.stringify(parsed, null, 2);
    } catch {
      // If not JSON, return as is
      return jsonStr;
    }
  }
}
