export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        
        // Handle Listmonk subscription
        if (url.pathname === '/listmonk' && request.method === 'POST') {
            try {
                const { email, name } = await request.json();
                
                // Required environment variables:
                // LISTMONK_URL = "https://emails-finance.yashparkar.com/api"
                // LISTMONK_LIST_ID = "3"
                // LISTMONK_API_USER = "api-username-listmonk"
                // LISTMONK_API_TOKEN = "9RC5xChwAbeVQ6eMV9SLoo1jpmvmXHbD"
                
                const listId = parseInt(env.LISTMONK_LIST_ID, 10);
                const listmonkUrl = env.LISTMONK_URL;
                const apiUser = env.LISTMONK_API_USER;
                const apiToken = env.LISTMONK_API_TOKEN;
                
                // Basic Auth with API user and token
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
        
        // Serve static assets (your HTML, CSS, JS)
        return env.ASSETS.fetch(request);
    }
}