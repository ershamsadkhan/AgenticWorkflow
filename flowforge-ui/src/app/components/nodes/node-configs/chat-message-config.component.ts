import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-message-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="form-group">
      <div class="info-box">
        <span class="form-hint">This trigger receives messages from the chat input window at the bottom. Output will contain: message, timestamp, and sender fields.</span>
      </div>
    </div>
  `
})
export class ChatMessageConfigComponent {}
