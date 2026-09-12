export type InteractionInputSource = 'keyboard' | 'controller' | 'soundboard';

export type InteractionInputPhase = 'press' | 'release';

export type InteractionInputModifier = 'alt' | 'control' | 'meta' | 'shift';

/** A modal occurrence reported by an input adapter. */
export interface InteractionInputSignal {
  source: InteractionInputSource;
  controlId: string;
  phase: InteractionInputPhase;
  modifiers?: readonly InteractionInputModifier[];
  repeat?: boolean;
}

/** An authored association between a modal control and an amodal action. */
export interface InteractionInputBinding {
  id: string;
  actionId: string;
  source: InteractionInputSource;
  controlId: string;
  phase: InteractionInputPhase;
  modifiers?: readonly InteractionInputModifier[];
  allowRepeat?: boolean;
  enabled?: boolean;
}

/**
 * A workspace/session override. The action identity is intentionally immutable:
 * an override can move or disable an association, but cannot silently change its meaning.
 */
export interface InteractionInputBindingOverride {
  bindingId: string;
  source?: InteractionInputSource;
  controlId?: string;
  phase?: InteractionInputPhase;
  modifiers?: readonly InteractionInputModifier[];
  allowRepeat?: boolean;
  enabled?: boolean;
}

export interface InteractionInputActionInvocation {
  actionId: string;
  bindingId: string;
  signal: InteractionInputSignal;
}

const MODIFIER_ORDER: readonly InteractionInputModifier[] = ['control', 'alt', 'shift', 'meta'];

function normalizeModifiers(
  modifiers: readonly InteractionInputModifier[] | undefined
): readonly InteractionInputModifier[] {
  if (!modifiers?.length) return [];
  const unique = new Set(modifiers);
  return MODIFIER_ORDER.filter((modifier) => unique.has(modifier));
}

function modifiersMatch(
  expected: readonly InteractionInputModifier[] | undefined,
  observed: readonly InteractionInputModifier[] | undefined
): boolean {
  const expectedNormalized = normalizeModifiers(expected);
  const observedNormalized = normalizeModifiers(observed);
  return (
    expectedNormalized.length === observedNormalized.length &&
    expectedNormalized.every((modifier, index) => modifier === observedNormalized[index])
  );
}

export function resolveInteractionInputBindings(
  authoredBindings: readonly InteractionInputBinding[],
  overrides: readonly InteractionInputBindingOverride[] = []
): readonly InteractionInputBinding[] {
  const overridesByBindingId = new Map(overrides.map((override) => [override.bindingId, override] as const));

  return authoredBindings
    .map((binding) => {
      const override = overridesByBindingId.get(binding.id);
      if (!override) return { ...binding, modifiers: normalizeModifiers(binding.modifiers) };
      return {
        ...binding,
        source: override.source ?? binding.source,
        controlId: override.controlId ?? binding.controlId,
        phase: override.phase ?? binding.phase,
        modifiers:
          override.modifiers === undefined
            ? normalizeModifiers(binding.modifiers)
            : normalizeModifiers(override.modifiers),
        allowRepeat: override.allowRepeat ?? binding.allowRepeat,
        enabled: override.enabled ?? binding.enabled
      };
    })
    .filter((binding) => binding.enabled !== false);
}

export function resolveInteractionInputActions(
  bindings: readonly InteractionInputBinding[],
  signal: InteractionInputSignal
): readonly InteractionInputActionInvocation[] {
  return bindings
    .filter(
      (binding) =>
        binding.enabled !== false &&
        binding.source === signal.source &&
        binding.controlId === signal.controlId &&
        binding.phase === signal.phase &&
        (binding.allowRepeat === true || signal.repeat !== true) &&
        modifiersMatch(binding.modifiers, signal.modifiers)
    )
    .map((binding) => ({
      actionId: binding.actionId,
      bindingId: binding.id,
      signal
    }));
}
