import { useMemo, useRef, useState } from 'react';
import type { PageProps } from '../ParentApp';
import { reportDoc, reportFileName } from '../reportDoc';
import { saveFile } from '../saveFile';

const PAGE_WIDTH = 760;
const PAGE_HEIGHT = 980;

export function Report({ view, today }: PageProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [note, setNote] = useState('');
  const doc = useMemo(() => reportDoc(view, today), [view, today]);
  const scale = Math.min(1, (window.innerWidth - 32) / PAGE_WIDTH);
  const share = async () => {
    const file = new File([doc], reportFileName(view.child.name, today), { type: 'text/html' });
    setNote((await saveFile(file)) ? 'Open the saved file to print it or attach it.' : '');
  };
  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          className="p-btn p-btn-main flex-1"
          onClick={() => frame.current?.contentWindow?.print()}
        >
          Print
        </button>
        <button type="button" className="p-btn flex-1" onClick={() => void share()}>
          Share or save
        </button>
      </div>
      <p className="text-sm">
        {note ||
          'If Print does nothing on iPhone, use Share or save, then print from the file or send it to the teacher.'}
      </p>
      <div
        className="overflow-hidden rounded-lg border-2 border-ink bg-white"
        style={{ height: PAGE_HEIGHT * scale, width: PAGE_WIDTH * scale }}
      >
        <iframe
          ref={frame}
          title="Teacher report"
          srcDoc={doc}
          data-testid="report-frame"
          style={{
            border: 0,
            height: PAGE_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: PAGE_WIDTH,
          }}
        />
      </div>
    </>
  );
}
