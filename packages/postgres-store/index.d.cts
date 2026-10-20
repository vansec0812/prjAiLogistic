import type { MessagePort, Worker } from 'node:worker_threads';
export function createWorker(port:MessagePort,url:string):Worker;
