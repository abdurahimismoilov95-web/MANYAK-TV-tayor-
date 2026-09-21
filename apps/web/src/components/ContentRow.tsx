import ContentCard from './ContentCard';

interface Props {
  title: string;
  items: any[];
}

export default function ContentRow({ title, items }: Props) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {items.map((item) => (
          <div key={item.id} className="min-w-[140px]">
            <ContentCard content={item} />
          </div>
        ))}
      </div>
    </div>
  );
}
