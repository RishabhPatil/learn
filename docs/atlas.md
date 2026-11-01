# The Position Atlas: scope and implementation

Reviewed November 1, 2026. The catalog is deliberately extensible and explicitly **not exhaustive**. Twenty teaching configurations currently share an interactive context; a separate further-reading queue is not labeled as implemented.

## Three different spaces

1. **Source layout** retains the input patch grids for reference.
2. **Position IDs** displays indices supplied to a positional method, not hidden states. M-RoPE uses `[t,h,w]`, with `h` as row and `w` as column. VRoPE has four directional indices; its 3D display is a labeled invertible parameterization.
3. **Rotary phases** are high-dimensional. The frequency strip and phase wheel show their axis assignments and selected components. Identical 3D geometry can produce different positional kernels.

The renderer uses orthographic projection and a depth-sorted painter's algorithm. Mouse drag and arrow keys orbit; the wheel and +/- zoom. There is no WebGL dependency, external CDN, or model download. Mouse picking chooses a displayed glyph; the query/key dropdowns and full coordinate table are the exact accessible alternative when glyphs overlap. `Reset view` restores the camera.

## Context and image handling

Text uses at most 24 whitespace-delimited teaching tokens per block. This is not BPE or a checkpoint tokenizer. Visual presets provide one image, three frames, or two images separated by text. A 3×3, 4×4 or 6×6 grid indexes patch tokens. Vision special tokens and checkpoint patch/temporal merging are not simulated.

The sample image is rendered locally at 48×48 pixels. Uploaded PNG/JPEG/WebP files (up to 12 MB) are decoded and resampled in-browser. Uploaded images stay local; the same uploaded frame repeats in video mode. No prompt, image bytes, token labels, color features, or coordinate exports are sent to analytics. A configuration link contains only allowlisted method/settings values and restores the sample context. Exported JSON intentionally includes current token labels; it omits image bytes.

## Scores and their limits

`Position only` uses identical `(1,0)` query/key pairs for rotary and bias methods. Additive encodings use zero content plus their position vectors. Rotary logits are the exact dot products under those assumptions, scaled by `1/sqrt(48)` and the visible temperature. The optional toy-content mode uses simple RGB features and a few explicit color-word mappings. It does not understand arbitrary text or identify objects with a vision encoder.

The chosen query's distribution is normalized over eligible, unmasked keys. Causality follows the **sequence index**, not any compressed/reset position ID. Two-dimensional vision-only methods exclude text and ignore frame order. The UI exposes that omission rather than inventing a multimodal extension. MHRoPE displays one selected head at a time; it does not average kernels and call the result multi-head attention.

Pixel attention is not computed. A patch's attention weight colors its tile; the patch close-up makes the many-pixels/one-token distinction explicit. Attention colors are scaled relative to the highest-weight key in the displayed row; numeric percentages and modality masses are the actual normalized values.

## Source conventions and deliberate simplifications

| Method | Convention used here | Primary implementation/paper |
| --- | --- | --- |
| M-RoPE | Visual IDs `(start+frame,start+row,start+column)`; subsequent text starts after maximum ID. | [Qwen2-VL](https://arxiv.org/abs/2409.12191), [pinned HF code](https://github.com/huggingface/transformers/blob/v4.57.1/src/transformers/models/qwen2_vl/modeling_qwen2_vl.py) |
| Interleaved allocation | Isolates interleaving with unchanged baseline geometry; does not claim to implement the whole Qwen3 video pipeline. | [Qwen3-VL pinned implementation](https://github.com/huggingface/transformers/blob/v4.57.1/src/transformers/models/qwen3_vl/modeling_qwen3_vl.py) |
| MRoPE-I / MHRoPE | Paper spatial reset `(start+frame,row,column)`, preserving unreset segment extent for following text. Equal thirds of pairs or selected full-spectrum head. | [Paper](https://arxiv.org/html/2510.23095v1), [authors' spatial-reset implementation](https://github.com/JJJYmmm/Multimodal-RoPEs/blob/main/multimodal_ropes/pos_design/mrope_i.py) |
| Circle-RoPE | CIP with 50/50 mixed angle, adjustable fixed radius, circle normal `(1,1,1)`. Text and image centers use a diagonal sequence. AGE alternation not simulated; per-frame circles are a teaching extension. | [v3 paper](https://arxiv.org/html/2505.16416v3), [authors' code](https://github.com/lose4578/CircleRoPE/blob/main/code/circle_rope.py) |
| VRoPE | Paper four-direction ordering, frame advance `H+W−1`. Plot `(frame center, centered row, centered column)`, expose four IDs. | [v2 paper](https://arxiv.org/html/2502.11664v2) |
| VideoRoPE | Floor-centered row/column offsets around frame time; text resumes at last temporal ID + 1. Spatial pairs interleaved, temporal pairs use low frequencies. | [Paper](https://arxiv.org/html/2502.05173v1), [official implementation](https://github.com/Wiselnn570/VideoRoPE/blob/main/videorope-transformer/modeling_videorope.py) |
| YaRN | Frequency-ramp construction, original length 128, beta-fast 32, beta-slow 1; both Q and K scale by `1+0.1 ln(s)`. | [Paper](https://arxiv.org/html/2309.00071v2), [pinned HF code](https://github.com/huggingface/transformers/blob/v4.57.1/src/transformers/modeling_rope_utils.py) |
| V2PE | First position zero; each subsequent text token adds 1, each visual token adds the selected fractional increment. | [Paper §3.2](https://arxiv.org/html/2412.09616v2) |

All rotary examples use 24 pairs / 48 dimensions for inspectability. The three-axis examples use equal allocations to isolate mechanisms. These are **not** released checkpoint ratios. For example Qwen2-VL commonly uses `[16,24,24]` pairs and a Qwen3-VL interleaved configuration uses `[24,20,20]`; unequal interleaving must preserve global pair frequencies and its appropriate tail assignment. Do not generalize `j % 3` to arbitrary unequal checkpoint sections.

Learned absolute, Shaw, and T5 values are deterministic example tables, not learned checkpoint parameters. The 2D mixed RoPE directions are illustrative initializations. Context-extension demos transform indices/frequencies; they do not run finetuning or establish benchmark improvements. Equal Circle-RoPE Euclidean distances do not imply equal trained attention, nor preservation of every original image-grid distance.

## Adding a method

1. Read a primary source and, when available, its official implementation. Record version-specific behavior.
2. Add a source-linked catalog entry in `public/atlas-data.js`, with explicit scope and limitations.
3. Implement coordinate, phase or logit behavior in `public/atlas-math.js`. Preserve one common context and sequence-index mask.
4. Add independent mathematical checks: boundary cases, expected coordinates, normalization, and invariants from the construction.
5. Add only necessary parameter controls. Do not draw a new geometry when a method changes frequencies or logits alone.
6. Verify image/video/text-only contexts in the browser, including keyboard operation and mobile layout.
7. If the exact construction is not yet checked, keep it in `furtherReading`, not the implemented selector.

Tests run with `npm test`; build and GitHub Pages deployment use the existing pipeline.
