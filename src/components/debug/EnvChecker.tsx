import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface EnvStatus {
  supabaseUrl: boolean;
  supabaseAnonKey: boolean;
  allConfigured: boolean;
}

export const EnvChecker = () => {
  const [envStatus, setEnvStatus] = useState<EnvStatus>({
    supabaseUrl: false,
    supabaseAnonKey: false,
    allConfigured: false,
  });

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const urlConfigured = !!(
      supabaseUrl &&
      typeof supabaseUrl === 'string' &&
      supabaseUrl.startsWith('https://') &&
      !supabaseUrl.includes('your-supabase-url-here') &&
      !supabaseUrl.includes('placeholder')
    );

    const keyConfigured = !!(
      supabaseAnonKey &&
      typeof supabaseAnonKey === 'string' &&
      supabaseAnonKey.length > 20 &&
      !supabaseAnonKey.includes('your-supabase-anon-key-here') &&
      !supabaseAnonKey.includes('placeholder')
    );

    const allConfigured = urlConfigured && keyConfigured;

    setEnvStatus({
      supabaseUrl: urlConfigured,
      supabaseAnonKey: keyConfigured,
      allConfigured,
    });

    if (!allConfigured) {
      console.error('CRITICAL CONFIG ERROR: Missing or invalid Supabase Environment Variables', {
        VITE_SUPABASE_URL: urlConfigured ? '✅ Configured' : '❌ Missing/Invalid',
        VITE_SUPABASE_ANON_KEY: keyConfigured ? '✅ Configured' : '❌ Missing/Invalid',
      });
    }
  }, []);

  if (envStatus.allConfigured) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-red-950 border-2 border-red-500 rounded-lg p-8 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
          <h1 className="text-2xl font-bold text-red-300">CRITICAL CONFIG ERROR</h1>
        </div>

        <p className="text-red-200 mb-6 text-lg font-semibold">
          Missing Supabase Environment Variables
        </p>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3">
            {envStatus.supabaseUrl ? (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={envStatus.supabaseUrl ? 'text-green-300' : 'text-red-300'}>
                <strong>VITE_SUPABASE_URL</strong>
              </p>
              <p className="text-sm text-red-200/80">
                {envStatus.supabaseUrl ? 'Configured ✅' : 'Missing or invalid ❌'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            {envStatus.supabaseAnonKey ? (
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            )}
            <div>
              <p className={envStatus.supabaseAnonKey ? 'text-green-300' : 'text-red-300'}>
                <strong>VITE_SUPABASE_ANON_KEY</strong>
              </p>
              <p className="text-sm text-red-200/80">
                {envStatus.supabaseAnonKey ? 'Configured ✅' : 'Missing or invalid ❌'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-900/50 border border-red-700 rounded p-4 mb-6">
          <p className="text-sm text-red-200">
            <strong>Action Required:</strong> Please verify that your Vercel environment variables are correctly set:
          </p>
          <ul className="text-xs text-red-200/80 mt-2 space-y-1 ml-4 list-disc">
            <li>VITE_SUPABASE_URL must be a valid HTTPS URL</li>
            <li>VITE_SUPABASE_ANON_KEY must be a valid Supabase anonymous key</li>
            <li>Check Vercel project settings → Environment Variables</li>
            <li>Redeploy after updating variables</li>
          </ul>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded transition-colors"
        >
          Retry Connection
        </button>

        <p className="text-xs text-red-300/60 text-center mt-4">
          Check browser console for detailed error logs
        </p>
      </div>
    </div>
  );
};
