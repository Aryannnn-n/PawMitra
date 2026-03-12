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
    desc: 'From rescuers to pet lovers — together we make every rescue, reunion, and adoption possible.',
    image: '/roger.jpg',
    link: '/register',
    label: 'Join PawMitra',
    reverse: false,
  },
];

const STATS = [
  {
    icon: <PawPrint className="h-6 w-6" />,
    value: '1,200+',
    label: 'Pets Reported',
  },
  { icon: <Heart className="h-6 w-6" />, value: '840+', label: 'Adoptions' },
  { icon: <Users className="h-6 w-6" />, value: '3,500+', label: 'Members' },
];

export default function Home() {
  const { isAuth, user } = useAuthStore();

  const greeting = isAuth
    ? user?.role === 'ADMIN'
      ? `Admin ${user.id}`
      : user?.username
    : 'Guest';

  return (
    <Layout>
      {/* Welcome */}
      <div className="mt-10 mb-6 text-center">
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h2 className="text-2xl font-semibold text-indigo-700">
          {greeting} 💫
        </h2>
      </div>

      {/* Hero */}
      <section className="mb-24 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
          Every Paw Deserves a
          <span className="text-indigo-600"> Loving Home</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-500">
          Reuniting lost pets, inspiring adoptions, and building a caring
          community for animals everywhere.
        </p>

        <div className="mt-8 flex justify-center gap-4 flex-wrap">
          <Link to={isAuth ? '/report' : '/login'}>
            <Button
              size="lg"
              className="transition-all duration-200 hover:scale-105 hover:shadow-md"
            >
              <PawPrint className="mr-2 h-4 w-4" />
              Get Started
            </Button>
          </Link>

          <Link to="/search">
            <Button size="lg" variant="outline">
              Browse Pets
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto mb-28 grid max-w-3xl grid-cols-3 gap-6">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="group relative rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm
                 transition-all duration-300 ease-out
                 hover:-translate-y-2 hover:scale-[1.03] hover:shadow-xl hover:border-indigo-300"
          >
            {/* subtle glow */}
            <div
              className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 
                      group-hover:opacity-100 bg-linear-to-r from-indigo-50 via-white to-indigo-50"
            ></div>

            <div className="relative z-10">
              <div className="mb-2 flex justify-center text-indigo-600 transition-transform duration-300 group-hover:scale-110">
                {s.icon}
              </div>

              <p className="text-xl font-semibold transition-colors duration-300 group-hover:text-indigo-600">
                {s.value}
              </p>

              <p className="text-xs text-gray-500 transition-colors duration-300 group-hover:text-gray-600">
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Sections */}
      <section className="space-y-24">
        {SECTIONS.map((s) => (
          <div
            key={s.title}
            className={`flex flex-col items-center gap-12 ${
              s.reverse ? 'md:flex-row-reverse' : 'md:flex-row'
            }`}
          >
            <div className="md:w-1/2">
              <img
                src={s.image}
                alt={s.title}
                className="aspect-[4/3] w-full rounded-2xl object-cover shadow-md"
              />
            </div>

            <div className="md:w-1/2">
              <h3 className="mb-4 text-3xl font-semibold">{s.title}</h3>
              <p className="mb-6 text-gray-500">{s.desc}</p>

              <Link to={s.link}>
                <Button className="transition-all duration-200 hover:scale-105 hover:shadow-md">
                  {s.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </section>
    </Layout>
  );
}
