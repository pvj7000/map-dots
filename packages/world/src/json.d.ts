declare module "*.json" {
  const value: {
    type: "FeatureCollection";
    features: unknown[];
  };
  export default value;
}
