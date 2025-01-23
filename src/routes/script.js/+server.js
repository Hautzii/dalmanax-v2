// src/routes/script.js/+server.js
export async function GET() {
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