export function legacyCopy(): boolean {
  const command = Reflect.get(document, "execCommand");
  return typeof command === "function" && command.call(document, "copy");
}

const scripts = new Map<string, Promise<void>>();
export function loadScript(src: string): Promise<void> {
  const cached = scripts.get(src);
  if (cached) return cached;
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scripts.delete(src);
      script.remove();
      reject(new Error(`Unable to load ${src}`));
    };
    document.head.appendChild(script);
  });
  scripts.set(src, promise);
  return promise;
}
