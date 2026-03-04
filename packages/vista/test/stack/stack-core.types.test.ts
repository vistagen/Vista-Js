import { vstack } from '../../src/stack/index';

type Equals<TLeft, TRight> = (<T>() => T extends TLeft ? 1 : 2) extends <T>() => T extends TRight
  ? 1
  : 2
  ? true
  : false;
type Assert<TValue extends true> = TValue;

const v = vstack.init<{ requestId: string }, { actorId: string }>();

const withActor = v.middleware(({ env }) => ({ actorId: env.actorId }));
const withTrace = v.middleware<{ requestId: string; actorId: string }, { traceId: string }>(
  ({ ctx }) => ({ traceId: `${ctx.requestId}:${ctx.actorId}` })
);

const inputSchema = {
  parse(value: unknown) {
    const candidate = value as { slug?: unknown };
    return {
      slug: String(candidate.slug ?? ''),
    };
  },
};

const typedProcedure = v.procedure
  .use(withActor)
  .use(withTrace)
  .input(inputSchema)
  .query(({ ctx, input }) => ({
    trace: ctx.traceId,
    slug: input.slug,
  }));

type InferredInput = Parameters<typeof typedProcedure.handler>[0]['input'];
type InferredOutput = Awaited<ReturnType<typeof typedProcedure.handler>>;
type InferredContext = Parameters<typeof typedProcedure.handler>[0]['ctx'];

type _InputAssertion = Assert<Equals<InferredInput, { slug: string }>>;
type _OutputAssertion = Assert<Equals<InferredOutput, { trace: string; slug: string }>>;
type _ContextAssertion = Assert<
  Equals<InferredContext, { requestId: string; actorId: string; traceId: string }>
>;

v.procedure.query(({ ctx }) => {
  // @ts-expect-error actorId is not available without middleware context enrichment
  return ctx.actorId;
});
