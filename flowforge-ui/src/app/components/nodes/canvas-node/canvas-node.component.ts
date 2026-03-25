import { Component, Input, Output, EventEmitter, HostBinding, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeDefinition } from '../../../models/workflow.model';

export interface CanvasNodeData {
  id: string;
  name: string;
  type: string;
  positionX: number;
  positionY: number;
  isDisabled: boolean;
  def: NodeDefinition;
  selected?: boolean;
  execStatus?: 'success' | 'failed' | 'running' | 'pending';
  [key: string]: any;
}

@Component({
  selector: 'g[appCanvasNode]',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas-node.component.html',
  styles: [`:host { cursor: pointer; }`]
})
export class CanvasNodeComponent {
  @Input() node!: CanvasNodeData;

  @Output() nodeMouseDown = new EventEmitter<MouseEvent>();
  @Output() handleMouseDown = new EventEmitter<{ event: MouseEvent; handle: string }>();
  @Output() handleMouseUp = new EventEmitter<string>();

  @HostBinding('attr.transform') get transform() {
    return `translate(${this.node.positionX},${this.node.positionY})`;
  }

  @HostBinding('class.selected') get isSelected() { return this.node.selected; }
  @HostBinding('class.disabled') get isDisabled() { return this.node.isDisabled; }
  @HostBinding('attr.data-category') get category() { return this.node.def.category; }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    this.nodeMouseDown.emit(event);
  }

  get isRound(): boolean {
    return this.node.type === 'ToolNode' || this.node.type === 'MemoryNode' || this.node.type === 'ChatModel';
  }

  get nodeHeight(): number {
    if (this.node.type === 'AiAgent') return 120;
    if (this.node.def.inputs > 1) return 68 + (this.node.def.inputs - 1) * 14;
    return 68;
  }

  get strokeColor(): string {
    if (this.node.selected) return this.node.def.color;
    if (this.node.execStatus === 'success') return '#22c55e';
    if (this.node.execStatus === 'failed') return '#ef4444';
    if (this.node.execStatus === 'running') return '#3b82f6';
    return 'var(--border-primary)';
  }

  get strokeWidth(): string {
    return (this.node.selected || this.node.execStatus) ? '2.5' : '1';
  }

  get execBadgeColor(): string {
    if (this.node.execStatus === 'success') return '#22c55e';
    if (this.node.execStatus === 'failed') return '#ef4444';
    return '#3b82f6';
  }

  get execBadgeText(): string {
    if (this.node.execStatus === 'success') return '✓';
    if (this.node.execStatus === 'failed') return '✕';
    return '⟳';
  }

  range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }

  truncate(s: string, n: number): string {
    return s.length > n ? s.slice(0, n) + '…' : s;
  }

  onOutputHandleMouseDown(event: MouseEvent, handle: string) {
    event.stopPropagation();
    this.handleMouseDown.emit({ event, handle });
  }

  onInputHandleMouseUp(handle: string) {
    this.handleMouseUp.emit(handle);
  }
}
