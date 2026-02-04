import { TagCount } from '../types';

interface Props {
  tags: TagCount[];
  activeTag: string;
  onSelect: (tag: string) => void;
}

export default function TagFilter({ tags, activeTag, onSelect }: Props) {
  if (tags.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => onSelect('')}
        className={`tag cursor-pointer transition-colors ${!activeTag ? 'tag-active' : 'hover:bg-parchment-300'}`}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag.name}
          onClick={() => onSelect(tag.name === activeTag ? '' : tag.name)}
          className={`tag cursor-pointer transition-colors ${tag.name === activeTag ? 'tag-active' : 'hover:bg-parchment-300'}`}
        >
          {tag.name}
          <span className="ml-1 opacity-60">{tag.count}</span>
        </button>
      ))}
    </div>
  );
}
