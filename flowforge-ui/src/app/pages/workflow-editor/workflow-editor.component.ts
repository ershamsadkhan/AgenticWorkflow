import { Component, inject, signal, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { WorkflowNode, NodeConnection, NodeType, NODE_DEFINITIONS, NodeDefinition, WorkflowExecution } from '../../models/workflow.model';
import { Subscription } from 'rxjs';
import { CanvasNodeComponent, CanvasNodeData, NodeConfigHostComponent } from '../../components/nodes';

type CanvasNode = CanvasNodeData & WorkflowNode;

@Component({
  selector: 'app-workflow-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, CanvasNodeComponent, NodeConfigHostComponent],
  templateUrl: './workflow-editor.component.html',
  styleUrl: './workflow-editor.component.css',
  encapsulation: ViewEncapsulation.None
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
  bottomPanelCollapsed = signal(false);
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
      const isRound = fn.type === 'ToolNode' || fn.type === 'MemoryNode' || fn.type === 'ChatModel';
      const outX = isRound ? fn.positionX + 34 : fn.positionX + 200;
      const outY = isRound ? fn.positionY : fn.positionY + 34;
      this.tempConnection.set(this.bezierPath(outX, outY, mx, my));
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
    const isRoundTarget = target.type === 'ToolNode' || target.type === 'MemoryNode' || target.type === 'ChatModel';
    let targetX = isRoundTarget ? target.positionX + 34 : target.positionX;
    let targetY = isRoundTarget ? target.positionY : target.positionY + 34;

    // For AI Agent nodes
    if (target.type === 'AiAgent') {
      if (conn.targetHandle === 'input') {
        // Data input on left side
        targetX = target.positionX;
        targetY = target.positionY + 60;
      } else {
        // Bottom inputs: input0=Chat Model, input1=Memory, input2=Tool
        const match = conn.targetHandle?.match(/input(\d+)/);
        const inputIndex = match ? parseInt(match[1]) : 0;
        const positions = [38, 100, 162];
        targetX = target.positionX + (positions[inputIndex] || 38);
        targetY = target.positionY + 120;
      }
    }

    // Round nodes have output at top center
    const isRoundSource = source.type === 'ToolNode' || source.type === 'MemoryNode' || source.type === 'ChatModel';
    const sourceOutX = isRoundSource ? source.positionX + 34 : source.positionX + 200;
    const sourceOutY = isRoundSource ? source.positionY : source.positionY + 34;
    return this.bezierPath(sourceOutX, sourceOutY, targetX, targetY);
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

  setRawConfig(node: CanvasNode, value: string) {
    node.configuration = value;
    this.nodes.update(ns => ns.map(n => n.id === node.id ? { ...node } : n));
    this.selectedNode.set({ ...node });
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

  isChatMessageSelected(): boolean {
    return this.selectedNode()?.type === 'ChatMessage';
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
