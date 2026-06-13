export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        
        if (url.pathname === '/listmonk' && request.method === 'POST') {
            try {
                const { email, name } = await request.json();
                
                // Log all environment variables for debugging
                console.log('LISTMONK_URL:', env.LISTMONK_URL);
                console.log('LISTMONK_LIST_ID:', env.LISTMONK_LIST_ID);
                console.log('LISTMONK_API_USER:', env.LISTMONK_API_USER);
                console.log('LISTMONK_API_TOKEN exists:', !!env.LISTMONK_API_TOKEN);
                
                const listId = parseInt(env.LISTMONK_LIST_ID, 10);
                if (isNaN(listId)) {
                    throw new Error(`Invalid LISTMONK_LIST_ID: ${env.LISTMONK_LIST_ID}`);
                }
                const listmonkUrl = env.LISTMONK_URL;
                if (!listmonkUrl) throw new Error('LISTMONK_URL is missing');
                const apiUser = env.LISTMONK_API_USER;
                if (!apiUser) throw new Error('LISTMONK_API_USER is missing');
                const apiToken = env.LISTMONK_API_TOKEN;
                if (!apiToken) throw new Error('LISTMONK_API_TOKEN is missing');
                
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
                return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }
        
        return env.ASSETS.fetch(request);
    }
}