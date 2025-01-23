// src/routes/script.js/+server.js
import { EXCLUDED_IP } from '$env/static/private';

export async function GET(event) {
  // Get the client's IP address
  const clientIP = event.request.headers.get("CF-Connecting-IP") || event.getClientAddress();

  // Check if the client's IP matches the excluded IP
  if (clientIP === EXCLUDED_IP) {
    return new Response(`Ignore IP ${EXCLUDED_IP}`, { status: 403 }); // Return a 403 Forbidden response
  }

  // URL of the external script
  const externalUrl = 'https://cloud.umami.is/script.js';

  // Fetch the script from the external source
  const response = await fetch(externalUrl);

  // Check if the response is OK
  if (!response.ok) {
    return new Response('Failed to fetch the script', { status: 500 });
  }

  // Return the script to the client
  return new Response(response.body, {
    headers: {
      'Content-Type': 'application/javascript', // Set the correct MIME type
    },
  });
}