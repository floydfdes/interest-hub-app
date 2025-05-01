"use client";

import {
  List,
  PenSquare,
  Search,
  Share,
  UserPlus,
  Users,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-gray-800">
      {/* Hero Section */}
      <header className="w-full flex flex-col items-center justify-center text-center py-20 bg-primary text-white px-4">
        <h1 className="text-5xl font-extrabold">Welcome to InterestHub</h1>
        <p className="mt-4 max-w-xl text-lg">
          Discover, share, and engage with your favorite topics.
        </p>
        <button className="mt-6 px-8 py-3 bg-white text-primary font-semibold rounded-md shadow hover:bg-opacity-90 transition">
          Get Started
        </button>
      </header>

      {/* Features Section */}
      <section className="w-full py-20 px-4 bg-white">
        <h2 className="text-3xl font-bold text-center text-primary">
          What We Offer
        </h2>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 bg-gray-50 rounded-xl shadow-md text-center hover:shadow-lg transition"
            >
              <feature.icon className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="w-full py-20 bg-secondary text-white px-4">
        <h2 className="text-3xl font-bold text-center">How It Works</h2>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div
              key={index}
              className="p-6 bg-white text-gray-800 rounded-xl shadow-md text-center hover:shadow-lg transition"
            >
              <step.icon className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold">{step.step}</h3>
              <p className="mt-2 text-sm text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="w-full py-20 text-center bg-primary text-white px-4">
        <h2 className="text-3xl font-bold">Join InterestHub Today</h2>
        <p className="mt-2 text-lg">
          Start exploring and sharing your interests with the world.
        </p>
        <button className="mt-6 px-8 py-3 bg-white text-primary font-semibold rounded-md shadow hover:bg-opacity-90 transition">
          Sign Up Now
        </button>
      </section>
    </div>
  );
}

// ✅ New Lucide Icons
const features = [
  {
    title: "Explore Topics",
    description:
      "Browse through a vast collection of topics and discover content tailored to your interests. Engage with discussions, read insightful posts, and stay updated on your favorite subjects.",
    icon: Search,
  },
  {
    title: "Engage with Community",
    description:
      "Connect with like-minded individuals by commenting, liking, and sharing content. Build meaningful discussions and expand your network with our engaging community features.",
    icon: Users,
  },
  {
    title: "Create & Share",
    description:
      "Express your thoughts and creativity by posting your own content. Share ideas, stories, and experiences with an audience that values your perspective.",
    icon: PenSquare,
  },
];

const steps = [
  {
    step: "Sign Up",
    description: "Create your free Interest Hub account and get started.",
    icon: UserPlus,
  },
  {
    step: "Choose Interests",
    description: "Follow topics that excite you and personalize your feed.",
    icon: List,
  },
  {
    step: "Engage & Share",
    description: "Start posting, commenting, and connecting with the community!",
    icon: Share,
  },
];
