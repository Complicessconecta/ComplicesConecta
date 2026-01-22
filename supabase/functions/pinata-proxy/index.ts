import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PINATA_JWT = Deno.env.get('PINATA_JWT') || '';
const PINATA_API_URL = 'https://api.pinata.cloud';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { method, path, body } = await req.json();

    const allowedMethods = ['pinning/pinFileToIPFS', 'pinning/unpin'];
    if (!allowedMethods.includes(method)) {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const url = `${PINATA_API_URL}${path}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: response.status,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
