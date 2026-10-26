import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({development:vi.fn(()=>false),run:vi.fn()}));
vi.mock('../apps/web/src/server/db',()=>({development:mocks.development,db:()=>({prepare:()=>({run:mocks.run})})}));
import { photoDemoEnabled, canUseBundle } from '../apps/web/src/server/demo-mode';
import { demoUser } from '../apps/web/src/server/seed';
beforeEach(()=>{delete process.env.PLANTCARE_PHOTO_DEMO_ENABLED;vi.clearAllMocks();});
describe('Hosted photo demo isolation and gate',()=>{
  it('is off by default, including demo login',()=>{expect(photoDemoEnabled()).toBe(false);expect(()=>demoUser()).toThrow();expect(mocks.run).not.toHaveBeenCalled();});
  it('allows only photo demo bundles, keeping unapproved catalog rules blocked',()=>{
    process.env.PLANTCARE_PHOTO_DEMO_ENABLED='true';expect(photoDemoEnabled()).toBe(true);
    expect(canUseBundle({demo:true,developmentOnly:true})).toBe(true);
    expect(canUseBundle({demo:false,developmentOnly:true})).toBe(false);
    expect(canUseBundle({developmentOnly:false})).toBe(true);
    delete process.env.PLANTCARE_PHOTO_DEMO_ENABLED;expect(canUseBundle({demo:true,developmentOnly:true})).toBe(false);
  });
  it('creates distinct nonprivileged visitor accounts with random passwords, without local sample cases',()=>{
    process.env.PLANTCARE_PHOTO_DEMO_ENABLED='true';const a=demoUser(),b=demoUser();
    expect(a.id).not.toBe(b.id);expect(a.id).not.toBe('local-demo');expect(a.role).toBe('MEMBER');
    expect(mocks.run).toHaveBeenCalledTimes(2);expect(mocks.run.mock.calls[0][4]).not.toEqual(mocks.run.mock.calls[1][4]);
  });
});
