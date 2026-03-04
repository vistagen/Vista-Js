import { createVistaClient } from '../../src/stack/client';
import { vstack } from '../../src/stack/index';

type Equals<TLeft, TRight> = (<T>() => T extends TLeft ? 1 : 2) extends <T>() => T extends TRight
  ? 1
  : 2
  ? true
  : false;
type Assert<TValue extends true> = TValue;

const v = vstack.init();
const appRouter = v.router({
  health: v.procedure.query(() => ({ ok: true as const })),
  user: v.procedure
    .input({
      parse(value: unknown) {
        const candidate = value as { name?: unknown };
        return { name: String(candidate.name ?? '') };
      },
    })
    .mutation(({ input }) => ({ name: input.name, created: true as const })),
});

type AppRouter = typeof appRouter;

const client = createVistaClient<AppRouter>({
  baseUrl: 'http://localhost:3000/api',
});

const healthPromise = client.$get('/health');
type _HealthPromise = Assert<Equals<typeof healthPromise, Promise<{ ok: true }>>>;

const userPromise = client.$post('/user', { name: 'ankit' });
type _UserPromise = Assert<Equals<typeof userPromise, Promise<{ name: string; created: true }>>>;

// @ts-expect-error GET is not allowed on a POST-only route
client.$get('/user');
// @ts-expect-error Missing required input for POST route
client.$post('/user');
