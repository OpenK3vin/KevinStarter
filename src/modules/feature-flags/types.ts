export type FeatureFlags = Record<string, boolean>;

export type FeatureFlagContextValue = {
	flags: FeatureFlags;
	setFlag: (key: string, value: boolean) => void;
	isEnabled: (key: string) => boolean;
};
