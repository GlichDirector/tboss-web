'use client';

import { useActionState, useEffect, useRef, startTransition } from 'react';
import { nominateElder, type NominationState } from '@/lib/legacyActions';
import { studio } from '@/lib/site';
import { CheckIcon } from './Icons';

const STATES = ['Lagos', 'Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti'];

export default function NominationForm({ title, intro, feeText, rightsText }: { title: string; intro: string; feeText: string; rightsText: string }) {
  const [state, action, pending] = useActionState<NominationState, FormData>(nominateElder, { ok: false });
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.ok) doneRef.current?.focus();
    else if (state.field) (formRef.current?.querySelector(`[name="${state.field}"]`) as HTMLElement | null)?.focus();
  }, [state]);

  if (state.ok) {
    return (
      <div ref={doneRef} tabIndex={-1} role="status" className="form-card lg-done">
        <span className="ok-badge"><CheckIcon /></span>
        <h2 className="serif" style={{ margin: 0, fontSize: 42, lineHeight: 1.05 }}>Thank you for nominating {state.elder}.</h2>
        <p className="lede" style={{ fontSize: 17, margin: 0 }}>We’ve sent a copy to {state.email}. We read every nomination personally and will call you to talk about their story, the shoot and the sponsorship.</p>
        <p style={{ margin: 0, color: 'var(--muted)' }}>Can’t wait? Call or WhatsApp <a href={`tel:${studio.phoneIntl}`} style={{ color: 'var(--oxblood)', fontWeight: 600 }}>{studio.phoneDisplay}</a>.</p>
      </div>
    );
  }

  const err = (f: string) => (state.field === f ? { 'aria-invalid': true, 'aria-describedby': 'lg-err' } : {});

  return (
    <form
      ref={formRef}
      className="form-card lg-form"
      aria-labelledby="nominate-h"
      noValidate
      onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); startTransition(() => action(fd)); }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h2 id="nominate-h" className="serif" style={{ margin: 0, fontSize: 'clamp(34px, 5vw, 48px)', lineHeight: 1.05 }}>{title}</h2>
        <p style={{ margin: 0, color: 'var(--muted)' }}>{intro}</p>
      </div>

      <fieldset className="lg-set">
        <legend>About the elder</legend>
        <div className="form-grid">
          <div className="field"><label htmlFor="ln">Full name</label><input className="input" id="ln" name="elder_name" required {...err('elder_name')} /></div>
          <div className="field"><label htmlFor="lk">What the family calls them <span className="opt">(optional)</span></label><input className="input" id="lk" name="known_as" placeholder="e.g. Mama Ibadan, Baba Agba" /></div>
        </div>
        <div className="form-grid">
          <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }} {...err('sex')}>
            <legend className="legend">Sex</legend>
            <div className="types">
              {['Female', 'Male'].map((x) => <label className="type-opt" key={x}><input type="radio" name="sex" value={x} required />{x}</label>)}
            </div>
          </fieldset>
          <div className="field"><label htmlFor="la">Age</label><input className="input" id="la" name="age" type="number" inputMode="numeric" min={80} max={125} required placeholder="80 or above" {...err('age')} /><span className="hint">An approximate age is fine.</span></div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="ls">State</label>
            <select className="input" id="ls" name="state" required defaultValue="" {...err('state')}>
              <option value="" disabled>Choose a state</option>
              {STATES.map((x) => <option key={x}>{x}</option>)}
            </select>
            <span className="hint">Southwest Nigeria only.</span>
          </div>
          <div className="field"><label htmlFor="lt">Town or city</label><input className="input" id="lt" name="town" required placeholder="e.g. Ibadan, Ogbomosho, Abeokuta" {...err('town')} /></div>
        </div>
        <div className="form-grid">
          <div className="field"><label htmlFor="ll">Languages they speak <span className="opt">(optional)</span></label><input className="input" id="ll" name="languages" placeholder="e.g. Yoruba, English" /></div>
          <div className="field"><label htmlFor="lf">What they are known for <span className="opt">(optional)</span></label><input className="input" id="lf" name="known_for" placeholder="e.g. retired teacher, cloth weaver, chief" /></div>
        </div>
        <div className="field">
          <label htmlFor="lst">Their story, in a few lines</label>
          <textarea className="input" id="lst" name="story" rows={6} required maxLength={3000} placeholder="Where they grew up, the life they’ve lived, what makes them special to your family…" {...err('story')} />
        </div>
        <div className="form-grid">
          <div className="field"><label htmlFor="lo">Outfit for their one look <span className="opt">(optional)</span></label><input className="input" id="lo" name="outfit" placeholder="e.g. her favourite aso-oke and gele" /></div>
          <div className="field"><label htmlFor="lc">Anything we should know for their comfort? <span className="opt">(optional)</span></label><input className="input" id="lc" name="care_notes" placeholder="e.g. uses a walking stick, best in the morning" /></div>
        </div>
      </fieldset>

      <fieldset className="lg-set">
        <legend>About you</legend>
        <div className="form-grid">
          <div className="field"><label htmlFor="yn">Your full name</label><input className="input" id="yn" name="nominator_name" autoComplete="name" required {...err('nominator_name')} /></div>
          <div className="field"><label htmlFor="yr">How you know them</label><input className="input" id="yr" name="relationship" required placeholder="e.g. grandson, daughter, neighbour" {...err('relationship')} /></div>
        </div>
        <div className="form-grid">
          <div className="field"><label htmlFor="yp">Phone / WhatsApp</label><input className="input" id="yp" name="phone" type="tel" autoComplete="tel" required {...err('phone')} /></div>
          <div className="field"><label htmlFor="ye">Email</label><input className="input" id="ye" name="email" type="email" autoComplete="email" required {...err('email')} /></div>
        </div>
        <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
          <legend className="legend">Who will sponsor the shoot?</legend>
          <div className="types">
            <label className="type-opt"><input type="radio" name="sponsor" value="me" defaultChecked />I will</label>
            <label className="type-opt"><input type="radio" name="sponsor" value="family" />Another family member</label>
            <label className="type-opt"><input type="radio" name="sponsor" value="unsure" />Not sure yet</label>
          </div>
          <span className="hint">{feeText ? `Sponsorship: ${feeText}.` : 'We’ll share the sponsorship fee and what it covers when we call you.'}</span>
        </fieldset>
        <div className="field">
          <label htmlFor="yh">How did you hear about Preserving Legacy? <span className="opt">(optional)</span></label>
          <select className="input" id="yh" name="found_via" defaultValue="">
            <option value="">Choose one</option><option>Instagram</option><option>WhatsApp</option><option>A friend or family member</option><option>Google</option><option>News or media</option><option>Other</option>
          </select>
        </div>
      </fieldset>

      <fieldset className="lg-set">
        <legend>Permission</legend>
        <label className="lg-check"><input type="checkbox" name="consent_family" required {...err('consent_family')} /><span>The elder and their family know about this nomination and are happy for them to be photographed, filmed and to share their story.</span></label>
        <label className="lg-check"><input type="checkbox" name="consent_rights" required {...err('consent_rights')} /><span>I agree that Tboss Photography may use the photos, videos and story as described: {rightsText}</span></label>
      </fieldset>

      <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1 }} />
      {state.error && <p id="lg-err" role="alert" className="alert" style={{ margin: 0 }}>{state.error}</p>}
      <button type="submit" className="btn btn-dark" disabled={pending} style={{ alignSelf: 'flex-start' }}>{pending ? 'Sending…' : 'Send nomination'}</button>
    </form>
  );
}
