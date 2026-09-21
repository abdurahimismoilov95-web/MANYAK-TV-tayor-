import { useEffect } from 'react';
import { useContentStore } from '../store/contentStore';
import HeroSlider from '../components/HeroSlider';
import ContentRow from '../components/ContentRow';
import Header from '../components/Header';

export default function HomePage() {
  const { contents, featured, fetchContents, fetchFeatured } = useContentStore();

  useEffect(() => {
    fetchContents();
    fetchFeatured();
  }, []);

  const movies = contents.filter((c) => c.type === 'MOVIE');
  const series = contents.filter((c) => c.type === 'SERIES');
  const premium = contents.filter((c) => c.isPremium);

  return (
    <div className="min-h-screen">
      <Header />
      <HeroSlider items={featured} />
      <div className="px-4 space-y-8 pb-8">
        <ContentRow title="🔥 Yangi Kinolar" items={movies.slice(0, 10)} />
        <ContentRow title="📺 Seriallar" items={series.slice(0, 10)} />
        <ContentRow title="💎 Premium" items={premium.slice(0, 10)} />
      </div>
    </div>
  );
}
