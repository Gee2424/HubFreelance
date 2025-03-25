
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Test() {
  useEffect(() => {
    async function testConnection() {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .limit(1);
        
        console.log('Supabase connection test:', { data, error });
      } catch (err) {
        console.error('Supabase connection failed:', err);
      }
    }
    
    testConnection();
  }, []);

  return <div>Testing Supabase Connection...</div>;
}
