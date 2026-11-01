import { APP_NAME } from './config';

export function App() {
  return (
    <main className="flex h-full flex-col items-center justify-center gap-6 p-6 text-center">
      <div aria-hidden="true" className="text-8xl">
        🐾
      </div>
      <h1 className="text-5xl font-bold">{APP_NAME}</h1>
    </main>
  );
}
