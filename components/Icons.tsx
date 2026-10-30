type P = { size?: number };
const base = (size: number) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true });

export const MenuIcon = ({ size = 18 }: P) => <svg {...base(size)} strokeWidth={2}><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
export const ChevronLeft = ({ size = 18 }: P) => <svg {...base(size)}><path d="M15 6l-6 6 6 6" /></svg>;
export const ChevronRight = ({ size = 18 }: P) => <svg {...base(size)}><path d="M9 6l6 6-6 6" /></svg>;
export const PersonIcon = ({ size = 18 }: P) => <svg {...base(size)}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>;
export const ChatIcon = ({ size = 18 }: P) => <svg {...base(size)}><path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.6-5.4A8.4 8.4 0 1 1 21 11.5z" /></svg>;
export const CheckIcon = ({ size = 26 }: P) => <svg {...base(size)} strokeWidth={2.2}><path d="M5 12l5 5 9-10" /></svg>;
export const QuoteMark = () => <svg aria-hidden width="40" height="32" viewBox="0 0 40 32" fill="none" stroke="var(--oxblood)" strokeWidth="1.5"><path d="M2 30V18C2 9 7 3 16 2M24 30V18c0-9 5-15 14-16" /></svg>;
