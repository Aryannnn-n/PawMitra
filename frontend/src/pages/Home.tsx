import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import { ArrowRight, Heart, PawPrint, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    title: 'Report Lost or Found Pets',
    desc: "Whether you've lost your furry friend or found one in need, PawMitra connects you with people nearby to reunite every pet with their family.",
    image: '/found_lost.png',
    link: '/report',
    label: 'Report a Pet',
    reverse: false,
  },
  {
    title: 'Adopt a Pet, Change a Life',
    desc: 'Thousands of pets are waiting for a loving home. Browse our verified adoption listings and find your perfect companion today.',
    image: '/adopt.png',
    link: '/search',
    label: 'Explore Adoptions',
    reverse: true,
  },
  {
    title: 'Join a Community That Cares',
    desc: 'From rescuers to pet lovers — together we make every rescue, reunion, and adoption possible. Your compassion helps shape countless happy tails.',
    image:
      'https://cdn.pixabay.com/photo/2017/02/20/18/03/dog-2083492_1280.jpg',
    link: '/register',
    label: 'Join PawMitra',
    reverse: false,
  },
];

const STATS = [
  {
    icon: <PawPrint className="w-6 h-6" />,
    value: '1,200+',
    label: 'Pets Reported',
  },
  {
    icon: <Heart className="w-6 h-6" />,
    value: '840+',
    label: 'Successful Adoptions',
  },
  {
    icon: <Users className="w-6 h-6" />,
    value: '3,500+',
    label: 'Community Members',
  },
];

export default function Home() {
  const { isAuth, user } = useAuthStore();

  const greeting = isAuth
    ? user?.role === 'ADMIN'
      ? `Admin ${user.id} 💫`
      : `${user?.username} 💫`
    : 'Guest 💫';

  return (
    <Layout>
      {/* Welcome */}
      <div className="text-center mt-10 mb-4 animate-fade-in">
        <p className="text-gray-500 text-sm font-medium tracking-wide uppercase">
          Welcome back
        </p>
        <h2 className="text-2xl font-bold text-indigo-700 mt-1">{greeting}</h2>
      </div>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center mb-20 px-6 py-16">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-indigo-100">
          <PawPrint className="w-4 h-4" /> India's Pet Rescue & Adoption Portal
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight max-w-3xl">
          Every Paw Deserves a{' '}
          <span className="text-indigo-600">Promise of Love.</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
          Reuniting lost pets, inspiring adoptions, and creating happy stories —
          one paw at a time.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link to={isAuth ? '/report' : '/login'}>
            <Button
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 shadow-md"
            >
              <PawPrint className="w-4 h-4 mr-2" /> Get Started
            </Button>
          </Link>
          <Link to="/search">
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              Browse Pets <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-6 max-w-2xl mx-auto mb-24">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center gap-2 p-6 bg-white rounded-2xl shadow-sm border border-gray-100"
          >
            <div className="text-indigo-600">{s.icon}</div>
            <span className="text-2xl font-bold text-gray-900">{s.value}</span>
            <span className="text-xs text-gray-500 text-center">{s.label}</span>
          </div>
        ))}
      </section>

      {/* Alternating Sections */}
      <section className="space-y-28 max-w-6xl mx-auto px-4 mb-28">
        {SECTIONS.map((s) => (
          <div
            key={s.title}
            className={`flex flex-col ${s.reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12`}
          >
            <div className="md:w-1/2">
              <img
                src={s.image}
                alt={s.title}
                className="rounded-3xl shadow-lg w-full object-cover aspect-[4/3]"
                loading="lazy"
              />
            </div>
            <div className="md:w-1/2 text-center md:text-left">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                {s.title}
              </h3>
              <p className="text-gray-500 text-lg leading-relaxed mb-6">
                {s.desc}
              </p>
              <Link to={s.link}>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6">
                  {s.label} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* CTA Banner */}
      <section className="rounded-3xl bg-gradient-to-r from-indigo-600 to-indigo-800 text-white text-center py-20 px-6 mb-20 mx-4">
        <h2 className="text-4xl font-bold mb-4">
          Together, We Make Tails Wag 🐾
        </h2>
        <p className="max-w-2xl mx-auto text-lg opacity-90 mb-8">
          Be a part of our growing community of pet lovers helping animals find
          safety, homes, and happiness.
        </p>
        <Link to="/register">
          <Button
            size="lg"
            className="bg-white text-indigo-700 hover:bg-gray-100 rounded-full px-10 font-semibold shadow-md"
          >
            💫 Join the Movement
          </Button>
        </Link>
      </section>

      {/* Contact */}
      <section className="text-center py-16 bg-indigo-50 rounded-3xl mx-4 mb-10">
        <h2 className="text-3xl font-bold text-indigo-700 mb-4">
          Get In Touch
        </h2>
        <p className="text-gray-600 mb-6 text-lg max-w-xl mx-auto">
          Have questions, suggestions, or want to volunteer? We'd love to hear
          from you!
        </p>
        <a href="mailto:support@pawmitra.org">
          <Button
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-10"
          >
            📧 Contact Us
          </Button>
        </a>
      </section>
    </Layout>
  );
}
