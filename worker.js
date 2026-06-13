export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        
        if (url.pathname === '/listmonk' && request.method === 'POST') {
            try {
                const { email, name } = await request.json();

                // Debug logs (optional, remove in production if you prefer)
                console.log('Listmonk request:', { email, name });
                console.log('Env vars present:', {
                    hasApiUser: !!env.LISTMONK_API_USER,
                    hasApiToken: !!env.LISTMONK_API_TOKEN,
                    hasListId: !!env.LISTMONK_LIST_ID,
                    listmonkUrl: env.LISTMONK_URL
                });

                const listId = parseInt(env.LISTMONK_LIST_ID, 10);
                const listmonkUrl = env.LISTMONK_URL;          
                const apiUser = env.LISTMONK_API_USER;
                const apiToken = env.LISTMONK_API_TOKEN;

                // Use Basic Auth with API user and token
                const auth = btoa(`${apiUser}:${apiToken}`);

                const response = await fetch(`${listmonkUrl}/subscribers`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Basic ${auth}`
                    },
                    body: JSON.stringify({
                        email: email,
                        name: name || '',
                        lists: [listId],
                        status: 'enabled'
                    })
                });

                const data = await response.json();
                return new Response(JSON.stringify(data), {
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (err) {
                console.error('Listmonk error:', err);
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        return env.ASSETS.fetch(request);
    }
}