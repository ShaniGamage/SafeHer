import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import ReportsClient from './ReportsClient';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div>
        <h1>dashborad</h1>
        <ReportsClient/>
    </div>
          
        
        
        
      
    
  );
}