import { api } from "~/trpc/server";
import Link from "next/link";
import { Button } from "~/components/ui/button";

export default async function Home() {
  const { status } = await api.health.getHealth.query();
  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary selection:text-primary-foreground font-sans">
      {/* Sticky Nav Bar */}
      <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border/40 bg-background/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <div className="h-6 w-6 rounded bg-primary" />
            <span className="font-semibold tracking-tight">ShipFlow</span>
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {["Products", "Solutions", "Resources", "Docs"].map((item) => (
              <Link
                key={item}
                href={`/${item.toLowerCase()}`}
                className="rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/contact" className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground md:block">
            Contact
          </Link>
          <Link href="/login" className="text-sm font-medium transition-colors hover:text-muted-foreground">
            Log In
          </Link>
          <Button className="h-7 rounded-sm px-3 text-xs font-semibold shadow-level-2 transition-transform hover:scale-105 active:scale-95">
            Sign Up
          </Button>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 pt-32 pb-48 text-center md:pt-40 lg:pt-48 lg:pb-64 animate-fade-in-up">
          {/* Ambient Mesh Gradient */}
          <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center opacity-30 blur-[120px] saturate-150 animate-mesh-pulse">
            <div className="h-[400px] w-[400px] rounded-full bg-[var(--color-develop-start)] mix-blend-screen" />
            <div className="h-[400px] w-[400px] -ml-[200px] rounded-full bg-[var(--color-preview-end)] mix-blend-screen" />
            <div className="h-[400px] w-[400px] -ml-[200px] rounded-full bg-[var(--color-ship-end)] mix-blend-screen" />
          </div>

          <div className="mx-auto max-w-4xl space-y-8">
            <div className="inline-flex items-center rounded-full border border-border bg-muted/30 px-3 py-1 backdrop-blur-sm transition-colors hover:bg-muted/50 cursor-pointer">
              <span className="font-mono text-xs text-muted-foreground">ShipFlow AI Alpha is live</span>
              <div className="ml-2 h-2 w-2 rounded-full bg-[var(--color-success)] animate-pulse" />
            </div>

            <h1 className="text-5xl font-semibold tracking-[-0.05em] md:text-6xl lg:text-7xl">
              Ship features faster.
            </h1>
            
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
              The AI Cloud for modern development teams. Go from raw feature request to production-ready pull requests with a single command.
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row pt-4">
              <Button className="h-12 rounded-full px-8 text-base font-medium shadow-level-2 transition-all hover:scale-105 active:scale-95">
                Start Deploying
              </Button>
              <Button variant="outline" className="h-12 rounded-full px-8 text-base font-medium shadow-level-1 transition-all hover:scale-105 hover:bg-muted active:scale-95">
                Get a Demo
              </Button>
            </div>
          </div>
        </section>

        {/* Customer Logo Strip */}
        <section className="border-y border-border/40 bg-background py-10">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <p className="mb-8 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Trusted by the best frontend teams
            </p>
            <div className="flex flex-wrap justify-center gap-12 opacity-60 grayscale transition-all hover:grayscale-0">
              {['notion', 'linear', 'raycast', 'figma', 'vercel'].map((brand) => (
                <img 
                  key={brand}
                  src={`https://iconsclub.xyz/logo/${brand}/64.png?invert=1`} 
                  alt={`${brand} logo`} 
                  className="h-8 object-contain transition-transform hover:scale-110"
                />
              ))}
            </div>
          </div>
        </section>

        {/* Feature Showcase Grid */}
        <section className="bg-secondary/30 px-6 py-32">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">A compute model for all workloads.</h2>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { title: 'Generative UI', desc: 'Stream components directly to the client.' },
                { title: 'Edge Functions', desc: 'Deploy globally in milliseconds.' },
                { title: 'AI Gateway', desc: 'Monitor, cache, and rate limit all prompts.' },
              ].map((feature, i) => (
                <div 
                  key={i}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card p-8 shadow-level-2 transition-all hover:-translate-y-1 hover:shadow-level-3 cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <h3 className="mb-2 text-xl font-semibold tracking-tight">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="px-6 py-32">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Predictable pricing.</h2>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3 lg:gap-8 items-center">
              {/* Hobby Tier */}
              <div className="rounded-2xl border border-border bg-card p-8 shadow-level-2 transition-transform hover:scale-[1.02]">
                <h3 className="text-2xl font-semibold tracking-tight">Hobby</h3>
                <div className="mt-4 flex items-baseline text-5xl font-bold tracking-tight">
                  $0
                  <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">For personal projects and experiments.</p>
                <Button variant="outline" className="mt-8 w-full rounded-full transition-transform hover:scale-105 active:scale-95">Deploy</Button>
              </div>

              {/* Pro Tier (Featured) */}
              <div className="relative rounded-2xl border border-border bg-primary p-8 text-primary-foreground shadow-level-4 transition-transform hover:scale-[1.02] md:scale-105 z-10">
                <div className="absolute -top-3 right-8 rounded-full bg-[var(--color-develop-start)] px-3 py-1 font-mono text-xs font-semibold tracking-wide text-white">
                  RECOMMENDED
                </div>
                <h3 className="text-2xl font-semibold tracking-tight">Pro</h3>
                <div className="mt-4 flex items-baseline text-5xl font-bold tracking-tight">
                  $20
                  <span className="ml-1 text-xl font-medium text-primary-foreground/70">/mo</span>
                </div>
                <p className="mt-4 text-sm text-primary-foreground/80">For teams building production applications.</p>
                <Button className="mt-8 w-full rounded-full bg-background text-foreground hover:bg-background/90 transition-transform hover:scale-105 active:scale-95">Get Started</Button>
              </div>

              {/* Enterprise Tier */}
              <div className="rounded-2xl border border-border bg-card p-8 shadow-level-2 transition-transform hover:scale-[1.02]">
                <h3 className="text-2xl font-semibold tracking-tight">Enterprise</h3>
                <div className="mt-4 flex items-baseline text-5xl font-bold tracking-tight">
                  Custom
                </div>
                <p className="mt-4 text-sm text-muted-foreground">For organizations with advanced needs.</p>
                <Button variant="outline" className="mt-8 w-full rounded-full transition-transform hover:scale-105 active:scale-95">Contact Sales</Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background px-6 py-16">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="h-5 w-5 rounded bg-primary" />
              <span className="font-semibold tracking-tight">ShipFlow</span>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              API Status: {status}
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">Frameworks</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="transition-colors hover:text-foreground text-muted-foreground">Next.js</Link></li>
              <li><Link href="#" className="transition-colors hover:text-foreground text-muted-foreground">React</Link></li>
              <li><Link href="#" className="transition-colors hover:text-foreground text-muted-foreground">Svelte</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">Resources</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="transition-colors hover:text-foreground text-muted-foreground">Docs</Link></li>
              <li><Link href="#" className="transition-colors hover:text-foreground text-muted-foreground">Pricing</Link></li>
              <li><Link href="#" className="transition-colors hover:text-foreground text-muted-foreground">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-mono text-xs uppercase tracking-wider text-muted-foreground">Company</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="transition-colors hover:text-foreground text-muted-foreground">About</Link></li>
              <li><Link href="#" className="transition-colors hover:text-foreground text-muted-foreground">Careers</Link></li>
              <li><Link href="#" className="transition-colors hover:text-foreground text-muted-foreground">Contact</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
