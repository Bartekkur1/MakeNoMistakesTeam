// Superscript link to a numbered source in the footer.
export function Footnote({ id }: { id: number }) {
  return (
    <sup className="ml-0.5">
      <a href={`#zrodlo-${id}`} className="font-semibold text-shark-blue hover:underline" aria-label={`Źródło ${id}`}>
        {id}
      </a>
    </sup>
  );
}
