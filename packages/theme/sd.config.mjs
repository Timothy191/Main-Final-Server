import StyleDictionary from "style-dictionary";

// Use built-in web transforms
const sd = new StyleDictionary({
  source: ["tokens.json"],
  platforms: {
    css: {
      transformGroup: "css",
      buildPath: "src/css/",
      files: [
        {
          destination: "variables-generated.css",
          format: "css/variables",
          options: {
            outputReferences: true,
            showFileHeader: true,
          },
        },
      ],
    },
    ts: {
      transformGroup: "js",
      buildPath: "src/tokens/",
      files: [
        {
          destination: "generated-sd.ts",
          format: "javascript/module",
        },
      ],
    },
    json: {
      buildPath: "src/tokens/",
      files: [
        {
          destination: "tokens-hsl.json",
          format: "json",
        },
      ],
    },
  },
});

await sd.buildAllPlatforms();
console.log("✅ Style Dictionary build complete!");
