export function shortAddress(value?: string | null){ return value ? `${value.slice(0,6)}…${value.slice(-4)}` : "—"; }
export function gen(wei: bigint | number | string){ const n=typeof wei==='bigint'?wei:BigInt(String(wei||0)); const whole=n/10n**18n; const frac=((n%(10n**18n))*100n/(10n**18n)).toString().padStart(2,'0'); return `${whole}.${frac} GEN`; }
export function fromGen(value: string){ const [w='0',f='']=value.trim().split('.'); const frac=(f+'0'.repeat(18)).slice(0,18); return BigInt(w||'0')*10n**18n+BigInt(frac||'0'); }
export function dateTime(seconds:number){ return seconds ? new Date(seconds*1000).toLocaleString() : '—'; }
export function terminal(state:string){ return ['PAID','REFUNDED','EXPIRED','CANCELLED'].includes(state); }
