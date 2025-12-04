import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-4xl text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          H2 DNA Spectrum
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Discover Your Instinct-Based Behavioral Patterns
        </p>

        <div className="bg-white shadow-lg rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            What is the H2 DNA Spectrum?
          </h2>
          <p className="text-gray-600 mb-6">
            An advanced personality assessment tool that identifies your natural behavioral patterns
            based on six core archetypes and your unique Dual State profile.
          </p>

          <div className="grid md:grid-cols-2 gap-6 text-left mb-8">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Dominant Archetypes</h3>
              <ul className="text-gray-600 space-y-1">
                <li>🐏 Ram - Competitive Drivers</li>
                <li>🦊 Coyote - Disruptive Innovators</li>
                <li>🦅 Eagle - Strategic Visionaries</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Adaptive Archetypes</h3>
              <ul className="text-gray-600 space-y-1">
                <li>🦌 Antelope - Adaptive Movers</li>
                <li>🦌 Deer - Relational Harmonizers</li>
                <li>🦉 Owl - Structured Strategists</li>
              </ul>
            </div>
          </div>

          <Link
            href="/assessment"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Take the Assessment
          </Link>
        </div>

        <div className="text-sm text-gray-500">
          <p>30 questions • 5-10 minutes • Instant results with PDF report</p>
        </div>
      </div>
    </main>
  );
}
