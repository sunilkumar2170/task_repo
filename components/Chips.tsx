export default function Chips({ items, rose }: { items: string[]; rose?: boolean }) {
  return <>{items.map((x) => <span key={x} className={`chip${rose ? " rose" : ""}`}>{x}</span>)}</>;
}
