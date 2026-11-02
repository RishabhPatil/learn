// Scientific introductions for the method pages. Equations describe the
// construction; distinction records the scope of this executable illustration.
export const referenceWriteups = {
  none: {
    paragraphs: [
      'This control removes explicit positional vectors, rotations, and relative-position terms. The displayed sequence index identifies a token for inspection; it is not supplied as a positional encoding.',
      'The control separates the existence of an ordered input from an explicit representation of that order. It is a reference condition, not a proposed encoding or a claim that every architecture without positional embeddings is insensitive to order.'
    ],
    equations: ['e(p) = 0; no positional rotation or bias'],
    notation: 'p is the token’s sequence index; e is an additive positional vector.',
    distinction: 'The line is a display convention. It does not represent a learned embedding.',
    references: [{label:'Vaswani et al. (2017), §3.5 · positional encoding',url:'https://arxiv.org/html/1706.03762v7'}]
  },
  sinusoidal: {
    paragraphs: [
      'The original Transformer adds a deterministic positional vector to each token embedding. Sine and cosine channels share a frequency in pairs, with wavelengths increasing geometrically across the embedding dimensions.',
      'A shift in position rotates each sine–cosine pair by a fixed angle. This makes relative offsets expressible through linear transformations of the positional vector, while the input representation itself remains an absolute-position encoding.'
    ],
    equations: ['e(p, 2j) = sin(pθⱼ); e(p, 2j+1) = cos(pθⱼ)', 'θⱼ = B^(−2j/d); x′ₚ = xₚ + e(p)'],
    notation: 'p: position; j: channel-pair index; d: encoding dimension; B: frequency base (10,000 in the original formulation).',
    distinction: 'The component plot shows the positional vector alone. Flattened image indices do not preserve a separate height and width coordinate.',
    references: [{label:'Vaswani et al. (2017), §3.5 · Attention Is All You Need',url:'https://arxiv.org/html/1706.03762v7'}]
  },
  learned: {
    paragraphs: [
      'Learned absolute encoding assigns a trainable vector to each position in a finite table and adds it to the corresponding token embedding. Unlike sinusoidal encoding, the construction does not prescribe a frequency spectrum or an analytic relationship between nearby positions.',
      'Vision Transformer uses learned position embeddings for its patch sequence. A change in image resolution changes the patch grid; the published adaptation interpolates the spatial position embeddings when transferring to a different resolution.'
    ],
    equations: ['e(p) = E[p]; x′ₚ = xₚ + E[p]'],
    notation: 'E is a learned table of position vectors; p selects a row. A patch token represents a region containing multiple pixels.',
    distinction: 'The atlas uses deterministic example values, not a trained table. Its coordinate line indexes rows of E and does not visualize the embedding space.',
    references: [{label:'Dosovitskiy et al. (2020), §3.1–3.2 · Vision Transformer',url:'https://arxiv.org/abs/2010.11929'}]
  },
  shaw: {
    paragraphs: [
      'Shaw relative position representations index learned vectors by the signed offset between two tokens. Offsets are clipped to a fixed window, so sufficiently distant pairs in the same direction share one representation.',
      'The key-relative vector contributes through its dot product with the query. The paper also defines value-relative vectors; these are a separate positional contribution to the output, rather than part of the coordinate system.'
    ],
    equations: ['r(i,j) = clip(j−i, −K, K)', 'aᴷᵢⱼ = Eᴷ[r(i,j)]; positional logit term = qᵢᵀaᴷᵢⱼ / √d'],
    notation: 'i,j: token indices; K: clipping distance; Eᴷ: learned relative-key table; qᵢ: query vector; d: its dimension.',
    distinction: 'This illustration uses K=8 and example table values. The operative positional object is an offset-indexed vector, not a new 3D location.',
    references: [{label:'Shaw, Uszkoreit & Vaswani (2018), §3 · relative position representations',url:'https://arxiv.org/abs/1803.02155'}]
  },
  t5: {
    paragraphs: [
      'T5 represents relative position with a learned scalar for each distance bucket and head. The scalar is added to the query–key logit. Nearby offsets receive fine resolution; more distant offsets share increasingly wide logarithmic buckets.',
      'The bucket assignment is deterministic, while the scalar values are learned. Direction handling differs between the bidirectional and causal versions; the atlas uses the bidirectional mapping to expose signed offsets without a mask control.'
    ],
    equations: ['r = j−i; bᵃ(i,j) = βᵃ[bucket(r)]'],
    notation: 'i,j: token indices; a: head; βᵃ: learned scalar table. Here 32 buckets split across directions, with a maximum-distance parameter of 128.',
    distinction: 'The displayed bias is a reproducible example, not a pretrained T5 value. Bucketing is a relative-position rule and does not create an absolute embedding vector.',
    references: [{label:'Raffel et al. (2019), §2.1 · T5 relative position embeddings',url:'https://arxiv.org/abs/1910.10683'}]
  },
  alibi: {
    paragraphs: [
      'ALiBi supplies position through a linear bias rather than an additive embedding or rotary transform. In its causal formulation, the bias decreases with the distance to an earlier token.',
      'Different heads receive different fixed slopes. The resulting positional function is defined for arbitrary distances without extending a learned position table; this mathematical property alone does not guarantee task performance at arbitrary lengths.'
    ],
    equations: ['bᵃ(i,j) = −mᵃ(i−j), for j ≤ i'],
    notation: 'i: current position; j: earlier position; mᵃ>0: the slope assigned to head a.',
    distinction: 'The slider illustrates one slope. A later comparison token lies outside the original causal domain; the atlas does not substitute a symmetric extension.',
    references: [{label:'Press, Smith & Lewis (2021) · Attention with Linear Biases',url:'https://arxiv.org/abs/2108.12409'}]
  },
  rope: {
    paragraphs: [
      'Rotary Position Embedding applies a position-dependent rotation to two-dimensional channel pairs of queries and keys. Each pair has its own angular frequency; rotation preserves the pair’s Euclidean norm.',
      'Composing the rotations for two positions yields a rotation by their difference. This is the source of RoPE’s relative-position dependence, even though each token is transformed using an absolute index. RoPE was introduced for language and subsequently adapted to spatial and multimodal inputs.'
    ],
    equations: ['φⱼ(p) = pθⱼ; θⱼ = B^(−2j/d)', 'R(φ) = [[cos φ, −sin φ], [sin φ, cos φ]]', 'R(p₁θ)ᵀR(p₂θ) = R((p₂−p₁)θ)'],
    notation: 'p: position; j: rotation-pair index; d: rotary dimension; B: base. Angles are in radians.',
    distinction: 'The scene shows scalar position IDs, while the phase wheel shows one rotation pair. Neither is a projection of trained hidden states.',
    references: [{label:'Su et al. (2021), §3 · RoFormer',url:'https://arxiv.org/abs/2104.09864'}]
  },
  pi: {
    paragraphs: [
      'Position Interpolation rescales RoPE’s position argument to fit a longer sequence into the positional range used during training. All rotary frequencies are affected equally.',
      'Dividing positions by s is equivalent to dividing every frequency by s. This compresses both long-range and adjacent-token phase differences. The published context-extension method includes model fine-tuning; the coordinate transformation is only one part of that procedure.'
    ],
    equations: ['p′ = p/s; φⱼ(p) = (p/s)θⱼ', 'Δφⱼ = (p₂−p₁)θⱼ/s'],
    notation: 's≥1: context-extension factor; θⱼ: original RoPE frequency; p₁,p₂: positions being compared.',
    distinction: 'The shrunken line directly represents the rescaled IDs. No model is fine-tuned or evaluated in this illustration.',
    references: [{label:'Chen et al. (2023) · Extending Context Window via Positional Interpolation',url:'https://arxiv.org/abs/2306.15595'}]
  },
  yarn: {
    paragraphs: [
      'YaRN uses a frequency-dependent rescaling of RoPE. Fast-rotating channels retain their original frequencies, slow channels receive interpolation, and a transition region blends these regimes according to wavelength relative to the original context length.',
      'Consequently, there is no single compressed coordinate that describes every channel. YaRN also includes a magnitude correction and a training procedure; the explorer isolates its frequency construction rather than reproducing the complete extension method.'
    ],
    equations: ['θ′ⱼ = (1−γⱼ)θⱼ + γⱼθⱼ/s; φⱼ(p) = pθ′ⱼ', 'γⱼ: 0 for fast channels → 1 for slow channels'],
    notation: 's: extension factor; γⱼ: interpolation ramp (the complement of conventions that weight extrapolation). The ramp depends on the original context length.',
    distinction: 'The teaching configuration uses 48 rotary dimensions, original length 128, and transition parameters 32 and 1. Position IDs remain unchanged.',
    references: [{label:'Peng et al. (2023), §3 · YaRN, version 2',url:'https://arxiv.org/html/2309.00071v2'}]
  },
  axial: {
    paragraphs: [
      'Axial 2D RoPE assigns each rotation pair to exactly one spatial coordinate. Row displacement changes the height pairs; column displacement changes the width pairs.',
      'A patch grid therefore retains two positional axes instead of being flattened into one. The cited vision study analyzes axial RoPE alongside mixed RoPE; it does not claim to introduce axial encoding.'
    ],
    equations: ['φ₂ⱼ(h,w) = wωⱼ; φ₂ⱼ₊₁(h,w) = hωⱼ'],
    notation: 'h,w: patch row and column; ωⱼ: frequency shared by one width/height pair of rotations.',
    distinction: 'This 2D construction has no temporal coordinate and does not encode text positions.',
    references: [{label:'Heo et al. (2024), §3.2 · axial frequency',url:'https://arxiv.org/html/2403.13298v1'}]
  },
  mixed: {
    paragraphs: [
      'Mixed 2D RoPE gives each rotation pair a two-component frequency vector. Its phase is a dot product with the patch coordinate, allowing directions that are not axis-aligned.',
      'The published method learns these frequency vectors. Axial RoPE is the special case in which one component of each frequency vector is zero.'
    ],
    equations: ['φⱼ(h,w) = fʰⱼh + fʷⱼw'],
    notation: 'fʰⱼ,fʷⱼ: height and width frequency components; h,w: patch coordinates.',
    distinction: 'The slider rotates an illustrative orthogonal initialization. It does not show learned directions.',
    references: [{label:'Heo et al. (2024), §3.2 · mixed learnable frequency',url:'https://arxiv.org/html/2403.13298v1'}]
  },
  mrope: {
    paragraphs: [
      'Qwen2-VL’s M-RoPE assigns each visual token three position IDs: temporal, height, and width. Rotary pairs are divided into contiguous sections, each driven by one coordinate. Text repeats its scalar position across all three streams.',
      'An image shares a temporal ID while its patches vary across height and width; video additionally varies the temporal ID. After a visual segment, text resumes beyond that segment’s largest position ID. Position IDs refer to visual tokens after processing, not independently to each raw pixel.'
    ],
    equations: ['mvisual = (s+f, s+h, s+w); mtext = (p,p,p)', 'φⱼ = m[a(j)]θⱼ; next text ID = s + max(F,H,W)'],
    notation: 's: segment start; f,h,w: zero-based frame/row/column; F,H,W: segment extents; a(j): axis assigned to pair j.',
    distinction: 'The atlas uses equal axis sections and unit frame spacing. Real checkpoints specify their own section sizes, patch merging, and special-token conventions.',
    references: [{label:'Wang et al. (2024), §2 · Qwen2-VL',url:'https://arxiv.org/abs/2409.12191'}]
  },
  interleaved: {
    paragraphs: [
      'Interleaving changes which coordinate drives each rotary frequency, while leaving the position IDs unchanged. Repeating temporal, height, and width assignments distributes each axis across the frequency range instead of confining it to one contiguous band.',
      'This entry isolates that allocation change using equal section sizes. Qwen3-VL’s implementation uses a configurable interleaved assignment; its complete video position construction includes additional conventions beyond this ablation.'
    ],
    equations: ['mvisual = (s+f, s+h, s+w)', 'a(j) = j mod 3; φⱼ = m[a(j)]θⱼ (equal-section example)'],
    notation: 'm is the position tuple; a(j)=0,1,2 selects temporal, height, or width for rotation pair j.',
    distinction: 'This is a named comparison configuration, not a separate paper or a full Qwen3-VL reproduction. Its geometry intentionally matches the M-RoPE baseline.',
    references: [{label:'Qwen3-VL implementation · apply_interleaved_mrope, Transformers v4.57.1',url:'https://github.com/huggingface/transformers/blob/v4.57.1/src/transformers/models/qwen3_vl/modeling_qwen3_vl.py'}]
  },
  'mrope-i': {
    paragraphs: [
      'MRoPE-Interleave distributes temporal, height, and width channels across the rotary spectrum. The paper combines this allocation with spatial reset: visual rows and columns restart at zero.',
      'Text retains repeated scalar IDs. Spatial reset changes visual coordinates without removing the segment span reserved before subsequent text.'
    ],
    equations: ['mvisual = (s+f,h,w); mtext = (p,p,p)', 'a(j) = j mod 3 (equal sections); next text ID = s+max(F,H,W)'],
    notation: 's: segment start; F,H,W: frame, row, and column counts.',
    distinction: 'This is the paper’s reset variant. Interleaving without reset is shown separately.',
    references: [
      {label:'Huang et al. (2025), §2.5 · MRoPE-Interleave',url:'https://arxiv.org/html/2510.23095v1'},
      {label:'Author implementation · spatial-reset position construction',url:'https://github.com/JJJYmmm/Multimodal-RoPEs/blob/main/multimodal_ropes/pos_design/mrope_i.py'}
    ]
  },
  mhrope: {
    paragraphs: [
      'Multi-Head RoPE assigns an entire head to one positional axis. Each assigned axis uses the full frequency bank within that head, rather than a subset of channels.',
      'The paper uses spatial-reset coordinates, as in MRoPE-I. A temporal-only head gives all patches within one image identical positional phases.'
    ],
    equations: ['mvisual = (s+f,h,w); φⱼ = m[a]θⱼ for every pair j in head a'],
    notation: 'a selects the head’s temporal, height, or width coordinate.',
    distinction: 'One head is inspected at a time; no learned head combination is simulated.',
    references: [{label:'Huang et al. (2025), §2.5 · Multi-Head RoPE',url:'https://arxiv.org/html/2510.23095v1'}]
  },
  circle: {
    paragraphs: [
      'Circle-RoPE’s circular image projection (CIP) maps patch indices to a circle whose plane is perpendicular to the text diagonal. Patch angles combine centered spatial angle with grid-order angle.',
      'For a fixed circle, every patch is equally far in Euclidean coordinate distance from a given text point on the normal axis. This geometric fact does not imply equal rotary phases. Version 3 also introduces alternating geometry encoding (AGE), which alternates circular and M-RoPE layouts across layers.'
    ],
    equations: ['m = c + R(cos α · u + sin α · v)', 'u·v = 0; ‖u‖=‖v‖=1; u,v ⟂ (1,1,1)'],
    notation: 'c: circle center on the text diagonal; R: radius; α: mixed patch angle; u,v: an orthonormal basis of the circle plane.',
    distinction: 'The atlas shows CIP with a 50/50 angle mix and adjustable radius. AGE is not implemented; circles for video frames are a teaching extension.',
    references: [{label:'Wang et al. (2025; v3 May 2026), §4 · Circle-RoPE',url:'https://arxiv.org/html/2505.16416v3'}]
  },
  vrope: {
    paragraphs: [
      'VRoPE constructs four symmetric spatial position streams, using both signs of the row and column directions. These directional streams are interleaved across rotary pairs and advanced together between frames.',
      'The representation has four IDs per visual token. The scene can therefore show only a three-dimensional parameterization of the construction; the inspector retains all four values. VRoPE and VideoRoPE are distinct research proposals.'
    ],
    equations: ['b = s + f(H+W−1)', 'm = b + (w+h, w−h+H−1, −w−h+H+W−2, −w+h+W−1)', 'next text ID = s + F(H+W−1)'],
    notation: 's: segment start; f,h,w: frame, row, column; F,H,W: extents. Adding b to a tuple means adding it to every component.',
    distinction: 'The displayed axes are frame center and centered row/column, not three of the four IDs or hidden embedding dimensions.',
    references: [{label:'Liu et al. (2025), §4 · VRoPE, version 2',url:'https://arxiv.org/html/2502.11664v2'}]
  },
  videorope: {
    paragraphs: [
      'VideoRoPE combines a diagonal layout of frame coordinates, adjustable temporal spacing, and low-frequency temporal allocation. Temporal pairs occupy the slowest frequencies; spatial coordinates use the faster part of the spectrum.',
      'The frame reference point advances along the text diagonal. Spatial offsets are measured around that reference, while the temporal spacing sets the distance between frames. Changing this spacing changes position IDs without changing the number of frame tokens.'
    ],
    equations: ['t = s + δf; m = (t, t+h−cₕ, t+w−c𝑤)', 'cₕ = floor((H−1)/2); c𝑤 = floor((W−1)/2)'],
    notation: 's: segment start; δ: frame spacing; f: frame index; h,w: patch coordinates. The floor-centered convention follows the linked implementation.',
    distinction: 'Equal section sizes are used for clarity. The scene is a coordinate example, not the paper’s full trained configuration.',
    references: [
      {label:'Wei et al. (2025), §4 · VideoRoPE',url:'https://arxiv.org/html/2502.05173v1'},
      {label:'Author implementation · diagonal position layout',url:'https://github.com/Wiselnn570/VideoRoPE/blob/main/videorope-transformer/modeling_videorope.py'}
    ]
  },
  v2pe: {
    paragraphs: [
      'Variable Visual Position Encoding compresses the positional span of visual tokens by allowing increments smaller than one. Text continues with unit increments. The resulting positions remain scalar and can be supplied to ordinary one-dimensional RoPE.',
      'This reduces the positional range occupied by a visual sequence without dropping tokens. It does not preserve a separate row/column lattice. The paper varies visual increments during training; a single fixed increment isolates the mechanism here.'
    ],
    equations: ['p₀ = 0; pᵢ = pᵢ₋₁ + δᵢ', 'δᵢ = 1 for text; δᵢ = δvisual for visual tokens; 0 < δvisual ≤ 1'],
    notation: 'The increment is selected from the current token’s modality. pᵢ is the cumulative scalar position, not the token count.',
    distinction: 'Fractional spacing changes phases, not tokenization. The atlas does not reproduce variable-increment training or context-length results.',
    references: [{label:'Ge et al. (2024) · Variable Visual Position Encoding',url:'https://arxiv.org/abs/2412.09616'}]
  },
  'time-mrope': {
    paragraphs: [
      'Qwen2.5-VL aligns the temporal stream of M-RoPE with elapsed video time. Temporal positions then express when a sampled frame occurs, rather than only its ordinal place in a sampled sequence.',
      'Height and width retain their spatial roles. Two samples separated by a larger time interval receive a larger temporal separation even if they are adjacent in the sampled frame list. This distinguishes timestamp-based construction from unit frame indexing.'
    ],
    equations: ['mvisual = (s + κτf, s+h, s+w)'],
    notation: 'τf: elapsed timestamp of frame f; κ: positional ticks per unit time; s: segment start; h,w: spatial token indices.',
    distinction: 'This entry isolates the absolute-time rule. Timestamp scaling is illustrative; temporal patch grouping and special tokens from the full pipeline are omitted.',
    references: [{label:'Bai et al. (2025), §2 · Qwen2.5-VL Technical Report',url:'https://arxiv.org/abs/2502.13923'}]
  }
};
