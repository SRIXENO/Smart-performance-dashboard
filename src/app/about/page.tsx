export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            About This Project
          </h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Technology Stack
            </h2>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300">
              <li>• Next.js 16 - React framework for production</li>
              <li>• TypeScript - Type-safe JavaScript</li>
              <li>• Tailwind CSS - Utility-first CSS framework</li>
              <li>• React 19 - Latest React features</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Features
            </h2>
            <div className="grid md:grid-cols-2 gap-4 text-gray-600 dark:text-gray-300">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Performance</h3>
                <p>Optimized for speed with Next.js built-in optimizations</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Responsive</h3>
                <p>Mobile-first design that works on all devices</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Dark Mode</h3>
                <p>Automatic dark mode support based on system preferences</p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2">Type Safe</h3>
                <p>Full TypeScript support for better development experience</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <a 
              href="/"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-block"
            >
              Back to Home
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}