/**
 * Handler Registry
 */
// @ts-nocheck


import type { INodeHandler } from './types';
import { StartHandler } from './start.handler';
import { EndHandler } from './end.handler';
import { ActionHandler } from './action.handler';
import { DecisionHandler } from './decision.handler';
import { ApiCallHandler } from './api-call.handler';
import { ParallelHandler } from './parallel.handler';
import { WaitHandler } from './wait.handler';
import { UserInteractionHandler } from './user-interaction.handler';
import { SubflowHandler } from './subflow.handler';
import { ErrorHandlerNode } from './error.handler';
import { TransformHandler } from './transform.handler';
import { LoopHandler } from './loop.handler';

export class NodeHandlerRegistry {
  private handlers: Map<string, INodeHandler> = new Map();
  
  constructor() {
    this.registerAll();
  }
  
  private registerAll(): void {
    this.register('start', new StartHandler());
    this.register('end', new EndHandler());
    this.register('action', new ActionHandler());
    this.register('decision', new DecisionHandler());
    this.register('api_call', new ApiCallHandler());
    this.register('parallel', new ParallelHandler());
    this.register('wait', new WaitHandler());
    this.register('user_interaction', new UserInteractionHandler());
    this.register('subflow', new SubflowHandler());
    this.register('error', new ErrorHandlerNode());
    this.register('transform', new TransformHandler());
    this.register('loop', new LoopHandler());
  }
  
  register(type: string, handler: INodeHandler): void {
    this.handlers.set(type, handler);
  }
  
  get(type: string): INodeHandler | undefined {
    return this.handlers.get(type);
  }
  
  has(type: string): boolean {
    return this.handlers.has(type);
  }
  
  getAllTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

export const handlerRegistry = new NodeHandlerRegistry();
