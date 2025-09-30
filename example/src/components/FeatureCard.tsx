import { useState } from 'react';
import type {Feature} from '../config/features';

interface FeatureCardProps {
    feature: Feature;
}

export function FeatureCard({ feature }: FeatureCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const colorClasses = {
        blue: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            icon: 'text-blue-600',
            button: 'bg-blue-600 hover:bg-blue-700',
            text: 'text-blue-900'
        },
        green: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            icon: 'text-green-600',
            button: 'bg-green-600 hover:bg-green-700',
            text: 'text-green-900'
        },
        purple: {
            bg: 'bg-purple-50',
            border: 'border-purple-200',
            icon: 'text-purple-600',
            button: 'bg-purple-600 hover:bg-purple-700',
            text: 'text-purple-900'
        }
    };

    const colors = colorClasses[feature.color as keyof typeof colorClasses] || colorClasses.blue;

    return (
        <div className="w-full max-w-2xl mx-auto">
            {/* Feature Card */}
            <div className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-6 shadow-lg hover:shadow-xl transition-all duration-300`}>
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                        <div className={`text-4xl ${colors.icon}`}>
                            {feature.icon}
                        </div>
                        <div className="flex-1">
                            <h3 className={`text-xl font-bold ${colors.text} mb-2`}>
                                {feature.title}
                            </h3>
                            <p className="text-gray-600 text-sm leading-relaxed mb-4">
                                {feature.description}
                            </p>
                            <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-60 text-gray-700">
                                    {feature.category}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`w-full ${colors.button} text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2`}
                    >
                        <span>{isExpanded ? 'Hide' : 'Try'} {feature.title}</span>
                        <svg
                            className={`w-5 h-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="mt-4 bg-white rounded-xl shadow-lg border border-gray-200 p-6 animate-in slide-in-from-top-5 duration-300">
                    <div className="border-t border-gray-100 pt-6">
                        <feature.component />
                    </div>
                </div>
            )}
        </div>
    );
}