import sharp from "sharp";
for (const size of [192, 512]) {
  await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#20251e"/><rect x="111" y="151" width="290" height="204" rx="28" fill="#cfba86"/><rect x="112" y="195" width="288" height="8" fill="#82734e"/><text x="256" y="294" text-anchor="middle" font-family="Arial,sans-serif" font-size="73" font-weight="bold" fill="#303426">CC</text></svg>`,
    ),
  )
    .resize(size, size)
    .png()
    .toFile(`public/icon-${size}.png`);
}
