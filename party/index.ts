import { routePartykitRequest } from 'partyserver';
import { YServer } from 'y-partyserver';

// Define your Server
export class BattleMapServer extends YServer {
    static options = {
        hibernate: true,
    };
}

export default {
    // Set up your fetch handler to use configured Servers
    async fetch(request: Request, env: Env): Promise<Response> {
        return (
            (await routePartykitRequest(request, env)) ||
            new Response('Not Found', { status: 404 })
        );
    },
} satisfies ExportedHandler<Env>;
