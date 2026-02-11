import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Logo from '../components/Logo';

export default function PhilosophyPage() {
  return (
    <div className="min-h-screen bg-parchment-50">
      {/* Header */}
      <header className="border-b border-parchment-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <Logo size={40} className="group-hover:opacity-80 transition-opacity" />
            <h1 className="text-xl font-serif font-semibold text-ink-900 tracking-wide">
              Commonplace Book
            </h1>
          </Link>
          <Link
            to="/"
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <article className="prose-custom">
          <h1 className="text-4xl sm:text-5xl font-serif font-semibold text-ink-900 mb-12 leading-tight">
            The Commonplace Book Philosophy
          </h1>

          {/* Section: Drowning in information */}
          <section className="mb-14">
            <h2 className="text-2xl font-serif font-semibold text-ink-800 mb-4">
              We are drowning in information.
            </h2>
            <div className="space-y-4 text-ink-700 leading-relaxed font-serif">
              <p>
                I can only speak for myself, but I consume information constantly &ndash; podcasts, articles, YouTube videos, documentaries.
              </p>
              <p>
                And to some degree, I believe that the good stuff will stick. But I also know that there must be a large quantity of information I learned, thought was interesting or resonant in some way, and then it got crowded out by something else.
              </p>
              <p className="font-medium text-ink-800">
                How many brilliant ideas have slipped through your fingers because you didn&rsquo;t capture them in the moment?
              </p>
              <p>
                This app exists for us to easily record the most interesting, insightful, or just resonant information you come across in your journey of life.
              </p>
              <p>
                Maybe it&rsquo;s an insight that you know you&rsquo;ll be able to somehow use in the future. Maybe it&rsquo;s a quote that you want to return to in the future. Maybe it&rsquo;s something you hear &ndash; and you don&rsquo;t know if it&rsquo;s useful or even really worth recording &ndash; but for whatever reason, coming across this information just lights you up in some way.
              </p>
              <p className="italic text-ink-600">
                Capture the sparks before they fade &ndash; a place to preserve the ideas, quotes, and insights that resonate with you, so nothing brilliant slips away.
              </p>
            </div>
          </section>

          {/* Section: Hit record */}
          <div className="flourish mb-14" />
          <section className="mb-14">
            <h2 className="text-2xl font-serif font-semibold text-ink-800 mb-4">
              When you want to hit record&hellip; that&rsquo;s a sign
            </h2>
            <div className="space-y-4 text-ink-700 leading-relaxed font-serif">
              <p>
                When something makes you want to write it down, to speak it into your phone, to hit record on a screen capture &ndash; that&rsquo;s a signal. That urge to preserve is your brain telling you: <em>this matters. This is the good shit. This deserves to stick.</em>
              </p>
              <p>
                The Commonplace Book is built around that signal. Not around what&rsquo;s trending. Not around what the algorithm thinks will keep you scrolling. Around what you actually care about.
              </p>
              <p>
                That moment when you feel compelled to record something? That&rsquo;s you noticing a fundamental part of who you are. It&rsquo;s not just information &ndash; it&rsquo;s a glimpse into your deepest interests, your unfiltered preferences, the things that make you light up inside.
              </p>
            </div>
          </section>

          {/* Section: Algorithms */}
          <div className="flourish mb-14" />
          <section className="mb-14">
            <h2 className="text-2xl font-serif font-semibold text-ink-800 mb-4">
              Algorithms optimize for their goals, not yours.
            </h2>
            <div className="space-y-4 text-ink-700 leading-relaxed font-serif">
              <p>
                Right now, most of us choose what to consume based on:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>What&rsquo;s new (even when the best stuff is evergreen)</li>
                <li>What&rsquo;s recommended (by systems designed to maximize engagement, not learning)</li>
                <li>What everyone else is talking about (even when it doesn&rsquo;t interest us)</li>
              </ul>
              <p>
                This is backwards. You should consume based on what you&rsquo;ve proven you care about. Your recorded entries are breadcrumbs &ndash; a map of your actual interests, not your algorithmic shadow. Follow that map. Develop your taste. In an AI world where everyone has access to the same information, your taste is your edge.
              </p>
            </div>
          </section>

          {/* Section: Taste */}
          <div className="flourish mb-14" />
          <section className="mb-14">
            <h2 className="text-2xl font-serif font-semibold text-ink-800 mb-4">
              In an AI world, taste is everything.
            </h2>
            <div className="space-y-4 text-ink-700 leading-relaxed font-serif">
              <p>
                LLMs are trained on the average. The corpus. The aggregate. They synthesize what already exists, but they don&rsquo;t experience anything. They don&rsquo;t feel that inexplicable pull toward an idea, that chest-tightening moment when something just <em>hits</em>.
              </p>
              <p className="font-medium text-ink-800">
                You do.
              </p>
              <p>
                And that&rsquo;s the competitive advantage. Not just having access to AI, but knowing how to use it well. Which means being deeply attuned to your own taste, your own real-world experience, your own indescribable reactions to ideas.
              </p>
              <p>
                The things you choose to record aren&rsquo;t random. They&rsquo;re signals from the deepest part of yourself. Pay attention to them.
              </p>
            </div>
          </section>

          {/* Section: Memory */}
          <div className="flourish mb-14" />
          <section className="mb-14">
            <h2 className="text-2xl font-serif font-semibold text-ink-800 mb-4">
              Memory is a muscle. Use it or lose it.
            </h2>
            <div className="space-y-4 text-ink-700 leading-relaxed font-serif">
              <p>
                The act of recording something seems to make the idea stickier, at least for me. Coming back to re-read your entries weeks or months later? That&rsquo;s repetition. That&rsquo;s how the most important stuff actually stays in your brain.
              </p>
              <p>
                This isn&rsquo;t just an archive. It&rsquo;s a tool for learning that compounds over time.
              </p>
              <p>
                10&ndash;15 insights per week, filtered from hours of content. That&rsquo;s not a lot, but it&rsquo;s the right amount. Quality over quantity. Signal over noise.
              </p>
            </div>
          </section>

          {/* Section: Own your work */}
          <div className="flourish mb-14" />
          <section className="mb-14">
            <h2 className="text-2xl font-serif font-semibold text-ink-800 mb-4">
              You should own your work.
            </h2>
            <div className="space-y-4 text-ink-700 leading-relaxed font-serif">
              <p>
                Social media platforms change. Features disappear. Accounts get banned. Algorithms shift. But a website you control? That&rsquo;s permanent. That&rsquo;s yours.
              </p>
              <p>
                The Commonplace Book lets you embed your entries directly on your own site. Keep it off-platform. Build your own knowledge garden in a place that isn&rsquo;t subject to the whims of whatever company owns the latest hot app.
              </p>
              <p className="font-medium text-ink-800">
                Your insights deserve a permanent home.
              </p>
            </div>
          </section>

          {/* Section: Effortless capture */}
          <div className="flourish mb-14" />
          <section className="mb-14">
            <h2 className="text-2xl font-serif font-semibold text-ink-800 mb-4">
              Capture should be effortless.
            </h2>
            <div className="space-y-4 text-ink-700 leading-relaxed font-serif">
              <p>
                You&rsquo;re listening to a podcast and someone says something that hits. You have maybe 10 seconds before the moment passes and you forget. Writing is too slow. Fumbling with a notes app is too much friction.
              </p>
              <p>
                So we built for the way you actually consume:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Voice notes</strong> for quick captures while you&rsquo;re walking, driving, listening</li>
                <li><strong>Screen recording</strong> for when you need something verbatim, when the exact wording matters</li>
                <li><strong>Written entries</strong> for when you have time to think</li>
              </ul>
              <p>
                Whatever the moment requires. Zero friction. Because if capturing an idea takes effort, you won&rsquo;t do it&mdash;and the insight is gone forever.
              </p>
            </div>
          </section>

          {/* Section: For learners */}
          <div className="flourish mb-14" />
          <section className="mb-14">
            <h2 className="text-2xl font-serif font-semibold text-ink-800 mb-4">
              This is for people who live to learn.
            </h2>
            <div className="space-y-4 text-ink-700 leading-relaxed font-serif">
              <p>
                If you believe that a life well-lived is &ldquo;learn, learn, learn&rdquo;&mdash;this is for you.
              </p>
              <p>
                If you consume ideas not just to be informed, but to create something new by remixing what you&rsquo;ve learned&mdash;this is for you.
              </p>
              <p>
                If you write, make things, build in public, and your work is the synthesis of a thousand things you&rsquo;ve read and heard and watched&mdash;this is for you.
              </p>
              <p>
                If you&rsquo;re a podcast junkie who knows there&rsquo;s gold in all those hours of listening, but you&rsquo;re tired of letting it evaporate&mdash;this is for you.
              </p>
            </div>
          </section>

          {/* Section: Personal archive */}
          <div className="flourish mb-14" />
          <section className="mb-14">
            <h2 className="text-2xl font-serif font-semibold text-ink-800 mb-4">
              A personal archive of what you&rsquo;re learning.
            </h2>
            <div className="space-y-4 text-ink-700 leading-relaxed font-serif">
              <p>
                Over months and years, your Commonplace Book becomes something powerful:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>A map of your genuine interests (not what you <em>should</em> care about, but what you <em>do</em>)</li>
                <li>A repository you can search when writing, creating, or just trying to remember that thing that changed how you think</li>
                <li>A signal of what to consume next (more of this, less of that)</li>
                <li>A tool for noticing patterns in your own thinking and learning</li>
              </ul>
              <p>
                Tag your entries. Organize them. Search them. Let them guide you toward deeper understanding of what you actually care about.
              </p>
            </div>
          </section>

          {/* Section: Not */}
          <div className="flourish mb-14" />
          <section className="mb-14">
            <h2 className="text-2xl font-serif font-semibold text-ink-800 mb-4">
              The Commonplace Book is not:
            </h2>
            <div className="space-y-4 text-ink-700 leading-relaxed font-serif">
              <ul className="list-disc pl-6 space-y-2">
                <li>A productivity hack</li>
                <li>A social network</li>
                <li>A replacement for thinking</li>
                <li>A way to claim other people&rsquo;s ideas as your own (that&rsquo;s what the source field is for)</li>
              </ul>
              <p>
                It&rsquo;s a tool. A simple one. For people who care about what they&rsquo;re learning and want to remember it.
              </p>
            </div>
          </section>

          {/* Section: CTA */}
          <div className="flourish mb-14" />
          <section className="mb-14">
            <h2 className="text-2xl font-serif font-semibold text-ink-800 mb-4">
              Learn. Record. Remember. Create.
            </h2>
            <div className="space-y-4 text-ink-700 leading-relaxed font-serif">
              <p>
                That&rsquo;s it. That&rsquo;s the whole philosophy.
              </p>
              <p>
                The algorithm doesn&rsquo;t know what you need to learn. Only you do.
              </p>
              <p className="font-medium text-ink-800">
                So start recording.
              </p>
            </div>
          </section>
        </article>
      </main>

      {/* Footer */}
      <footer className="border-t border-parchment-200 py-10 mt-8">
        <div className="text-center">
          <Logo size={32} className="mx-auto mb-3" />
          <p className="font-serif font-semibold text-ink-800 text-sm">The Commonplace Book</p>
          <p className="text-xs text-ink-400 mt-1">TheCommonplaceBook.app</p>
        </div>
      </footer>
    </div>
  );
}
