import { createContext } from '@lit/context';
import type { AnyActorRef } from 'xstate';

export const i18nContext = createContext<Record<string, any>>('i18n');
export const scaleFactorContext = createContext<number>('scaleFactor');
export const recipeMachineContext = createContext<AnyActorRef>('recipe-machine');
