import type { Problem, Speech } from '@mathapp/engine';

/** What the app says when it shows an answer: after two misses, and in worked examples. */
export function answerSpeech(problem: Problem): Speech {
  const { answer, operands: o } = problem;
  switch (o.kind) {
    case 'clock':
      return o.minute === 0
        ? { key: 'answer.time-hour', params: { hour: o.hour } }
        : { key: 'answer.time-half', params: { hour: o.hour } };
    case 'shape-name':
      return { key: 'answer.shape', params: { shape: o.shape } };
    case 'shares':
    case 'lengths':
      return { key: 'answer.this-one' };
    case 'compare': {
      const { a, b } = o;
      if (o.form === 'tap') {
        if (a === b) return { key: 'answer.same' };
        return { key: 'answer.bigger', params: { n: Math.max(a, b) } };
      }
      const key = a > b ? 'answer.greater' : a < b ? 'answer.less' : 'answer.equal';
      return { key, params: { a, b } };
    }
    case 'family':
      if (o.ask === 'belongs') {
        return { key: 'answer.family', params: { whole: o.a + o.b, a: o.a, b: o.b } };
      }
      return { key: 'answer.number', params: { value: answer } };
    default:
      return { key: 'answer.number', params: { value: answer } };
  }
}
