import type {Feature} from '../config/features';
import {Badge} from "@/components/ui/badge";

interface FeatureCardProps {
    feature: Feature;
    isSelected: boolean;
    onSelect: () => void;
}

export function FeatureCard({ feature, isSelected, onSelect }: FeatureCardProps) {
    const Icon = feature.icon;

    return (
        <button
            onClick={onSelect}
            className={`w-full text-left p-6 rounded-lg border-2 transition-all duration-200 ${
                isSelected
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
            }`}
        >
            <div className="flex items-start gap-3 mb-3">
                <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-gray-900' : 'text-gray-600'}`} />
                <div className="flex-1">
                    <h3 className={`font-semibold mb-1 ${isSelected ? 'text-gray-900' : 'text-gray-900'}`}>
                        {feature.title}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                        {feature.category}
                    </Badge>
                </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
                {feature.description}
            </p>
        </button>
    );
}
