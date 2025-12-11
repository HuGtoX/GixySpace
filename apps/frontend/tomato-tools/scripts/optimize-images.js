const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// 配置
const config = {
  // 头像图片优化配置
  avatar: {
    inputDir: path.join(__dirname, "../public/avatar"),
    outputDir: path.join(__dirname, "../public/avatar-optimized"),
    quality: 80,
    maxWidth: 400,
    formats: ["webp", "png"],
  },
  // 新闻图标优化配置
  newsIcon: {
    inputDir: path.join(__dirname, "../public/news-icon"),
    outputDir: path.join(__dirname, "../public/news-icon-optimized"),
    quality: 85,
    maxWidth: 200,
    formats: ["webp", "png"],
  },
};

/**
 * 优化单个图片
 * @param {string} inputPath - 输入文件路径
 * @param {string} outputDir - 输出目录
 * @param {object} options - 优化选项
 */
async function optimizeImage(inputPath, outputDir, options) {
  const { quality, maxWidth, formats } = options;
  const filename = path.basename(inputPath, path.extname(inputPath));
  const ext = path.extname(inputPath).toLowerCase();

  // 只处理图片文件
  if (![".png", ".jpg", ".jpeg"].includes(ext)) {
    console.log(`跳过非图片文件: ${inputPath}`);
    return;
  }

  console.log(`正在优化: ${inputPath}`);

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // 如果图片宽度超过最大宽度，则调整大小
    if (metadata.width > maxWidth) {
      image.resize(maxWidth, null, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // 生成不同格式的图片
    for (const format of formats) {
      const outputPath = path.join(outputDir, `${filename}.${format}`);

      if (format === "webp") {
        await image.clone().webp({ quality }).toFile(outputPath);
      } else if (format === "png") {
        await image
          .clone()
          .png({ quality, compressionLevel: 9 })
          .toFile(outputPath);
      } else if (format === "jpg" || format === "jpeg") {
        await image.clone().jpeg({ quality }).toFile(outputPath);
      }

      const originalSize = fs.statSync(inputPath).size;
      const optimizedSize = fs.statSync(outputPath).size;
      const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(2);

      console.log(
        `  ✓ ${format.toUpperCase()}: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(optimizedSize / 1024 / 1024).toFixed(2)}MB (减少 ${reduction}%)`,
      );
    }
  } catch (error) {
    console.error(`优化失败 ${inputPath}:`, error.message);
  }
}

/**
 * 批量优化目录中的图片
 * @param {object} dirConfig - 目录配置
 */
async function optimizeDirectory(dirConfig) {
  const { inputDir, outputDir, quality, maxWidth, formats } = dirConfig;

  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 读取目录中的所有文件
  const files = fs.readdirSync(inputDir);

  console.log(`\n开始优化目录: ${inputDir}`);
  console.log(`输出目录: ${outputDir}\n`);

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const stat = fs.statSync(inputPath);

    if (stat.isFile()) {
      await optimizeImage(inputPath, outputDir, {
        quality,
        maxWidth,
        formats,
      });
    }
  }
}

/**
 * 优化SVG文件
 * @param {string} svgPath - SVG文件路径
 */
async function optimizeSVG(svgPath) {
  const SVGO = require("svgo");

  const svgo = new SVGO({
    plugins: [
      { name: "removeDoctype" },
      { name: "removeXMLProcInst" },
      { name: "removeComments" },
      { name: "removeMetadata" },
      { name: "removeEditorsNSData" },
      { name: "cleanupAttrs" },
      { name: "mergeStyles" },
      { name: "inlineStyles" },
      { name: "minifyStyles" },
      { name: "cleanupIds" },
      { name: "removeUselessDefs" },
      { name: "cleanupNumericValues" },
      { name: "convertColors" },
      { name: "removeUnknownsAndDefaults" },
      { name: "removeNonInheritableGroupAttrs" },
      { name: "removeUselessStrokeAndFill" },
      { name: "removeViewBox", active: false },
      { name: "cleanupEnableBackground" },
      { name: "removeHiddenElems" },
      { name: "removeEmptyText" },
      { name: "convertShapeToPath" },
      { name: "moveElemsAttrsToGroup" },
      { name: "moveGroupAttrsToElems" },
      { name: "collapseGroups" },
      { name: "convertPathData" },
      { name: "convertTransform" },
      { name: "removeEmptyAttrs" },
      { name: "removeEmptyContainers" },
      { name: "mergePaths" },
      { name: "removeUnusedNS" },
      { name: "sortAttrs" },
      { name: "removeTitle" },
      { name: "removeDesc" },
      { name: "removeDimensions", active: false },
    ],
  });

  const svgContent = fs.readFileSync(svgPath, "utf8");
  const originalSize = fs.statSync(svgPath).size;

  try {
    const result = await svgo.optimize(svgContent, { path: svgPath });
    const outputPath = svgPath.replace(".svg", ".optimized.svg");
    fs.writeFileSync(outputPath, result.data);

    const optimizedSize = fs.statSync(outputPath).size;
    const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(2);

    console.log(
      `✓ SVG优化: ${path.basename(svgPath)} ${(originalSize / 1024).toFixed(2)}KB → ${(optimizedSize / 1024).toFixed(2)}KB (减少 ${reduction}%)`,
    );
  } catch (error) {
    console.error(`SVG优化失败 ${svgPath}:`, error.message);
  }
}

// 主函数
async function main() {
  console.log("🚀 开始图片优化...\n");

  // 优化头像图片
  await optimizeDirectory(config.avatar);

  // 优化新闻图标
  await optimizeDirectory(config.newsIcon);

  // 优化大型SVG文件
  console.log("\n开始优化SVG文件...\n");
  const largeSVGs = [
    path.join(__dirname, "../public/news-icon/douyin.svg"),
    path.join(__dirname, "../public/news-icon/toutiao.svg"),
    path.join(__dirname, "../public/news-icon/baidu.svg"),
  ];

  for (const svgPath of largeSVGs) {
    if (fs.existsSync(svgPath)) {
      await optimizeSVG(svgPath);
    }
  }

  console.log("\n✅ 图片优化完成！");
  console.log("\n📝 后续步骤：");
  console.log("1. 检查优化后的图片质量");
  console.log("2. 将优化后的图片替换原文件");
  console.log("3. 更新代码中的图片引用，使用 Next.js Image 组件");
}

// 运行
main().catch(console.error);
