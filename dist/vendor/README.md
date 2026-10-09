# Bundled dependencies

These files were obtained from versioned packages on the official npm registry; no runtime CDN is needed.

| Dependency | Version | License / provenance |
| --- | --- | --- |
| lucide | 1.53.0 | ISC; `LUCIDE-LICENSE` |
| fflate | 0.8.3 | MIT; `FFLATE-LICENSE` |
| tesseract.js | 7.0.0 | Apache-2.0; `ocr/TESSERACT-LICENSE` plus bundle license notices |
| tesseract.js-core | 7.0.0 | Apache-2.0; `ocr/CORE-LICENSE`; matching non-SIMD, SIMD and relaxed-SIMD builds |
| @tesseract.js-data/eng | 1.0.0 | Package metadata declares MIT; English `4.0.0_best_int` model from [naptha/tessdata](https://github.com/naptha/tessdata) |

Tesseract 7 requires core 7. Using the npm core package's older default dist-tag caused a missing relaxed-SIMD build during testing; the matching explicit version was installed and OCR was verified afterward.
