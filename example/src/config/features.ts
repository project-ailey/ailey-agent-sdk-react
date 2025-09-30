import { CallTest } from '../components/CallTest';
import { SwapTest } from '../components/SwapTest';
import type {ComponentType} from 'react';

export interface Feature {
    id: string;
    title: string;
    description: string;
    icon: string;
    component: ComponentType;
    color: string;
    category: 'contract' | 'defi' | 'utility';
}

export const features: Feature[] = [
    {
        id: 'callTest',
        title: 'Contract Testing',
        description: 'Test basic smart contract function calls and interactions',
        icon: '🔧',
        component: CallTest,
        color: 'blue',
        category: 'contract'
    },
    {
        id: 'swapTest',
        title: 'Token Swap',
        description: 'Swap tokens through the Ailey Agent API with automatic routing',
        icon: '🔄',
        component: SwapTest,
        color: 'green',
        category: 'defi'
    }
    // Add more features here as they are developed
];