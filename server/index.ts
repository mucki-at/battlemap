import { routePartykitRequest } from 'partyserver';
import { YServer } from 'y-partyserver';

// Define your Server
export class BattleMapServer extends YServer {
    static options = {
        hibernate: true,
    };
}

interface OAuthRequest {
    code: string;
}

interface OAuthResult {
    access_token: string;
}

export default {
    // Set up your fetch handler to use configured Servers
    async fetch(request: Request, env: Env): Promise<Response> {
        if (request.url.endsWith('/api/token')) {
            // extract the request code
            const { code } = (await request.json()) as OAuthRequest;

            // Exchange the code for an access_token
            const response = await fetch(
                `https://discord.com/api/oauth2/token`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({
                        client_id: env.VITE_DISCORD_CLIENT_ID,
                        client_secret: env.DISCORD_CLIENT_SECRET,
                        grant_type: 'authorization_code',
                        code: code,
                    }),
                }
            );

            // Retrieve the access_token from the response
            const { access_token } = (await response.json()) as OAuthResult;

            return Response.json({ access_token });
        } else {
            return (
                (await routePartykitRequest(request, env)) ||
                new Response('Not Found', { status: 404 })
            );
        }
    },
} satisfies ExportedHandler<Env>;
