'use client';

import { ArrowRight, Flame, PenLine, Sparkles, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { useCurrentUser } from '@/app/hooks/useCurrentUser';
import PostList from '@/components/features/PostList';

const categories = ['Design', 'Travel', 'Photography', 'Technology', 'Wellness'];

export default function Home() {
  const user = useCurrentUser();

  return (
    <div className="shell-container">
      <section className="mb-8 overflow-hidden rounded-[2rem] border border-indigo-100 bg-white px-6 py-7 shadow-[0_24px_60px_-36px_rgba(79,70,229,0.45)] sm:px-10 sm:py-10">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_22rem]">
          <div>
            <span className="eyebrow"><Sparkles size={12} /> Interest-led community</span>
            <h1 className="gradient-heading mt-5 max-w-2xl text-4xl font-bold leading-[1.08] sm:text-5xl">
              Share what moves you. Discover what matters next.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-500 sm:text-lg">
              A welcoming feed for projects, passions, and thoughtful conversations with people who get it.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {user ? (
                <Link href="/create-post" className="primary-button">
                  <PenLine size={16} />
                  Share an interest
                </Link>
              ) : (
                <Link href="/register" className="primary-button">
                  Join the community
                  <ArrowRight size={16} />
                </Link>
              )}
              <Link href="/explore" className="secondary-button">Explore posts</Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl bg-indigo-600 p-5 text-white">
              <Flame className="mb-6 text-indigo-200" size={22} />
              <p className="text-sm text-indigo-100">Trending today</p>
              <p className="mt-1 text-xl font-semibold">Fresh inspiration</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
              <UsersRound className="mb-6 text-indigo-600" size={22} />
              <p className="text-sm text-slate-500">Find your circle</p>
              <Link href="/users" className="mt-1 inline-flex items-center gap-1 text-base font-semibold text-slate-900">
                Meet creators <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_18.5rem]">
        <section>
          <div className="mb-5 flex items-end justify-between">
            <div>
              <span className="eyebrow">Feed</span>
              <h2 className="gradient-heading mt-3 text-2xl font-bold sm:text-3xl">Latest interests</h2>
            </div>
          </div>
          <PostList />
        </section>

        <aside className="surface sticky top-24 hidden p-5 lg:block">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-slate-900">Browse topics</p>
              <p className="mt-1 text-sm leading-6 text-slate-500">Follow what sparks your curiosity.</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <span key={category} className="tag-pill justify-center text-center">{category}</span>
              ))}
            </div>

            <Link href="/explore" className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50">
              Explore all
              <ArrowRight size={15} />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
