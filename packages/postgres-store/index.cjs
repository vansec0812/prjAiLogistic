const {Worker}=require('node:worker_threads');
const path=require('node:path');
// The package is external to Next's bundler. Static resolution also ensures
// node-postgres and its dependencies are present in Vercel's function trace.
const pgModule=require.resolve('pg');
exports.createWorker=(port,url)=>new Worker(path.join(__dirname,'worker.cjs'),{
  workerData:{port,url,pgModule},transferList:[port]
});
