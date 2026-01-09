import Link from "next/link"

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-xl w-full px-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Tzylo Console
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">
          Control plane for Tzylo infrastructure.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/auth/login"
            className="px-4 py-2 border rounded text-sm hover:bg-muted transition"
          >
            Sign in
          </Link>

          <Link
            href="/dashboard/flux"
            className="px-4 py-2 bg-foreground text-background rounded text-sm hover:opacity-90 transition"
          >
            Open Console
          </Link>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          Authentication powered by Tzylo Auth CE
        </p>
      </div>
    </main>
  )
}
