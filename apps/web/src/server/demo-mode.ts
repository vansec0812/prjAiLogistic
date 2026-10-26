import { development } from './db';

/** Explicit hosted photo demo; never enables local OTP or unapproved catalog rules. */
export const photoDemoEnabled=()=>development()||process.env.PLANTCARE_PHOTO_DEMO_ENABLED==='true';
export const canUseBundle=(bundle:{developmentOnly:boolean;demo?:boolean})=>!bundle.developmentOnly||development()||bundle.demo===true&&photoDemoEnabled();
