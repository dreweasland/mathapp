import type { Problem, Speech } from '@mathapp/engine';

/** What the app says when it shows an answer: after two misses, and in worked examples. */
export function answerSpeech(problem: Problem): Speech {
  const { answer, operands: o } = problem;
  switch (o.kind) {
    case 'clock':
      if (o.minute === 0) return { key: 'answer.time-hour', params: { hour: o.hour } };
      if (o.minute === 30) return { key: 'answer.time-half', params: { hour: o.hour } };
      return { key: 'answer.time-minutes', params: { time: answer } };
    case 'shape-name':
      return { key: 'answer.shape', params: { shape: o.shape } };
    case 'shares':
    case 'lengths':
    case 'make-amount':
      return { key: 'answer.this-one' };
    case 'elapsed':
      return o.ask === 'end'
        ? { key: 'answer.time-minutes', params: { time: answer } }
        : { key: 'answer.number', params: { value: answer } };
    case 'even-odd':
    case 'am-pm':
      return { key: 'answer.word', params: { word: answer } };
    case 'fraction':
      return o.ask === 'name'
        ? { key: 'answer.fraction', params: { n: o.n, d: o.d } }
        : { key: 'answer.number', params: { value: answer } };
    case 'fraction-compare': {
      const left = o.an * o.bd;
      const right = o.bn * o.ad;
      if (left === right) return { key: 'answer.fraction-same' };
      const [bigN, bigD] = left > right ? [o.an, o.ad] : [o.bn, o.bd];
      return { key: 'answer.fraction-bigger', params: { n: bigN, d: bigD } };
    }
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
