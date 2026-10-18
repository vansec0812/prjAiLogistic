export async function register(){
  if(process.env.NEXT_RUNTIME==='nodejs'&&!process.env.PLANTCARE_BACKEND_URL&&process.env.PLANTCARE_DEPLOYMENT_TARGET==='backend'){
    const {startBackendRuntime}=await import('./server/runtime');startBackendRuntime();
  }
}
