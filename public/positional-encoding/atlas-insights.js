import { lessonPreset, sampleText } from './atlas-walkthrough.js';
import { buildContext, phase, pairInfo, relativeEncoding, PAIRS } from './atlas-math.js';

export const number = value => Number(value.toPrecision(4)).toString();
const delta = (a,b) => b.ids.map((x,i)=>x-a.ids[i]);
const tuple = values => '('+values.map(number).join(', ')+')';

export const experiments = {
  none:['Move B farther away','Bring B closer'],
  sinusoidal:['Move B farther away','Compare neighboring tokens'],
  learned:['Try another table seed','Restore the first table'],
  shaw:['Compare offset 12','Compare offset 9'],
  t5:['Compare offset 11','Compare offset 9'],
  alibi:['Double the slope','Restore the slope'],
  rope:['Shift both tokens by two','Restore the token pair'],
  pi:['Use factor 1: ordinary RoPE','Use extension factor 4'],
  yarn:['Use factor 1: ordinary RoPE','Use extension factor 4'],
  axial:['Compare a row neighbor','Compare a column neighbor'],
  mixed:['Turn the direction to 45°','Align the direction to 0°'],
  mrope:['Compare a row neighbor','Compare a column neighbor'],
  interleaved:['Compare a row neighbor','Compare a column neighbor'],
  'mrope-i':['Compare the next image','Compare within one image'],
  mhrope:['Use a temporal head','Use a height head'],
  circle:['Choose another patch on the circle','Restore the first patch'],
  vrope:['Move across one row','Compare opposite corners'],
  videorope:['Double frame spacing','Restore frame spacing'],
  v2pe:['Use whole-token increments','Use quarter-token increments'],
  'time-mrope':['Use irregular timestamps','Use uniform timestamps'],
};

// Each action supplies a small reproducible comparison, independent of custom settings.
export function experimentPreset(id, alternate) {
  const p=lessonPreset(id,3);p.step=4;p.view='encoded';
  const context=buildContext({scene:p.scene,grid:4,...sampleText(id)}),first=context.groups[0]?.start??2;
  switch(id){
    case 'none': case 'sinusoidal':p.query=2;p.key=alternate?7:3;break;
    case 'learned':p.query=2;p.key=3;p.options.seed=alternate?7:3;break;
    case 'shaw':p.query=2;p.key=alternate?14:11;break;
    case 't5':p.query=2;p.key=alternate?13:11;break;
    case 'alibi':p.query=7;p.key=0;p.options.slope=alternate ? .24 : .12;break;
    case 'rope':p.query=alternate?4:2;p.key=p.query+1;break;
    case 'pi':case 'yarn':p.query=2;p.key=7;p.options.scale=alternate?1:4;break;
    case 'axial':case 'mrope':case 'interleaved':p.query=first;p.key=first+(alternate?4:1);break;
    case 'mixed':p.query=first;p.key=first+1;p.options.angle=alternate?45:0;break;
    case 'mrope-i':{
      p.scene='two-images';const c=buildContext({scene:p.scene,grid:4,...sampleText(id)});
      p.query=c.groups[0].start+1;p.key=alternate?c.groups[1].start:c.groups[0].start;p.pair=0;break;
    }
    case 'mhrope':p.query=first;p.key=first+4;p.options.head=alternate?0:1;break;
    case 'circle':p.query=context.tokens.length-1;p.key=first+(alternate?15:0);break;
    case 'vrope':p.query=first;p.key=first+(alternate?3:15);break;
    case 'videorope':p.query=first;p.key=first+32;p.options.stride=alternate?4:2;break;
    case 'v2pe':p.query=first;p.key=first+15;p.options.increment=alternate?1:.25;break;
    case 'time-mrope':p.query=first;p.key=first+32;p.options.timing=alternate?'irregular':'uniform';break;
    default:throw new Error('No experiment for '+id);
  }
  return p;
}

