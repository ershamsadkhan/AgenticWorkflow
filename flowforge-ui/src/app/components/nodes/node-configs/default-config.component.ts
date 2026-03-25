import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-default-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-group">
      <label>Raw JSON Config</label>
      <textarea class="input config-textarea" [value]="node?.configuration || ''"
                (input)="rawChange.emit($any($event.target).value)"
                placeholder='{ "key": "value" }' rows="8"></textarea>
    </div>
  `
})
export class DefaultConfigComponent {
  @Input() node: any;
  @Output() rawChange = new EventEmitter<string>();
}
