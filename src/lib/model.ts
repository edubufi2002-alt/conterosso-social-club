export type Role = 'user' | 'manager' | 'admin';
export type Account = {id:string; name:string; surname:string; email:string; phone:string; cfKey:string; role:Role; whatsapp:boolean; disabled?:boolean};
export type Person = {id:string; name:string; surname:string; cfCipher:string; membership: Membership[]};
export type Membership = {id:string; card:string; from:string; to:string; status:'active'|'pending'|'review'|'revoked'; approvedBy:string; feeCents:number; paidCents:number};
export type Occurrence = {id:string; startsAt:string; endsAt:string; capacity:number; bookingDeadline:string; cancellationDeadline:string; cancelled?:boolean};
export type Activity = {id:string; title:string; description:string; category:string; location:string; status:'draft'|'published'|'cancelled'|'concluded'; priceCents:number; cyclePriceCents:number|null; methods:('onsite'|'online')[]; managers:string[]; occurrences:Occurrence[]; version:number; refundPercent:number|null; cover:'music'|'art'|'words'|'lab'; source?:string; imageUrl?:string; sample?:boolean};
export type Participant = {personId:string; name:string; surname:string};
export type Booking = {id:string; activityId:string; ownerId:string; participants:Participant[]; occurrenceIds:string[]; state:'held'|'confirmed'|'cancelled'|'expired'; expiresAt:number; createdAt:number; method:'onsite'|'online'; totalCents:number; paidCents:number; refundedCents:number; refundDueCents:number; refundPercent:number|null; cancellationDeadline:string; stripeSession?:string; paymentIntent?:string; idempotencyKey:string; requestHash:string; attendance:Record<string,'present'|'absent'>};
export type WaitEntry = {id:string; ownerId:string; activityId:string; occurrenceIds:string[]; participants:Participant[]; quantity:number; createdAt:number; state:'waiting'|'offered'|'converted'|'expired'|'withdrawn'; expiresAt:number; bookingId?:string};
export type LedgerEntry = {id:string; bookingId?:string; personId?:string; type:'activity'|'membership'|'refund'; method:'online'|'onsite'; amountCents:number; createdAt:number; actorId:string; reference:string};
export type Job = {id:string; type:'confirmation'|'staff-new'|'staff-reminder'|'reminder'|'change'|'wait-offer'; bookingId?:string; waitId?:string; occurrenceId?:string; recipientId:string; channel:'email'|'whatsapp'; dueAt:number; state:'pending'|'leased'|'accepted'|'delivered'|'failed'|'unknown'|'cancelled'; attempts:number; leaseUntil:number; providerId?:string; detail?:string};
export type Audit = {id:string; actorId:string; action:string; target:string; at:number};
export type Settings = {waitPolicy:'unset'|'strict'|'fit'; waitOfferMinutes:number; membershipFeeCents:number|null; membershipFrom:string; membershipTo:string; membershipApproved:boolean; policyApproved:boolean; staffMfaApproved:boolean; onsiteDelegates:string[]; staffRecipients:string[]; onsitePaymentRequired:boolean; contactEmail:string; phone:string; address:string; about:string; membershipText:string; homeText:string; gallery:{url:string;alt:string}[]};
export type State = {accounts:Record<string,Account>; people:Record<string,Person>; activities:Record<string,Activity>; bookings:Record<string,Booking>; waitlist:Record<string,WaitEntry>; ledger:Record<string,LedgerEntry>; jobs:Record<string,Job>; audit:Record<string,Audit>; processed:Record<string,boolean>; settings:Settings};
export class DomainError extends Error { constructor(public code:string, message:string, public status=422){super(message);} }
export function fail(code:string,message:string,status=422):never {throw new DomainError(code,message,status)}
export const record = <T>(value:Record<string,T>|undefined)=>Object.values(value||{});
export function normalizeState(s:State):State {for(const key of ['accounts','people','activities','bookings','waitlist','ledger','jobs','audit','processed'] as const) s[key] ||= {} as never; s.settings.onsiteDelegates||=[];s.settings.staffRecipients||=[];s.settings.gallery||=[];
for(const e of Object.values(s.activities)){e.managers||=[];e.occurrences||=[];e.methods||=[]}
for(const p of Object.values(s.people))p.membership||=[];
for(const b of Object.values(s.bookings)){b.attendance||={};b.participants||=[];b.occurrenceIds||=[]}
return s;}
