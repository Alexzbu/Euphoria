interface Props {
  title: string;
}

// stands in until each screen is built. keeps the route table honest in the
// meantime: every path in it resolves to something.
export function Placeholder({ title }: Props) {
  return (
    <section>
      <h1>{title}</h1>
    </section>
  );
}
