export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        
        if (url.pathname === '/listmonk' && request.method === 'POST') {
            try {
                const { email, name } = await request.json();
                
                console.log('Listmonk request:', { email, name });
                console.log('Env vars:', {
                    listId: env.LISTMONK_LIST_ID,
                    url: env.LISTMONK_URL,
                    user: env.LISTMONK_USER
                });
                
                const listId = parseInt(env.LISTMONK_LIST_ID);
                const listmonkUrl = env.LISTMONK_URL;
                const username = env.LISTMONK_USER;
                const password = env.LISTMONK_PASSWORD;
                
                const response = await fetch(`${listmonkUrl}/subscribers`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Basic ' + btoa(`${username}:${password}`)
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