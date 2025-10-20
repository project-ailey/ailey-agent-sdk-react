import {CallTest} from '../components/CallTest';
import {SwapTest} from '../components/SwapTest';
import {AddLiquidityTest} from '../components/AddLiquidityTest';
import {SwapQuoteTest} from '../components/SwapQuoteTest';
import type {ComponentType} from 'react';
import type {LucideIcon} from 'lucide-react';
import {ArrowLeftRight, Calculator, Droplets, FileCode} from 'lucide-react';

export interface Feature {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    component: ComponentType<{ onClose: () => void }>;
    category: 'contract' | 'defi' | 'utility';
}

export const features: Feature[] = [
    {
        id: 'callTest',
        title: 'Contract Testing',
        description: 'Test basic smart contract function calls and interactions',
        icon: FileCode,
        component: CallTest,
        category: 'contract'
    },
    {
        id: 'swapQuoteTest',
        title: 'Swap Quote Calculator',
        description: 'Get real-time swap quotes with price and slippage information',
        icon: Calculator,
        component: SwapQuoteTest,
        category: 'defi'
    },
    {
        id: 'swapTest',
        title: 'Token Swap',
        description: 'Swap tokens through the Ailey Agent API with automatic routing',
        icon: ArrowLeftRight,
        component: SwapTest,
        category: 'defi'
    },
    {
        id: 'addLiquidityTest',
        title: 'Add Liquidity',
        description: 'Add liquidity to token pools through the Ailey Agent API',
        icon: Droplets,
        component: AddLiquidityTest,
        category: 'defi'
    }
    // Add more features here as they are developed
];