import { useEffect, useState, type ReactNode } from 'react';
import { Icon } from '../ui/icons';
import type { FamilyRepository } from '../db/repositories/family';
import { PIN_LENGTH, grownUpQuestion, hashPin, newSalt } from './pin';

type Step = 'loading' | 'enter' | 'question' | 'create' | 'repeat';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

function Pad({ onKey }: { onKey: (key: string) => void }) {
  return (
    <div className="grid w-full max-w-xs grid-cols-3 gap-2" data-testid="pin-pad">
      {KEYS.map((key, i) =>
        key === '' ? (
          <span key={i} />
        ) : (
          <button
            key={key}
            type="button"
            aria-label={key}
            className="tap text-3xl font-extrabold"
            onClick={() => onKey(key)}
          >
            {key === 'back' ? '⌫' : key}
          </button>
        ),
      )}
    </div>
  );
}

function Frame({
  title,
  children,
  onExit,
}: {
  title: string;
  children: ReactNode;
  onExit: () => void;
}) {
  return (
    <main className="screen items-center justify-center-safe gap-4 overflow-y-auto text-center">
      <div className="flex w-full max-w-xs items-center justify-between">
        <h1 className="text-2xl font-extrabold">{title}</h1>
        <button type="button" aria-label="close" className="tap" onClick={onExit}>
          <Icon name="close" size={26} />
        </button>
      </div>
      {children}
    </main>
  );
}

/** Stays locked on every return, so a dashboard left open can't be reopened by a child. */
export function PinGate({
  family,
  onExit,
  children,
}: {
  family: FamilyRepository;
  onExit: () => void;
  children: ReactNode;
}) {
  const [step, setStep] = useState<Step>('loading');
  const [saved, setSaved] = useState<{ hash: string; salt: string }>();
  const [entry, setEntry] = useState('');
  const [first, setFirst] = useState('');
  const [message, setMessage] = useState('');
  const [question] = useState(() => grownUpQuestion());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    void family.get().then(({ pinHash, pinSalt }) => {
      if (pinHash && pinSalt) {
        setSaved({ hash: pinHash, salt: pinSalt });
        setStep('enter');
      } else {
        setStep('question');
      }
    });
  }, [family]);

  if (open) return <>{children}</>;
  if (step === 'loading') return null;

  const goTo = (next: Step, note = '') => {
    setStep(next);
    setEntry('');
    setMessage(note);
  };

  const complete = async (value: string) => {
    if (step === 'enter' && saved) {
      if ((await hashPin(value, saved.salt)) === saved.hash) setOpen(true);
      else goTo('enter', 'That PIN is not right. Try again.');
    } else if (step === 'question') {
      if (value === question.answer) goTo('create');
      else goTo('question', 'Not quite. Try again.');
    } else if (step === 'create') {
      setFirst(value);
      goTo('repeat');
    } else if (step === 'repeat') {
      if (value !== first) {
        goTo('create', "Those didn't match. Start again.");
        return;
      }
      const salt = newSalt();
      await family.savePin(await hashPin(value, salt), salt);
      setOpen(true);
    }
  };

  const length = step === 'question' ? question.answer.length : PIN_LENGTH;
  const press = (key: string) => {
    if (key === 'back') {
      setEntry(entry.slice(0, -1));
      return;
    }
    const value = entry + key;
    setEntry(value);
    setMessage('');
    if (value.length === length) void complete(value);
  };

  const titles: Record<Step, string> = {
    loading: '',
    enter: 'Grown-ups',
    question: 'Grown-ups first',
    create: 'Make a 4-digit PIN',
    repeat: 'Enter it again',
  };

  return (
    <Frame title={titles[step]} onExit={onExit}>
      {step === 'question' && <p className="text-2xl font-extrabold">What is {question.text}?</p>}
      <p
        aria-live="polite"
        data-testid="pin-dots"
        className="text-3xl font-extrabold tracking-widest"
      >
        {step === 'question'
          ? entry || '_'.repeat(length)
          : '●'.repeat(entry.length) + '○'.repeat(length - entry.length)}
      </p>
      <p role="alert" className="min-h-6 text-base font-bold">
        {message}
      </p>
      <Pad onKey={press} />
      {step === 'enter' && (
        <button type="button" className="p-link" onClick={() => goTo('question')}>
          Forgot the PIN?
        </button>
      )}
    </Frame>
  );
}
