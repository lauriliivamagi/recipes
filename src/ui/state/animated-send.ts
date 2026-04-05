import type { AnyActorRef } from 'xstate';

interface AnimatedSendOptions {
  animate?: boolean;
}

/**
 * Send an event to an XState actor, wrapping the update in a View Transition
 * when the browser supports it and the user hasn't requested reduced motion.
 *
 * After the transition finishes, dispatches ANIMATION_COMPLETE to the actor
 * so animation-phase states can exit cleanly.
 *
 * Returns the ViewTransition object when a transition was started, or undefined.
 */
export function animatedSend<TActor extends AnyActorRef>(
  actorRef: TActor,
  event: Parameters<TActor['send']>[0],
  options: AnimatedSendOptions = {},
): ViewTransition | undefined {
  const { animate = true } = options;

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  if (!animate || !document.startViewTransition || prefersReducedMotion) {
    actorRef.send(event);
    return undefined;
  }

  const transition = document.startViewTransition(() => {
    actorRef.send(event);
  });

  transition.finished.then(() => {
    actorRef.send({ type: 'ANIMATION_COMPLETE' } as Parameters<TActor['send']>[0]);
  });

  return transition;
}
