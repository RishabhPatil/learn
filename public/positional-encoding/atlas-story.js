// Teaching order, not a chronology or a ranking of model quality.
export const corePath = ['sinusoidal','learned','rope','pi','yarn','axial','mixed','mrope','time-mrope'];
export const researchPath = ['interleaved','mrope-i','mhrope','circle','vrope','videorope','v2pe'];
export const alternativePath = ['none','shaw','t5','alibi'];

// Motivations are scoped to the primary sources linked by each method's notes.
export const stories = {
  none: {
    question:'What is missing without a position signal?',
    problem:'A token tells us what is present, but its content alone does not tell us where it occurs. Without position signals or order-dependent masks, permuting a self-attention input simply permutes its outputs.',
    idea:'Use this control to separate the order we draw on screen from the positional information supplied to the model.',
    tradeoff:'This is a diagnostic baseline. An actual architecture can obtain order information from masks or other components even without an explicit position embedding.'
  },
  sinusoidal: {
    question:'How does a model know which token came first?',
    problem:'“Dog bites man” and “Man bites dog” contain the same words, but order changes the meaning. The original Transformer needed a position signal because its architecture did not process tokens through recurrence or convolution.',
    idea:'Add a fixed pattern of slow and fast waves to each token. The pattern identifies its position, and shifting position has a predictable effect on each wave pair.',
    tradeoff:'The formula exists beyond training positions; that does not guarantee a trained model will use those positions well. Next, consider learning the position patterns instead of choosing waves.'
  },
  learned: {
    question:'Why prescribe the position pattern at all?',
    problem:'Fixed waves are one design choice. A learned table instead lets training choose a vector for each position. The original Transformer compared both; later Vision Transformer also used learned position embeddings.',
    idea:'Treat a position as an address in a trainable table. Inspect two rows, then change the example seed to see what the lookup rule leaves unspecified.',
    tradeoff:'A finite table needs adaptation for new positions or image grids. Next, RoPE asks a different question: can the positional relation between two tokens depend directly on their separation?'
  },
  rope: {
    question:'Can absolute positions produce a relative relationship?',
    problem:'“One token to my left” is useful wherever a phrase occurs. RoFormer sought a transformation that acts on each token separately while making the positional part of a query–key comparison depend on their offset.',
    idea:'Rotate pairs of query and key components by position-dependent angles. Comparing the rotations cancels the shared position shift, leaving an angle determined by the distance between tokens.',
    tradeoff:'Shift both selected tokens in the experiment: their relative phases stay fixed. But rotations defined at any index do not guarantee reliable use of longer contexts; that motivates the next chapter.'
  },
  pi: {
    question:'What happens beyond the training context?',
    problem:'A RoPE model can encounter unfamiliar positional relationships when asked to use a longer sequence. Position Interpolation was developed to adapt a pretrained model without simply extending its position indices past the trained range.',
    idea:'Squeeze a longer sequence into that range by dividing every position by an extension factor. Watch all frequency pairs respond to the same compression.',
    tradeoff:'Compression also makes neighboring positions less separated in phase. The published method fine-tunes the model; moving this slider alone does not extend a real model. YaRN next treats frequencies differently.'
  },
  yarn: {
    question:'Must every frequency be compressed equally?',
    problem:'Position Interpolation scales fast and slow rotations alike. YaRN addresses context extension with a frequency-dependent rule, preserving fast-changing positional detail while stretching slower scales.',
    idea:'Keep fast frequencies, interpolate slow ones, and blend between them. Compare pairs across the frequency bank while changing the same extension factor.',
    tradeoff:'The viewer isolates frequency scaling; YaRN also uses magnitude correction and training. The next chapter changes the problem from longer text to the two-dimensional structure of images.'
  },
  axial: {
    question:'Is an image really a line of tokens?',
    problem:'Flattening patches assigns sequence indices, but a one-step move in that sequence is not always a one-patch move in the image. Spatial RoPE keeps row and column displacement explicit.',
    idea:'Give height and width their own rotation pairs. Compare horizontal and vertical neighbors: different parts of the frequency bank respond.',
    tradeoff:'Each pair sees only one axis. Mixed RoPE next asks whether a single pair can respond along a direction that combines both axes.'
  },
  mixed: {
    question:'Why restrict rotations to horizontal or vertical?',
    problem:'Axial RoPE separates height and width. The vision RoPE study explores a more flexible construction in which each rotation pair has a two-dimensional frequency direction.',
    idea:'Project a patch’s coordinates onto that direction to obtain its phase. Turn the direction while leaving the patch grid fixed.',
    tradeoff:'The paper can learn these directions; this slider shows illustrative directions. Next, M-RoPE addresses a separate challenge: combining text, images, and video in one positional scheme.'
  },
  mrope: {
    question:'How can text, images, and video share positions?',
    problem:'Text has a sequence order, an image has rows and columns, and video adds time. Qwen2-VL introduced M-RoPE to represent those structures together instead of giving every visual patch only a flattened sequence index.',
    idea:'Use three position IDs: time, height, and width. Text repeats its index on all three axes; visual tokens retain their spatial and temporal coordinates.',
    tradeoff:'Coordinates are only half the design: frequency allocation matters too. And a frame number does not say how much time elapsed. The final core chapter addresses elapsed time; optional branches revisit allocation and geometry.'
  },
  'time-mrope': {
    question:'Does the next frame mean the next second?',
    problem:'Frame indices alone do not distinguish dense sampling from large gaps in time. Qwen2.5-VL ties temporal positions to absolute video time to support varying sampling rates and temporal localization.',
    idea:'Drive the temporal coordinate with a timestamp and a ticks-per-second scale. Switch to irregular timestamps and inspect the final frame’s displacement.',
    tradeoff:'Timestamps encode elapsed time, not motion by themselves. This completes the core path. Research branches explore frequency allocation, cross-modal geometry, and video-specific design; none is presented as a universal winner.'
  },
  shaw: {
    question:'Why encode the gap between tokens directly?',
    problem:'An absolute slot is not the same as a relation such as “two tokens earlier.” Shaw and colleagues introduced relative representations that describe pairs using their signed separation.',
    idea:'Use the offset to look up a learned vector, clipping large distances to a bounded range.',
    tradeoff:'Clipping makes sufficiently distant offsets share a representation. This example shows the key-relative term; the paper also includes value-relative vectors.'
  },
  t5: {
    question:'How much detail does a distant offset need?',
    problem:'Representing every possible separation independently is expensive and may give unnecessary precision far away. T5 uses a compact relative-position bias with finer distinctions nearby.',
    idea:'Map nearby offsets to narrow buckets and farther offsets to wider buckets. Each bucket selects a learned scalar.',
    tradeoff:'Different distances can share a bucket. The bucket is exact here, but its displayed scalar is illustrative; it is not a value from a trained T5 model.'
  },
  alibi: {
    question:'Can a simple distance rule help with longer text?',
    problem:'ALiBi investigated training on short sequences and evaluating on longer ones. It avoids a learned position table and supplies a fixed distance-dependent bias.',
    idea:'Apply a more negative positional term to more distant earlier tokens, with a different slope for each head.',
    tradeoff:'The penalty favors nearby positions but does not determine the final content-dependent result. The slider illustrates one head, not a benchmark of context-length generalization.'
  },
  interleaved: {
    question:'Why should one axis get only one frequency band?',
    problem:'Contiguous M-RoPE sections give time, height, and width different parts of the frequency spectrum. Interleaving redistributes the axes without changing their position IDs.',
    idea:'Alternate axis assignments across rotation pairs. The geometry stays still; the colored allocation and phase responses change.',
    tradeoff:'This is an isolated comparison inspired by Qwen3-VL, not its complete position pipeline. Read MRoPE-I next to separate interleaving from spatial reset.'
  },
  'mrope-i': {
    question:'Should an image’s local grid depend on preceding text?',
    problem:'The MRoPE-I study examines both coordinate design and uneven frequency coverage in multimodal RoPE.',
    idea:'This paper variant resets visual height and width to local coordinates, then interleaves axes across frequencies.',
    tradeoff:'Compare with Interleaved allocation to isolate reset. Implementations can disable reset; those are not the same coordinate rule.'
  },
  mhrope: {
    question:'Can every axis use a full frequency bank?',
    problem:'Splitting one head between several axes limits each axis’s frequency coverage. MHRoPE investigates distributing axes across heads instead.',
    idea:'Assign a whole head to one axis and use its complete frequency bank. Switch heads to see which displacement becomes visible.',
    tradeoff:'One head then distinguishes only its assigned coordinate. The viewer does not combine trained heads or establish a model-quality improvement.'
  },
  circle: {
    question:'Should a text position favor one side of an image?',
    problem:'Circle-RoPE studies unwanted cross-modal positional bias when image coordinates and text order share an index geometry.',
    idea:'Project patches onto a circle perpendicular to the text diagonal. A text point on that diagonal is equally far from every patch on the circle.',
    tradeoff:'Equal Euclidean distance does not mean identical phases or model responses. The paper’s claims require its stated assumptions; its alternating grid/circle layers are not simulated here.'
  },
  vrope: {
    question:'Can video coordinates avoid a preferred spatial direction?',
    problem:'VRoPE targets spatial positional bias and discontinuities where video tokens meet text in existing video encodings.',
    idea:'Combine height and width into four symmetric directional streams, then advance them together across frames.',
    tradeoff:'Four IDs cannot be shown as four independent axes in this 3D scene: use the inspector for all four. VRoPE and VideoRoPE are separate papers, not successive versions.'
  },
  videorope: {
    question:'Why assign fast rotations to a long video timeline?',
    problem:'VideoRoPE analyzes temporal frequency allocation and periodically repeated phase patterns that can confuse long-video retrieval.',
    idea:'Reserve slow frequencies for time, center frames on a diagonal layout, and control temporal spacing separately.',
    tradeoff:'The visual reveals phase changes, not retrieval accuracy. Low frequencies do not remove periodicity; the paper evaluates a complete trained configuration.'
  },
  v2pe: {
    question:'Must every image patch consume a full position step?',
    problem:'Images and video can occupy many tokens in a multimodal context. V2PE investigates smaller visual increments to reduce the positional span consumed by those tokens.',
    idea:'Advance text positions by one and visual positions by a smaller fraction. Watch the visual segment contract without removing patches.',
    tradeoff:'A smaller positional span is not a smaller token count or KV cache. This one-dimensional scheme does not preserve separate row and column coordinates; the paper also trains with variable increments.'
  }
};

export function chapterAfter(id) {
  const index=corePath.indexOf(id);
  return index>=0 ? corePath[index+1] ?? null : null;
}
