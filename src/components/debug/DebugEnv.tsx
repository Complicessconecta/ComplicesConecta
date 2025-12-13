import { useState, useEffect } from 'react';

const DebugEnv = () => {
  const [isDebug, setIsDebug] = useState(false);

  useEffect(() => {
    // Check for ?debug=true in the URL
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('debug') === 'true') {
      setIsDebug(true);
    }
  }, []);

  if (!isDebug) {
    return null;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'No definida';
  const appMode = import.meta.env.MODE || 'No definido';

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      zIndex: 9999,
      fontSize: '12px',
      fontFamily: 'monospace',
    }}>
      <h3 style={{ margin: '0 0 5px 0', borderBottom: '1px solid #555' }}>[Debug Panel]</h3>
      <p style={{ margin: 0 }}><strong>Mode:</strong> {appMode}</p>
      <p style={{ margin: 0 }}><strong>URL:</strong> {supabaseUrl.substring(0, 25)}...</p>
    </div>
  );
};

export default DebugEnv;
