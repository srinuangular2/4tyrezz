import { useEffect } from 'react';

export function usePageMeta({ title, description, path }) {
  useEffect(() => {
    const previousTitle = document.title;
    const descriptionTag = document.querySelector('meta[name="description"]');
    const previousDescription = descriptionTag?.getAttribute('content') || '';
    document.title = title;
    if (descriptionTag && description) descriptionTag.setAttribute('content', description);
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = `${window.location.origin}${path}`;
    document.head.appendChild(canonical);
    return () => {
      document.title = previousTitle;
      if (descriptionTag) descriptionTag.setAttribute('content', previousDescription);
      canonical.remove();
    };
  }, [title, description, path]);
}