export function insight(id,a,b,options,pair) {
  const d=delta(a,b),offset=b.token.id-a.token.id,r=relativeEncoding(a,b,id,options);
  const changed=Array.from({length:PAIRS},(_,j)=>phase(b,id,j,options)-phase(a,id,j,options)).filter(v=>Math.abs(v)>1e-10).length;
  const responding=`${changed} of ${PAIRS} pairs have a nonzero phase difference.`;
  switch(id){
    case 'none':return `A and B are ${Math.abs(offset)} sequence steps apart, but neither receives an explicit positional signal.`;
    case 'sinusoidal':return 'Each neighboring pair of component slots holds sine and cosine at one frequency. The horizontal axis is component number, not token position.';
    case 'learned':return `A reads table row ${a.token.id}; B reads row ${b.token.id}. Changing the seed changes the example values, not these row addresses.`;
    case 'shaw':return `Offset ${offset} is clipped to ${r.index}. All offsets ${r.index===8?'at or above 8':r.index===-8?'at or below −8':'with this clipped value'} use the same relative vector.`;
    case 't5':return `Offset ${offset} selects bucket ${r.index}. For example, offsets +8 through +11 share bucket 24; +12 starts bucket 25. A bucket is a table address, not the bias value.`;
    case 'alibi':return offset>0?'B is after A, outside this causal example. Choose B at or before A to see a distance penalty.':`Penalty = −${-offset} × ${number(options.slope)} = ${number(r.values[0])}. Every extra step into the past adds the same penalty.`;
    case 'rope':return `The position difference is ${number(d[0])}. Moving both tokens equally keeps every phase difference unchanged, although their absolute angles move.`;
    case 'pi':return `${offset} sequence steps become ${number(d[0])} position units: a scale of 1/${options.scale}. The camera fits the scene, so numeric distances reveal the compression.`;
    case 'yarn':{
      const ratio=pairInfo(id,pair,options).frequency/options.base**(-pair/PAIRS);
      return `Pair ${pair} uses ${number(ratio)}× its ordinary RoPE frequency. Fast pairs can stay unchanged while slower pairs are compressed; token IDs stay fixed.`;
    }
    case 'mixed':return `The selected direction is ${options.angle+(pair%2)*90}° from the width axis. Row and column displacement ${tuple(d)} are projected onto that direction; the patch grid stays fixed.`;
    case 'axial':return `Row/column difference: ${tuple(d)}. ${responding} A single-axis move leaves the other axis’s pairs unchanged.`;
    case 'mrope':return `Δ(time, row, column) = ${tuple(d)}. ${responding} Responsive pairs sit in contiguous axis blocks.`;
    case 'interleaved':return `Δ(time, row, column) = ${tuple(d)}. ${responding} The same coordinate rule as M-RoPE is distributed across interleaved pairs.`;
    case 'mrope-i':return `A IDs ${tuple(a.ids)}; B IDs ${tuple(b.ids)}. Each visual segment restarts row and column at zero. Within-image displacement survives the reset; relationships to text and other images can change.`;
    case 'mhrope':return `This entire grid is one ${['temporal','height','width'][options.head]} head. ${responding} Other axes are ignored by this head’s positional construction.`;
    case 'circle':return `A–B distance in the projected 3D space: ${number(Math.hypot(...d))}. A fixed text point is equally far from every patch on one circle, but their rotation angles can differ.`;
    case 'vrope':return `Four directional ID differences: ${tuple(d)}. ${responding} A movement can cancel in some directions; the 3D scene parameterizes all four IDs.`;
    case 'videorope':return `Δ(time, row, column) = ${tuple(d)}. Time drives the last eight, slowest pairs here. Advancing a frame also advances its spatial reference along the diagonal.`;
    case 'v2pe':return `${offset} sequence steps become ${number(d[0])} position units. Visual increments are ${number(options.increment)}; every visual token remains present.`;
    case 'time-mrope':return `Temporal ID difference: ${number(d[0])}, at ${options.stride} ticks per second. Irregular timestamps change the time-driven phases without changing row or column IDs.`;
    default:return responding;
  }
}

export function readingGuide(id,rotary){
  if(rotary)return (id==='mhrope'?'A head is one group of channels. This grid shows the positional rotations for one such group. ':'')+(id==='circle'?'The large circle in 3D is a patch-position layout; the small circles here are separate rotation planes. ':'')+'Each small circle represents a pair of numeric channels: two components rotated together. Amber A and blue B are the selected tokens. Arrows show position-only angles on unit circles, not trained token vectors. Frequency means radians turned per position unit; later pairs generally turn more slowly. Labels identify the coordinate or direction. A dot (•) marks a nonzero unwrapped phase difference, even when it is too small to see. A full turn is 2π radians, so different unwrapped angles can point the same way. The 3D explorer shows position IDs, not these channel planes.';
  if(id==='sinusoidal'||id==='learned')return 'A token is represented by a list of numbers, called a vector. Each horizontal slot is one component of the positional vector, not a token. Amber and blue are the two selected positions. These components are added to token representations. Sinusoidal values follow a formula; learned-table values here are reproducible illustrations, not pretrained weights.';
  if(id==='none')return 'Positions still have labels so you can select tokens. This baseline supplies no explicit position vector, rotation, or distance bias. The displayed spacing is only a reference.';
  return 'An offset is B’s sequence index minus A’s. The diagram maps that offset to a clipped table address, bucket, or distance penalty. Shaw and T5 table values are illustrative. ALiBi’s penalty is computed directly from distance and slope; future positions are outside this example’s causal domain.';
}
