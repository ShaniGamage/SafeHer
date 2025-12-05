import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4 text-gray-900">
          Welcome to My App
        </h1>
        <p className="text-xl text-gray-600 mb-12">
          Get started by signing in or creating an account
        </p>
      </div>
      
      <SignedOut>
        <div className="flex gap-4">
          <Link 
            href="/sign-in"
            className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Sign In
          </Link>
          <Link 
            href="/sign-up"
            className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Sign Up
          </Link>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-lg shadow-lg">
            <UserButton afterSignOutUrl="/" />
            <span className="text-gray-700 font-medium">You're signed in!</span>
          </div>
          <Link 
            href="/dashboard"
            className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Go to Dashboard →
          </Link>
        </div>
      </SignedIn>
    </div>
  );
}