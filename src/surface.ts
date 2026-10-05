/** A host supplies a target; it may be a DOM node, native surface or test value. */
export interface KonitifToolSurfaceContext<TTarget, TState, TServices extends object> {
  readonly target: TTarget;
  readonly state: TState;
  /** Borrowed services. Mounting a surface does not transfer their ownership. */
  readonly services: Readonly<TServices>;
}

export interface KonitifToolSurfaceInstance {
  /** Release only occurrence-owned resources. May complete asynchronously. */
  dispose(): void | Promise<void>;
}

export interface KonitifToolSurfaceImplementation<TTarget, TState, TServices extends object> {
  readonly requiredServices: readonly Extract<keyof TServices, string>[];
  /**
   * Explicit effect, never invoked by declaration, binding or registration.
   * The implementation owns partial-setup cleanup if mounting throws/rejects.
   * The host owns when to mount and dispose (including late asynchronous mounts).
   */
  mount(context: KonitifToolSurfaceContext<TTarget, TState, TServices>):
    KonitifToolSurfaceInstance | Promise<KonitifToolSurfaceInstance>;
}

export type KonitifToolSurfaceMountResult =
  | { readonly status: 'mounted'; readonly instance: { dispose(): Promise<void> } }
  | { readonly status: 'refused'; readonly reason: 'missing-services'; readonly missingServices: readonly string[] }
  | { readonly status: 'failed'; readonly reason: 'mount-failed'; readonly cause: unknown };

/**
 * Checks service presence, not semantic compatibility, permission or trust.
 * No provider resolution, code acquisition, framework or workspace is implied.
 */
export async function mountKonitifToolSurface<TTarget, TState, TServices extends object>(
  implementation: KonitifToolSurfaceImplementation<TTarget, TState, TServices>,
  context: KonitifToolSurfaceContext<TTarget, TState, TServices>
): Promise<KonitifToolSurfaceMountResult> {
  const missingServices = [...new Set(implementation.requiredServices)].filter(key =>
    !Object.prototype.hasOwnProperty.call(context.services, key)
    || context.services[key] === undefined || context.services[key] === null
  );
  if (missingServices.length > 0) {
    return { status: 'refused', reason: 'missing-services', missingServices };
  }
  try {
    const mounted = await implementation.mount(context);
    if (!mounted || typeof mounted.dispose !== 'function') {
      throw new Error('Mounted tool surface must supply dispose().');
    }
    let disposal: Promise<void> | undefined;
    return {
      status: 'mounted',
      instance: Object.freeze({
        dispose(): Promise<void> {
          // Assign before invoking user code: concurrent/reentrant callers share cleanup.
          disposal ??= Promise.resolve().then(() => mounted.dispose());
          return disposal;
        }
      })
    };
  } catch (cause) {
    return { status: 'failed', reason: 'mount-failed', cause };
  }
}
