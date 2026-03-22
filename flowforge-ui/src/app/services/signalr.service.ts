import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

// We use a dynamic import approach to avoid build issues if @microsoft/signalr is not installed
// If SignalR is available, it provides real-time updates; otherwise, polling fallback is used.

export interface ExecutionUpdate {
  executionId: string;
  workflowId: string;
  status: string;
  nodeId?: string;
  nodeStatus?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class SignalRService implements OnDestroy {
  private connection: any = null;
  private readonly executionUpdate$ = new Subject<ExecutionUpdate>();
  readonly updates$ = this.executionUpdate$.asObservable();

  async connect(token: string): Promise<void> {
    try {
      // Dynamic import to gracefully handle missing package
      const signalR = await import('@microsoft/signalr').catch(() => null);
      if (!signalR) return;

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl('http://localhost:5000/hubs/execution', {
          accessTokenFactory: () => token
        })
        .withAutomaticReconnect()
        .build();

      this.connection.on('ExecutionStarted', (data: any) => {
        this.executionUpdate$.next({ ...data, status: 'Running' });
      });
      this.connection.on('ExecutionCompleted', (data: any) => {
        this.executionUpdate$.next({ ...data, status: data.status });
      });
      this.connection.on('NodeExecuted', (data: any) => {
        this.executionUpdate$.next(data);
      });

      await this.connection.start();
    } catch (err) {
      console.warn('SignalR connection failed (optional feature):', err);
    }
  }

  async joinWorkflow(workflowId: string): Promise<void> {
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('JoinWorkflowGroup', workflowId).catch(console.warn);
    }
  }

  async leaveWorkflow(workflowId: string): Promise<void> {
    if (this.connection?.state === 'Connected') {
      await this.connection.invoke('LeaveWorkflowGroup', workflowId).catch(console.warn);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.stop().catch(console.warn);
      this.connection = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
