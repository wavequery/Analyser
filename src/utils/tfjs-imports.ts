export interface TensorFlowImports {
  tf: any;
  use: any;
}

export async function loadTensorFlowImports(): Promise<TensorFlowImports> {
  if (typeof window === "undefined") {
    // Node.js environment
    const tf = await import("@tensorflow/tfjs-node");
    const use = await import("@tensorflow-models/universal-sentence-encoder");
    return { tf, use };
  } else {
    // Browser environment
    const tf = await import("@tensorflow/tfjs");
    const use = await import("@tensorflow-models/universal-sentence-encoder");
    return { tf, use };
  }
}
