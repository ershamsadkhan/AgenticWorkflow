import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  WorkflowList, WorkflowDetail, WorkflowExecution,
  Credential, DashboardStats, Variable
} from '../models/workflow.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  // Workflows
  getWorkflows(): Observable<WorkflowList[]> {
    return this.http.get<WorkflowList[]>(`${this.baseUrl}/workflows`);
  }
  getWorkflow(id: string): Observable<WorkflowDetail> {
    return this.http.get<WorkflowDetail>(`${this.baseUrl}/workflows/${id}`);
  }
  createWorkflow(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/workflows`, data);
  }
  updateWorkflow(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/workflows/${id}`, data);
  }
  deleteWorkflow(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/workflows/${id}`);
  }
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.baseUrl}/workflows/stats`);
  }
  activateWorkflow(id: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/workflows/${id}/activate`, {});
  }
  deactivateWorkflow(id: string): Observable<any> {
    return this.http.patch(`${this.baseUrl}/workflows/${id}/deactivate`, {});
  }

  // Executions
  getExecutions(workflowId: string, page = 1): Observable<WorkflowExecution[]> {
    return this.http.get<WorkflowExecution[]>(`${this.baseUrl}/executions/workflow/${workflowId}?page=${page}`);
  }
  getAllExecutions(page = 1): Observable<WorkflowExecution[]> {
    return this.http.get<WorkflowExecution[]>(`${this.baseUrl}/executions?page=${page}`);
  }
  getExecution(id: string): Observable<WorkflowExecution> {
    return this.http.get<WorkflowExecution>(`${this.baseUrl}/executions/${id}`);
  }
  runWorkflow(workflowId: string, triggerData?: any): Observable<WorkflowExecution> {
    return this.http.post<WorkflowExecution>(`${this.baseUrl}/executions/run/${workflowId}`, triggerData ? { triggerData } : {});
  }
  deleteExecution(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/executions/${id}`);
  }

  // Credentials
  getCredentials(): Observable<Credential[]> {
    return this.http.get<Credential[]>(`${this.baseUrl}/credentials`);
  }
  createCredential(data: any): Observable<Credential> {
    return this.http.post<Credential>(`${this.baseUrl}/credentials`, data);
  }
  deleteCredential(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/credentials/${id}`);
  }

  // Variables
  getVariables(): Observable<Variable[]> {
    return this.http.get<Variable[]>(`${this.baseUrl}/variables`);
  }
  createVariable(data: any): Observable<Variable> {
    return this.http.post<Variable>(`${this.baseUrl}/variables`, data);
  }
  updateVariable(id: string, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/variables/${id}`, data);
  }
  deleteVariable(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/variables/${id}`);
  }
}
