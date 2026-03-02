export const metadata = {
  title: 'About - Vista Test App',
  description: 'About page for testing Vista routing',
};

export default function AboutPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white dark:bg-black">
      <h1 className="text-4xl font-bold text-black dark:text-white mb-4">About Page</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400">
        This is a nested route served by Vista's RSC engine.
      </p>
      <a
        href="/"
        className="mt-6 text-blue-500 hover:underline"
      >
        ← Back to Home
      </a>
    </main>
  );
}
