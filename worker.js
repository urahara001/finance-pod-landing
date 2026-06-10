export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        
        // Handle Listmonk proxy
        if (url.pathname === '/listmonk' && request.method === 'POST') {
            try {
                const { email, name } = await request.json();
                
                const listId = parseInt(env.LISTMONK_LIST_ID);
                const listmonkUrl = env.LISTMONK_URL;
                const username = env.LISTMONK_USER;
                const password = env.LISTMONK_PASSWORD;
                
                const auth = btoa(`${username}:${password}`);
                
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
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        // Serve static files
        return env.ASSETS.fetch(request);
    }
}
